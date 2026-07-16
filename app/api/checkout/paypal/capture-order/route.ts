import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : new Proxy({} as unknown as SupabaseClient, {
      get() {
        return () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
          upsert: () => Promise.resolve({ error: new Error('Missing Supabase Service Key') }),
        });
      }
    });

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
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Call PayPal to capture the authorized payment order
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
        const { userId, packTier, packQuantity } = JSON.parse(customId);
        const quantity = parseInt(packQuantity, 10);

        console.log(`PayPal capture completed. Crediting ${quantity} ${packTier} packs to user ${userId}`);

        // 1. Fetch current quantity from Supabase
        const { data, error: selectError } = await supabaseAdmin
          .from('pending_packs')
          .select('quantity')
          .eq('user_id', userId)
          .eq('tier', packTier)
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
            { user_id: userId, tier: packTier, quantity: newQty },
            { onConflict: 'user_id,tier' }
          );

        if (upsertError) {
          console.error('Error upserting packs on Supabase:', upsertError);
          return NextResponse.json({ error: 'Database upsert error' }, { status: 500 });
        }

        console.log(`Successfully credited ${quantity} packs of tier ${packTier} to user ${userId} via PayPal Capture`);
        return NextResponse.json({ success: true, packsCredited: quantity });
      }
    }

    return NextResponse.json(captureData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error capturing PayPal order:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
