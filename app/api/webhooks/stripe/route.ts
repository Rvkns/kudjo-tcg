import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_vercel_build_prerender');

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const createMockQueryBuilder = () => {
  const queryBuilder = {
    select: () => queryBuilder,
    eq: () => queryBuilder,
    single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
    upsert: () => Promise.resolve({ error: null }),
    insert: () => Promise.resolve({ error: null }),
    update: () => queryBuilder,
    delete: () => queryBuilder,
    then: (resolve: (value: unknown) => void) => resolve({ data: null, error: null }),
  };
  return queryBuilder;
};

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : new Proxy({} as unknown as SupabaseClient, {
      get(target, prop) {
        if (prop === 'from') {
          return () => createMockQueryBuilder();
        }
        return () => Promise.resolve({ error: null });
      }
    });

export const dynamic = 'force-dynamic';

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

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata && metadata.userId && metadata.packTier && metadata.packQuantity) {
      const userId = metadata.userId;
      const tier = metadata.packTier;
      const quantity = parseInt(metadata.packQuantity, 10);

      console.log(`Payment confirmed via Stripe. Crediting ${quantity} ${tier} packs to user ${userId}`);

      // 1. Fetch current quantity from Supabase
      const { data, error: selectError } = await supabaseAdmin
        .from('pending_packs')
        .select('quantity')
        .eq('user_id', userId)
        .eq('tier', tier)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching current packs from Supabase:', selectError);
        return NextResponse.json({ error: 'Database select error' }, { status: 500 });
      }

      const currentQty = data?.quantity || 0;
      const newQty = currentQty + quantity;

      // 2. Upsert the quantity
      const { error: upsertError } = await supabaseAdmin
        .from('pending_packs')
        .upsert(
          { user_id: userId, tier, quantity: newQty },
          { onConflict: 'user_id,tier' }
        );

      if (upsertError) {
        console.error('Error upserting packs on Supabase:', upsertError);
        return NextResponse.json({ error: 'Database upsert error' }, { status: 500 });
      }

      console.log(`Successfully credited ${quantity} packs of tier ${tier} to user ${userId} via Webhook`);
    }
  }

  return NextResponse.json({ received: true });
}
