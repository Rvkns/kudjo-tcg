import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_vercel_build_prerender');

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

console.log('[DEBUG STRIPE] supabaseUrl:', supabaseUrl);
console.log('[DEBUG STRIPE] supabaseServiceKey length:', supabaseServiceKey.length);
if (supabaseServiceKey.length > 20) {
  console.log('[DEBUG STRIPE] supabaseServiceKey start/end:', 
    supabaseServiceKey.substring(0, 10) + '...' + supabaseServiceKey.slice(-10));
}

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

const PRODUCTS: Record<string, { name: string; price: number; cards: number }> = {
  bronze:   { name: 'BRONZE #1', price: 5.00, cards: 1 },
  silver:   { name: 'SILVER #2', price: 25.00, cards: 6 },
  gold:     { name: 'GOLD #3', price: 50.00, cards: 13 },
  platinum: { name: 'PLATINUM #4', price: 100.00, cards: 27 },
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    // Verify user session server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
    }

    const { packId, quantity } = await request.json();
    const product = PRODUCTS[packId];
    if (!product) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Demo Mode check: if the secret key is dummy or unset, simulate successful purchase directly!
    const isDemoMode = !process.env.STRIPE_SECRET_KEY || 
                       process.env.STRIPE_SECRET_KEY.includes('placeholder') || 
                       process.env.STRIPE_SECRET_KEY.includes('dummy');

    if (isDemoMode) {
      console.log(`[DEMO MODE] Simulating successful Stripe checkout for user ${user.id}`);
      
      const targetPacks = product.cards * quantity;

      // Ensure the profile exists in public.profiles to satisfy the foreign key constraint
      const { data: profileExists, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (profileCheckError || !profileExists) {
        console.log(`[DEMO MODE] Profile missing for user ${user.id}, creating it now...`);
        const { error: profileInsertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            avatar_url: user.user_metadata?.avatar_url || '',
          });
          
        if (profileInsertError) {
          console.error('Error inserting missing profile:', profileInsertError);
        }
      }

      // 1. Fetch current quantity
      const { data, error: selectError } = await supabaseAdmin
        .from('pending_packs')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('tier', packId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching current packs in demo mode:', selectError);
      }

      const currentQty = data?.quantity || 0;
      const newQty = currentQty + targetPacks;

      // 2. Upsert quantity
      const { error: upsertError } = await supabaseAdmin
        .from('pending_packs')
        .upsert(
          { user_id: user.id, tier: packId, quantity: newQty },
          { onConflict: 'user_id,tier' }
        );

      if (upsertError) {
        console.error('Error upserting packs in demo mode:', upsertError);
        return NextResponse.json({ error: `Errore database: ${upsertError.message} (Codice: ${upsertError.code || 'N/D'})` }, { status: 500 });
      }

      return NextResponse.json({ url: `${origin}/it/profilo?success=true&demo=true` });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Kudjo TCG: ${product.name}`,
              description: `Include ${product.cards * quantity} buste digitali per il concorso`,
            },
            unit_amount: Math.round(product.price * 100), // in cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/it/profilo?success=true`,
      cancel_url: `${origin}/it/concorso?cancelled=true`,
      metadata: {
        userId: user.id,
        packTier: packId,
        packQuantity: (product.cards * quantity).toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error creating Stripe session:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
