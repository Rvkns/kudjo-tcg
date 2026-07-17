import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// ─── Guard: only admin emails can call these endpoints ───────────────────────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'kudjotcg@gmail.com,sentz01@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

async function assertAdmin(request: Request): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { supabase } = await import('@/lib/supabase');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden: not an admin' }, { status: 403 });
  }

  return { userId: user.id };
}

// ─── GET /api/admin/concorsi ─────────────────────────────────────────────────
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ concorsi: data });
}

// ─── POST /api/admin/concorsi ────────────────────────────────────────────────
const DEMO_CONCORSO_ID = 'de30ce57-c011-c011-c011-c011ec011ec0';

export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const userId = guard.userId;

  const body = await request.json();
  const { nome, descrizione, stato, data_inizio, data_fine, reset_scheduled_at, isDemo } = body;

  const targetNome = nome || (isDemo ? 'Concorso Demo TCG' : '');
  if (!targetNome) return NextResponse.json({ error: 'Il campo "nome" è obbligatorio' }, { status: 400 });

  const targetStato = isDemo ? 'attivo' : (stato || 'draft');

  // Only one concorso can be 'attivo' at a time
  if (targetStato === 'attivo') {
    const query = supabaseAdmin
      .from('concorsi')
      .select('id')
      .eq('stato', 'attivo');

    if (isDemo) {
      query.neq('id', DEMO_CONCORSO_ID);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Esiste già un concorso attivo. Concludilo prima di attivarne un altro.' },
        { status: 409 }
      );
    }
  }

  if (isDemo) {
    // Manually delete all related rows first because foreign key constraints do not have ON DELETE CASCADE in migrations
    await supabaseAdmin.from('pending_packs').delete().eq('concorso_id', DEMO_CONCORSO_ID);
    await supabaseAdmin.from('user_collection').delete().eq('concorso_id', DEMO_CONCORSO_ID);
    await supabaseAdmin.from('user_tickets').delete().eq('concorso_id', DEMO_CONCORSO_ID);
    await supabaseAdmin.from('collection_sets').delete().eq('concorso_id', DEMO_CONCORSO_ID);

    // Now safely delete the demo contest
    await supabaseAdmin.from('concorsi').delete().eq('id', DEMO_CONCORSO_ID);
  }

  const insertData: Record<string, unknown> = {
    nome: targetNome,
    descrizione: descrizione || (isDemo ? 'Concorso dimostrativo con dati di prova' : null),
    stato: targetStato,
    data_inizio: data_inizio || (isDemo ? new Date().toISOString() : null),
    data_fine: data_fine || (isDemo ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null),
    reset_scheduled_at
  };

  if (isDemo) {
    insertData.id = DEMO_CONCORSO_ID;
  }

  const { data: concorso, error } = await supabaseAdmin
    .from('concorsi')
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Seeding Demo Data ──────────────────────────────────────────────────────
  if (isDemo) {
    console.log(`[Demo Setup] Seeding data for user ${userId} under contest ${DEMO_CONCORSO_ID}`);

    // 1. Seed pending packs (10 per tier)
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const packsToInsert = tiers.map(tier => ({
      user_id: userId,
      tier,
      quantity: 10,
      concorso_id: DEMO_CONCORSO_ID
    }));

    const { error: packsError } = await supabaseAdmin
      .from('pending_packs')
      .insert(packsToInsert);

    if (packsError) console.error('[Demo Setup] Error seeding pending packs:', packsError);

    // 2. Seed tickets (500 tickets)
    const { error: ticketsError } = await supabaseAdmin
      .from('user_tickets')
      .insert({
        user_id: userId,
        concorso_id: DEMO_CONCORSO_ID,
        quantity: 500,
        updated_at: new Date().toISOString()
      });

    if (ticketsError) console.error('[Demo Setup] Error seeding tickets:', ticketsError);

    // 3. Seed collection cards (20 random cards)
    const collectionToInsert = Array.from({ length: 20 }, (_, i) => {
      const cardNum = Math.floor(Math.random() * 55) + 1;
      const cardId = `kj_${String(cardNum).padStart(3, '0')}`;
      const packTier = tiers[i % tiers.length]; // distribute among tiers
      return {
        user_id: userId,
        card_id: cardId,
        pack_tier: packTier,
        found_at: new Date().toISOString(),
        concorso_id: DEMO_CONCORSO_ID
      };
    });

    const { error: colError } = await supabaseAdmin
      .from('user_collection')
      .insert(collectionToInsert);

    if (colError) console.error('[Demo Setup] Error seeding user collection:', colError);
  }

  return NextResponse.json({ concorso }, { status: 201 });
}
