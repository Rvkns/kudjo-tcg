import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, getActiveConcorso, TICKET_PER_TIER } from '@/lib/supabase-admin';
import { getUnifiedMarketplaceItemByIdRaw } from '@/lib/data/dynamic-marketplace';
import { MERCH_PRODUCTS } from '@/lib/data/merch-products';
import { SOGLIA_PREZZO_PUBBLICO } from '@/lib/config';
import type { PackTier } from '@/lib/data/dynamic-pack-tiers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_vercel_build_prerender');

const PRODUCTS: Record<string, { name: string; price: number; cards: number }> = {
  bronze:   { name: 'BRONZE #1',   price: 5.00,  cards: 1  },
  silver:   { name: 'SILVER #2',   price: 25.00, cards: 6  },
  gold:     { name: 'GOLD #3',     price: 50.00, cards: 13 },
  platinum: { name: 'PLATINUM #4', price: 100.00, cards: 27 },
};

const MAX_CART_QUANTITY = 99;

interface IncomingCartItem {
  id?: string;
  type?: string;
  name?: string;
  price?: number;
  quantity?: number;
  packTier?: string;
  details?: { subtitle?: string };
}

/**
 * Resolves the authoritative price/name for a cart line item server-side.
 * The client-supplied `price` is NEVER trusted for billing — only used (elsewhere)
 * for display. Returns null when the item is unknown, unavailable, or (for
 * showcase cards) priced above SOGLIA_PREZZO_PUBBLICO, which is "Su richiesta"
 * only and must never be self-checked-out.
 */
async function resolveCanonicalCartItem(
  item: IncomingCartItem,
  packTiers: Record<string, PackTier>
): Promise<{ price: number; name: string; description: string } | null> {
  if (!item.id || !item.type) return null;

  if (item.type === 'pack') {
    const tierKey = item.packTier || item.id.replace(/^pack_/, '');
    const dynamicTier = packTiers[tierKey];
    const product = PRODUCTS[tierKey];
    if (!dynamicTier && !product) return null;
    return {
      price: dynamicTier ? dynamicTier.prezzo_eur : product!.price,
      name: dynamicTier ? dynamicTier.nome : product!.name,
      description: item.details?.subtitle || 'Digital Pack - Kudjo Showcase',
    };
  }

  if (item.type === 'card') {
    const itemId = item.id.replace(/^card_/, '');
    // Raw (unmasked) lookup — we need the real price to bill correctly and to
    // enforce the SOGLIA_PREZZO_PUBBLICO check below.
    const populated = await getUnifiedMarketplaceItemByIdRaw(itemId);
    if (!populated) return null;
    if (populated.item.stato !== 'disponibile') return null;
    if (populated.item.prezzo >= SOGLIA_PREZZO_PUBBLICO) return null;
    return {
      price: populated.item.prezzo,
      name: populated.card.nome,
      description: `${populated.set.nome} · ${populated.card.numero_raccolta}`,
    };
  }

  if (item.type === 'product') {
    const productId = item.id.replace(/^product_/, '');
    const merch = MERCH_PRODUCTS[productId];
    if (!merch) return null;
    return {
      price: merch.price,
      name: merch.name,
      description: `${merch.brand} - Kudjo Showcase`,
    };
  }

  return null;
}

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

  let packsError;
  if (existingPack) {
    const updateQuery = supabaseAdmin
      .from('pending_packs')
      .update({ quantity: (existingPack.quantity ?? 0) + packsToCredit })
      .eq('user_id', userId)
      .eq('tier', tier);

    if (concorsoId) {
      updateQuery.eq('concorso_id', concorsoId);
    } else {
      updateQuery.is('concorso_id', null);
    }

    const { error } = await updateQuery;
    packsError = error;
  } else {
    const { error } = await supabaseAdmin
      .from('pending_packs')
      .insert({
        user_id: userId,
        tier,
        quantity: packsToCredit,
        concorso_id: concorsoId,
      });
    packsError = error;
  }

  if (packsError) {
    console.error('[creditPacks] Error updating/inserting packs:', packsError);
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

    const body = await request.json();
    const { getUnifiedPackTiers } = await import('@/lib/data/dynamic-pack-tiers');
    const packTiers = await getUnifiedPackTiers();

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Fetch active concorso
    const concorso = await getActiveConcorso();
    const concorsoId = concorso?.id ?? null;

    if (!concorsoId) {
      console.warn('[Stripe] No active concorso found. Packs will be credited without contest association.');
    }

    // Check if payload is CartItems array or single pack purchase
    const isCartCheckout = Array.isArray(body.cartItems) && body.cartItems.length > 0;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const packItemsToCredit: Array<{ tier: string; cardsToCredit: number }> = [];

    if (isCartCheckout) {
      for (const item of body.cartItems as IncomingCartItem[]) {
        if (
          !item.id ||
          !item.type ||
          !Number.isInteger(item.quantity) ||
          (item.quantity ?? 0) < 1 ||
          (item.quantity ?? 0) > MAX_CART_QUANTITY
        ) {
          return NextResponse.json({ error: 'Articolo del carrello non valido.' }, { status: 400 });
        }

        // Authoritative price/name — never trust item.price/item.name from the client.
        const resolved = await resolveCanonicalCartItem(item, packTiers);
        if (!resolved) {
          return NextResponse.json(
            { error: `Articolo non disponibile per il checkout: ${item.name || item.id}` },
            { status: 400 }
          );
        }

        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Kudjo TCG: ${resolved.name}`,
              description: resolved.description,
            },
            unit_amount: Math.round(resolved.price * 100),
          },
          quantity: item.quantity!,
        });

        // Determine if item is a digital pack to credit
        const tier = item.packTier || (item.type === 'pack' ? item.id.replace('pack_', '') : null);
        if (tier) {
          const dynamicTier = packTiers[tier];
          const product = PRODUCTS[tier];
          const cardsPerPack = dynamicTier ? (tier === 'bronze' ? 1 : tier === 'silver' ? 6 : tier === 'gold' ? 13 : 27) : (product?.cards ?? 1);
          const totalCardsToCredit = cardsPerPack * item.quantity!;
          packItemsToCredit.push({ tier, cardsToCredit: totalCardsToCredit });
        }
      }

      if (lineItems.length === 0) {
        return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
      }
    } else {
      // Legacy single pack checkout
      const { packId, quantity } = body;
      const dynamicTier = packTiers[packId];
      const product = PRODUCTS[packId];
      if (!product && !dynamicTier) return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      }

      const unitPrice = dynamicTier ? dynamicTier.prezzo_eur : (product?.price ?? 5.00);
      const packTitle = dynamicTier ? dynamicTier.nome : (product?.name ?? packId);
      const cardsPerPack = product?.cards ?? 1;
      const packsToCredit = cardsPerPack * quantity;

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Kudjo TCG: ${packTitle}`,
            description: `${packsToCredit} buste digitali${concorso ? ` — ${concorso.nome}` : ''}`,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      });

      packItemsToCredit.push({ tier: packId, cardsToCredit: packsToCredit });
    }

    // ── Demo Mode ────────────────────────────────────────────────────────────
    const isDemoMode =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes('placeholder') ||
      process.env.STRIPE_SECRET_KEY.includes('dummy');

    if (isDemoMode) {
      console.log(`[DEMO MODE] Simulating Stripe checkout for user ${user.id}, concorso ${concorsoId}`);
      for (const item of packItemsToCredit) {
        await creditPacksAndTickets(user.id, item.tier, item.cardsToCredit, concorsoId);
      }
      return NextResponse.json({ url: `${origin}/it/profilo?success=true&demo=true` });
    }

    // ── Real Stripe Session ──────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/it/profilo?success=true`,
      cancel_url: `${origin}/it/carrello?cancelled=true`,
      metadata: {
        userId: user.id,
        concorsoId: concorsoId ?? '',
        packCreditsJson: JSON.stringify(packItemsToCredit),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Stripe Checkout] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
