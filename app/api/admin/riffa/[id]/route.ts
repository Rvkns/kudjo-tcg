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

// GET /api/admin/riffa/[id] - Get contest details, ticket list, and winners list
export async function GET(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    // 1. Fetch concorso
    const { data: concorso, error: cError } = await supabaseAdmin
      .from('concorsi')
      .select('*')
      .eq('id', id)
      .single();

    if (cError || !concorso) {
      return NextResponse.json({ error: 'Concorso non trovato' }, { status: 404 });
    }

    // 2. Fetch ticket distribution (with user details)
    const { data: ticketsRaw, error: tError } = await supabaseAdmin
      .from('user_tickets')
      .select('user_id, quantity, profiles(email, full_name)')
      .eq('concorso_id', id)
      .gt('quantity', 0)
      .order('quantity', { ascending: false });

    if (tError) {
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    interface TicketRow {
      user_id: string;
      quantity: number;
      profiles: { email: string; full_name: string } | null;
    }

    const ticketsList = (ticketsRaw as unknown as TicketRow[] || []).map(t => ({
      user_id: t.user_id,
      quantity: t.quantity,
      user: t.profiles || { email: 'Sconosciuto', full_name: 'Sconosciuto' }
    }));

    // 3. Fetch winners list
    const { data: winnersRaw, error: wError } = await supabaseAdmin
      .from('concorso_winners')
      .select('id, user_id, ticket_count, prize, draw_index, drawn_at, profiles(email, full_name)')
      .eq('concorso_id', id)
      .order('draw_index', { ascending: true });

    if (wError) {
      return NextResponse.json({ error: wError.message }, { status: 500 });
    }

    interface WinnerRow {
      id: string;
      user_id: string;
      ticket_count: number;
      prize: string;
      draw_index: number;
      drawn_at: string;
      profiles: { email: string; full_name: string } | null;
    }

    const winnersList = (winnersRaw as unknown as WinnerRow[] || []).map(w => ({
      id: w.id,
      user_id: w.user_id,
      ticket_count: w.ticket_count,
      prize: w.prize,
      draw_index: w.draw_index,
      drawn_at: w.drawn_at,
      user: w.profiles || { email: 'Sconosciuto', full_name: 'Sconosciuto' }
    }));

    return NextResponse.json({
      concorso,
      tickets: ticketsList,
      winners: winnersList
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/riffa/[id] - Reset/Delete drawn winners for this contest
export async function DELETE(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { error } = await supabaseAdmin
      .from('concorso_winners')
      .delete()
      .eq('concorso_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
