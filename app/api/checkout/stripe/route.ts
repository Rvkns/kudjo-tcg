import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, getActiveConcorso, TICKET_PER_TIER } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_vercel_build_prerender');

const PRODUCTS: Record<string, { name: string; price: number; cards: number }> = {
  bronze:   { name: 'BRONZE #1',   price: 5.00,  cards: 1  },
  silver:   { name: 'SILVER #2',   price: 25.00, cards: 6  },
  gold:     { name: 'GOLD #3',     price: 50.00, cards: 13 },
  platinum: { name: 'PLATINUM #4', price: 100.00, cards: 27 },
};

async function creditPacksAndTickets(
  userId: string,
  tier: string,
  packsToCredit: number,
  concorsoId: string | null
) {
  // ── Ensure profile exists ────────────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    await supabaseAdmin.from('profiles').insert({ id: userId });
  }

  // ── Credit pending_packs ─────────────────────────────────────────────────
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

  const { data: existingPack } = await packsQuery.maybeSingle();
  const currentQty = (existingPack as { quantity?: number } | null)?.quantity ?? 0;
  const newQty = currentQty + packsToCredit;

  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    tier,
    quantity: newQty,
    concorso_id: concorsoId,
  };

  const conflictTarget = concorsoId
    ? 'user_id,tier,concorso_id'
    : 'user_id,tier';

  const { error: packsError } = await supabaseAdmin
    .from('pending_packs')
    .upsert(upsertPayload, { onConflict: conflictTarget });

  if (packsError) {
    console.error('[creditPacks] Error upserting packs:', packsError);
    throw new Error(`Database error (packs): ${packsError.message}`);
  }

  // ── Credit user_tickets (only if contest is active) ──────────────────────
  if (concorsoId) {
    const ticketsToAdd = (TICKET_PER_TIER[tier] ?? 0) * Math.ceil(packsToCredit / (PRODUCTS[tier]?.cards ?? 1));

    const { data: existingTickets } = await supabaseAdmin
      .from('user_tickets')
      .select('quantity')
      .eq('user_id', userId)
      .eq('concorso_id', concorsoId)
      .maybeSingle();

    const currentTickets = (existingTickets as { quantity?: number } | null)?.quantity ?? 0;
    const newTickets = currentTickets + ticketsToAdd;

    const { error: ticketsError } = await supabaseAdmin
      .from('user_tickets')
      .upsert(
        { user_id: userId, concorso_id: concorsoId, quantity: newTickets, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,concorso_id' }
      );

    if (ticketsError) {
      console.error('[creditPacks] Error upserting tickets:', ticketsError);
      // Non-fatal: log and continue
    } else {
      console.log(`[creditPacks] Credited ${ticketsToAdd} tickets to user ${userId} for concorso ${concorsoId}`);
    }
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
    }

    const { packId, quantity } = await request.json();
    const product = PRODUCTS[packId];
    if (!product) return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    if (!quantity || quantity < 1) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Fetch active concorso
    const concorso = await getActiveConcorso();
    const concorsoId = concorso?.id ?? null;

    if (!concorsoId) {
      console.warn('[Stripe] No active concorso found. Packs will be credited without contest association.');
    }

    const packsToCredit = product.cards * quantity;

    // ── Demo Mode ────────────────────────────────────────────────────────────
    const isDemoMode =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes('placeholder') ||
      process.env.STRIPE_SECRET_KEY.includes('dummy');

    if (isDemoMode) {
      console.log(`[DEMO MODE] Simulating Stripe checkout for user ${user.id}, concorso ${concorsoId}`);
      await creditPacksAndTickets(user.id, packId, packsToCredit, concorsoId);
      return NextResponse.json({ url: `${origin}/it/profilo?success=true&demo=true` });
    }

    // ── Real Stripe Session ──────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Kudjo TCG: ${product.name}`,
              description: `${packsToCredit} buste digitali${concorso ? ` — ${concorso.nome}` : ''}`,
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/it/profilo?success=true`,
      cancel_url: `${origin}/it/concorso?cancelled=true`,
      metadata: {
        userId: user.id,
        packTier: packId,
        packQuantity: packsToCredit.toString(),
        concorsoId: concorsoId ?? '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Stripe Checkout] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
