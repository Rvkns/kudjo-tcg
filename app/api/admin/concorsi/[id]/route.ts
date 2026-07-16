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
  if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { userId: user.id };
}

// ─── GET /api/admin/concorsi/[id] ────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .select('*, collection_sets(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Stats: count participants, total packs, total tickets
  const [packsResult, ticketsResult] = await Promise.all([
    supabaseAdmin
      .from('pending_packs')
      .select('user_id, quantity', { count: 'exact' })
      .eq('concorso_id', id),
    supabaseAdmin
      .from('user_tickets')
      .select('user_id, quantity', { count: 'exact' })
      .eq('concorso_id', id),
  ]);

  const packs = (packsResult.data as { user_id: string; quantity: number }[] | null) ?? [];
  const tickets = (ticketsResult.data as { user_id: string; quantity: number }[] | null) ?? [];
  const totalPacks = packs.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalTickets = tickets.reduce((s, r) => s + (r.quantity || 0), 0);
  const uniqueUsers = new Set([...packs.map((r) => r.user_id), ...tickets.map((r) => r.user_id)]).size;

  return NextResponse.json({
    concorso: data,
    stats: { uniqueUsers, totalPacks, totalTickets },
  });
}

// ─── PATCH /api/admin/concorsi/[id] ──────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json();
  const { nome, descrizione, stato, data_inizio, data_fine, reset_scheduled_at } = body;

  // Guard: cannot have two active concorsi
  if (stato === 'attivo') {
    const { data: existing } = await supabaseAdmin
      .from('concorsi')
      .select('id')
      .eq('stato', 'attivo')
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Esiste già un concorso attivo. Concludilo prima di attivarne un altro.' },
        { status: 409 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = {};
  if (nome !== undefined) updatePayload.nome = nome;
  if (descrizione !== undefined) updatePayload.descrizione = descrizione;
  if (stato !== undefined) updatePayload.stato = stato;
  if (data_inizio !== undefined) updatePayload.data_inizio = data_inizio;
  if (data_fine !== undefined) updatePayload.data_fine = data_fine;
  if (reset_scheduled_at !== undefined) updatePayload.reset_scheduled_at = reset_scheduled_at;

  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ concorso: data });
}

// ─── DELETE /api/admin/concorsi/[id] ─────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;

  // Can only delete draft concorsi
  const { data: existing } = await supabaseAdmin
    .from('concorsi')
    .select('stato')
    .eq('id', id)
    .single();

  if ((existing as { stato?: string } | null)?.stato !== 'draft') {
    return NextResponse.json(
      { error: 'Puoi eliminare solo i concorsi in stato "draft".' },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from('concorsi').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
