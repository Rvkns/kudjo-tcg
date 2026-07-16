import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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
