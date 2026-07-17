import { NextResponse } from 'next/server';
import { supabaseAdmin, getActiveConcorso, TICKET_PER_TIER } from '@/lib/supabase-admin';

const PACK_CARDS: Record<string, number> = {
  bronze: 1,
  silver: 6,
  gold: 13,
  platinum: 27,
};

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes('placeholder')) {
    throw new Error('PayPal client credentials are not configured.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await response.json();

    if (captureData.status === 'COMPLETED') {
      const purchaseUnit = captureData.purchase_units?.[0];
      const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;

      if (customId) {
        const { userId, packTier, packQuantity, concorsoId } = JSON.parse(customId);
        const quantity = parseInt(packQuantity, 10);

        // Resolve concorsoId: use from metadata or fall back to active concorso
        const resolvedConcorsoId: string | null = concorsoId || (await getActiveConcorso())?.id || null;

        console.log(`[PayPal] Crediting ${quantity} ${packTier} packs to user ${userId}, concorso ${resolvedConcorsoId}`);

        // ── Credit pending_packs ─────────────────────────────────────────────
        const packsQuery = supabaseAdmin
          .from('pending_packs')
          .select('quantity')
          .eq('user_id', userId)
          .eq('tier', packTier);

        if (resolvedConcorsoId) {
          packsQuery.eq('concorso_id', resolvedConcorsoId);
        } else {
          packsQuery.is('concorso_id', null);
        }

        const { data, error: selectError } = await packsQuery.maybeSingle();

        if (selectError && (selectError as { code?: string }).code !== 'PGRST116') {
          console.error('[PayPal] Error fetching packs:', selectError);
          return NextResponse.json({ error: 'Database select error' }, { status: 500 });
        }

        let upsertError;
        if (data) {
          const updateQuery = supabaseAdmin
            .from('pending_packs')
            .update({ quantity: ((data as { quantity: number }).quantity ?? 0) + quantity })
            .eq('user_id', userId)
            .eq('tier', packTier);

          if (resolvedConcorsoId) {
            updateQuery.eq('concorso_id', resolvedConcorsoId);
          } else {
            updateQuery.is('concorso_id', null);
          }

          const { error } = await updateQuery;
          upsertError = error;
        } else {
          const { error } = await supabaseAdmin
            .from('pending_packs')
            .insert({
              user_id: userId,
              tier: packTier,
              quantity,
              concorso_id: resolvedConcorsoId,
            });
          upsertError = error;
        }

        if (upsertError) {
          console.error('[PayPal] Error updating/inserting packs:', upsertError);
          return NextResponse.json({ error: 'Database upsert error' }, { status: 500 });
        }

        // ── Credit user_tickets ──────────────────────────────────────────────
        if (resolvedConcorsoId) {
          const ticketsPerPurchase = TICKET_PER_TIER[packTier] ?? 0;
          const numPurchased = Math.ceil(quantity / (PACK_CARDS[packTier] ?? 1));
          const ticketsToAdd = ticketsPerPurchase * numPurchased;

          const { data: existingTickets } = await supabaseAdmin
            .from('user_tickets')
            .select('quantity')
            .eq('user_id', userId)
            .eq('concorso_id', resolvedConcorsoId)
            .maybeSingle();

          const currentTickets = (existingTickets as { quantity?: number } | null)?.quantity ?? 0;

          await supabaseAdmin
            .from('user_tickets')
            .upsert(
              { user_id: userId, concorso_id: resolvedConcorsoId, quantity: currentTickets + ticketsToAdd, updated_at: new Date().toISOString() },
              { onConflict: 'user_id,concorso_id' }
            );

          console.log(`[PayPal] Credited ${ticketsToAdd} tickets to user ${userId}`);
        }

        return NextResponse.json({ success: true, packsCredited: quantity });
      }
    }

    return NextResponse.json(captureData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[PayPal Capture] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
