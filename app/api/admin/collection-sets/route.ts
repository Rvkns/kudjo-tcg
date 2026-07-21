import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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

// GET /api/admin/collection-sets - List all collection sets
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { data: setsRaw, error } = await supabaseAdmin
      .from('collection_sets')
      .select('*, concorsi(id, nome, stato)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    interface RawCollectionSet {
      id: string;
      concorso_id: string;
      nome: string;
      card_ids: string[];
      sconto_percentuale: number;
      descrizione: string | null;
      created_at: string;
      concorsi: { id: string; nome: string; stato: string } | null;
    }

    const sets = (setsRaw as unknown as RawCollectionSet[] || []).map(s => ({
      id: s.id,
      concorso_id: s.concorso_id,
      nome: s.nome,
      card_ids: s.card_ids,
      sconto_percentuale: s.sconto_percentuale,
      descrizione: s.descrizione,
      created_at: s.created_at,
      concorso_nome: s.concorsi?.nome || 'Concorso Sconosciuto',
      concorso_stato: s.concorsi?.stato || 'draft',
    }));

    return NextResponse.json({ collection_sets: sets });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/collection-sets - Create a new collection set
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { concorso_id, nome, descrizione, sconto_percentuale, card_ids } = body;

    if (!concorso_id || !nome || !sconto_percentuale || !card_ids || !Array.isArray(card_ids) || card_ids.length === 0) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere specificati (Concorso, Nome, Sconto %, Carte richieste).' }, { status: 400 });
    }

    const { data: newSet, error } = await supabaseAdmin
      .from('collection_sets')
      .insert({
        concorso_id,
        nome: String(nome).trim(),
        descrizione: descrizione ? String(descrizione).trim() : null,
        sconto_percentuale: Number(sconto_percentuale),
        card_ids: card_ids.map(c => String(c).trim()),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ collection_set: newSet });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
