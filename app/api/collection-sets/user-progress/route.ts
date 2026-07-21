import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET /api/collection-sets/user-progress - Get set progress and unlocked discounts for current user
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { supabase } = await import('@/lib/supabase');
  const { data: { user }, error: uError } = await supabase.auth.getUser(token);
  if (uError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Fetch active/published concorsi
    const { data: setsRaw, error: sError } = await supabaseAdmin
      .from('collection_sets')
      .select('*, concorsi(id, nome, stato)')
      .order('created_at', { ascending: false });

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 });
    }

    // 2. Fetch user's cards from user_collection
    const { data: userCardsRaw, error: cError } = await supabaseAdmin
      .from('user_collection')
      .select('card_id, quantity')
      .eq('user_id', user.id)
      .gt('quantity', 0);

    if (cError) {
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }

    const ownedCardIds = new Set((userCardsRaw || []).map(c => c.card_id));

    // 3. Fetch user's discounts
    const { data: discountsRaw, error: dError } = await supabaseAdmin
      .from('user_discounts')
      .select('collection_set_id, code, sconto_percentuale, created_at')
      .eq('user_id', user.id);

    if (dError) {
      return NextResponse.json({ error: dError.message }, { status: 500 });
    }

    const claimedDiscountsMap = new Map<string, { code: string; sconto_percentuale: number; created_at: string }>();
    (discountsRaw || []).forEach(d => {
      if (d.collection_set_id) {
        claimedDiscountsMap.set(d.collection_set_id, {
          code: d.code,
          sconto_percentuale: d.sconto_percentuale,
          created_at: d.created_at,
        });
      }
    });

    interface DBSetRow {
      id: string;
      concorso_id: string;
      nome: string;
      card_ids: string[];
      sconto_percentuale: number;
      descrizione: string | null;
      concorsi: { id: string; nome: string; stato: string } | null;
    }

    const setsProgress = (setsRaw as unknown as DBSetRow[] || []).map(s => {
      const requiredCardIds = s.card_ids || [];
      const ownedInSet = requiredCardIds.filter(id => ownedCardIds.has(id));
      const missingInSet = requiredCardIds.filter(id => !ownedCardIds.has(id));
      const isCompleted = requiredCardIds.length > 0 && ownedInSet.length === requiredCardIds.length;
      const claimedInfo = claimedDiscountsMap.get(s.id) ?? null;

      return {
        id: s.id,
        concorso_id: s.concorso_id,
        concorso_nome: s.concorsi?.nome || 'Concorso',
        concorso_stato: s.concorsi?.stato || 'draft',
        nome: s.nome,
        descrizione: s.descrizione,
        sconto_percentuale: s.sconto_percentuale,
        card_ids: requiredCardIds,
        owned_card_ids: ownedInSet,
        missing_card_ids: missingInSet,
        owned_count: ownedInSet.length,
        total_count: requiredCardIds.length,
        progress_percentage: requiredCardIds.length > 0 ? Math.round((ownedInSet.length / requiredCardIds.length) * 100) : 0,
        is_completed: isCompleted,
        claimed_discount: claimedInfo,
      };
    });

    return NextResponse.json({ sets: setsProgress });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
