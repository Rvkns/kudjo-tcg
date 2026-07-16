import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PRODUCTS: Record<string, { name: string; price: number; cards: number }> = {
  bronze:   { name: 'BRONZE #1', price: 5.00, cards: 1 },
  silver:   { name: 'SILVER #2', price: 25.00, cards: 6 },
  gold:     { name: 'GOLD #3', price: 50.00, cards: 13 },
  platinum: { name: 'PLATINUM #4', price: 100.00, cards: 27 },
};

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
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

    const totalAmount = (product.price * quantity).toFixed(2);
    const accessToken = await getPayPalAccessToken();

    // Call PayPal to create checkout order
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value: totalAmount,
            },
            description: `Kudjo TCG: ${product.name} (Buste: ${product.cards * quantity})`,
            custom_id: JSON.stringify({
              userId: user.id,
              packTier: packId,
              packQuantity: product.cards * quantity,
            }),
          },
        ],
      }),
    });

    const orderData = await response.json();
    return NextResponse.json(orderData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error creating PayPal order:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
