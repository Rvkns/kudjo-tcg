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

type Params = Promise<{ id: string }>;

// GET /api/admin/collection-sets/[id] - Get a single collection set
export async function GET(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { data: collectionSet, error } = await supabaseAdmin
      .from('collection_sets')
      .select('*, concorsi(id, nome, stato)')
      .eq('id', id)
      .single();

    if (error || !collectionSet) {
      return NextResponse.json({ error: 'Collection Set non trovato' }, { status: 404 });
    }

    return NextResponse.json({ collection_set: collectionSet });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/collection-sets/[id] - Update a collection set
export async function PATCH(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { concorso_id, nome, descrizione, sconto_percentuale, card_ids } = body;

    const updatePayload: Record<string, unknown> = {};
    if (concorso_id !== undefined) updatePayload.concorso_id = concorso_id;
    if (nome !== undefined) updatePayload.nome = String(nome).trim();
    if (descrizione !== undefined) updatePayload.descrizione = descrizione ? String(descrizione).trim() : null;
    if (sconto_percentuale !== undefined) updatePayload.sconto_percentuale = Number(sconto_percentuale);
    if (card_ids !== undefined && Array.isArray(card_ids)) updatePayload.card_ids = card_ids.map(c => String(c).trim());

    const { data: updatedSet, error } = await supabaseAdmin
      .from('collection_sets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ collection_set: updatedSet });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/collection-sets/[id] - Delete a collection set
export async function DELETE(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { error } = await supabaseAdmin
      .from('collection_sets')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
