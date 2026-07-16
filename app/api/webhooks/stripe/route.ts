import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, getActiveConcorso, TICKET_PER_TIER } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_vercel_build_prerender');

export const dynamic = 'force-dynamic';

const PACK_CARDS: Record<string, number> = {
  bronze: 1,
  silver: 6,
  gold: 13,
  platinum: 27,
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('Stripe-Signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', errorMsg);
    return NextResponse.json({ error: `Webhook Error: ${errorMsg}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata && metadata.userId && metadata.packTier && metadata.packQuantity) {
      const userId = metadata.userId;
      const tier = metadata.packTier;
      const quantity = parseInt(metadata.packQuantity, 10);
      // concorsoId stored in metadata by checkout route
      const concorsoId = metadata.concorsoId || null;

      console.log(`[Webhook] Crediting ${quantity} ${tier} packs to user ${userId}, concorso ${concorsoId}`);

      // ── Credit pending_packs ───────────────────────────────────────────────
      const packsQuery = supabaseAdmin
        .from('pending_packs')
        .select('quantity')
        .eq('user_id', userId)
        .eq('tier', tier);

      if (concorsoId) {
        packsQuery.eq('concorso_id', concorsoId);
      } else {
        packsQuery.is('concorso_id', null);
      }

      const { data, error: selectError } = await packsQuery.maybeSingle();

      if (selectError && (selectError as { code?: string }).code !== 'PGRST116') {
        console.error('[Webhook] Error fetching packs:', selectError);
        return NextResponse.json({ error: 'Database select error' }, { status: 500 });
      }

      const currentQty = (data as { quantity?: number } | null)?.quantity ?? 0;
      const newQty = currentQty + quantity;
      const conflictTarget = concorsoId ? 'user_id,tier,concorso_id' : 'user_id,tier';

      const { error: upsertError } = await supabaseAdmin
        .from('pending_packs')
        .upsert(
          { user_id: userId, tier, quantity: newQty, concorso_id: concorsoId },
          { onConflict: conflictTarget }
        );

      if (upsertError) {
        console.error('[Webhook] Error upserting packs:', upsertError);
        return NextResponse.json({ error: 'Database upsert error' }, { status: 500 });
      }

      // ── Credit user_tickets ────────────────────────────────────────────────
      if (concorsoId) {
        const ticketsPerPack = TICKET_PER_TIER[tier] ?? 0;
        const numPurchased = Math.ceil(quantity / (PACK_CARDS[tier] ?? 1));
        const ticketsToAdd = ticketsPerPack * numPurchased;

        const { data: existingTickets } = await supabaseAdmin
          .from('user_tickets')
          .select('quantity')
          .eq('user_id', userId)
          .eq('concorso_id', concorsoId)
          .maybeSingle();

        const currentTickets = (existingTickets as { quantity?: number } | null)?.quantity ?? 0;

        await supabaseAdmin
          .from('user_tickets')
          .upsert(
            { user_id: userId, concorso_id: concorsoId, quantity: currentTickets + ticketsToAdd, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,concorso_id' }
          );

        console.log(`[Webhook] Credited ${ticketsToAdd} tickets to user ${userId} for concorso ${concorsoId}`);
      }

      // ── If no concorso in metadata, find current active one as fallback ────
      if (!concorsoId) {
        const activeConcorso = await getActiveConcorso();
        if (activeConcorso) {
          const ticketsToAdd = (TICKET_PER_TIER[tier] ?? 0) * Math.ceil(quantity / (PACK_CARDS[tier] ?? 1));
          const { data: existingTickets } = await supabaseAdmin
            .from('user_tickets')
            .select('quantity')
            .eq('user_id', userId)
            .eq('concorso_id', activeConcorso.id)
            .maybeSingle();
          const currentTickets = (existingTickets as { quantity?: number } | null)?.quantity ?? 0;
          await supabaseAdmin
            .from('user_tickets')
            .upsert(
              { user_id: userId, concorso_id: activeConcorso.id, quantity: currentTickets + ticketsToAdd, updated_at: new Date().toISOString() },
              { onConflict: 'user_id,concorso_id' }
            );
        }
      }

      console.log(`[Webhook] Successfully credited ${quantity} ${tier} packs to user ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
