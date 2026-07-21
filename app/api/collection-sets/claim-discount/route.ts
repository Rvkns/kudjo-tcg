import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function generateDiscountCode(setName: string, percent: number): string {
  const cleanName = setName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KUDJO-${cleanName || 'SET'}${percent}-${randomPart}`;
}

// POST /api/collection-sets/claim-discount - Claim discount code upon set completion
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { supabase } = await import('@/lib/supabase');
  const { data: { user }, error: uError } = await supabase.auth.getUser(token);
  if (uError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { collection_set_id } = body;

    if (!collection_set_id) {
      return NextResponse.json({ error: 'ID del Collection Set mancante.' }, { status: 400 });
    }

    // 1. Fetch collection set details
    const { data: setRow, error: sError } = await supabaseAdmin
      .from('collection_sets')
      .select('id, concorso_id, nome, card_ids, sconto_percentuale')
      .eq('id', collection_set_id)
      .single();

    if (sError || !setRow) {
      return NextResponse.json({ error: 'Collection Set non trovato.' }, { status: 404 });
    }

    // 2. Check if already claimed
    const { data: existingDiscount } = await supabaseAdmin
      .from('user_discounts')
      .select('code, sconto_percentuale, created_at')
      .eq('user_id', user.id)
      .eq('collection_set_id', collection_set_id)
      .maybeSingle();

    if (existingDiscount) {
      return NextResponse.json({
        message: 'Sconto già riscattato precedentemente!',
        discount: existingDiscount
      });
    }

    // 3. Verify user owns all required cards
    const requiredCards: string[] = setRow.card_ids || [];
    if (requiredCards.length === 0) {
      return NextResponse.json({ error: 'Il set non contiene carte richieste.' }, { status: 400 });
    }

    const { data: userCardsRaw, error: cError } = await supabaseAdmin
      .from('user_collection')
      .select('card_id')
      .eq('user_id', user.id)
      .gt('quantity', 0)
      .in('card_id', requiredCards);

    if (cError) {
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }

    const ownedSet = new Set((userCardsRaw || []).map(c => c.card_id));
    const missingCards = requiredCards.filter(id => !ownedSet.has(id));

    if (missingCards.length > 0) {
      return NextResponse.json({
        error: `Collezione incompleta! Ti mancano ancora ${missingCards.length} carte per riscattare questo sconto.`
      }, { status: 400 });
    }

    // 4. Generate & Insert Discount Code
    const discountCode = generateDiscountCode(setRow.nome, setRow.sconto_percentuale);

    const { data: newDiscount, error: dInsertError } = await supabaseAdmin
      .from('user_discounts')
      .insert({
        user_id: user.id,
        code: discountCode,
        sconto_percentuale: setRow.sconto_percentuale,
        concorso_id: setRow.concorso_id,
        collection_set_id: setRow.id
      })
      .select()
      .single();

    if (dInsertError) {
      return NextResponse.json({ error: dInsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Complimenti! Hai sbloccato con successo il tuo codice sconto permanente!',
      discount: newDiscount
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
