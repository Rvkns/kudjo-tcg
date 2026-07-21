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

interface ConcorsoRow {
  id: string;
  nome: string;
  stato: 'draft' | 'attivo' | 'concluso';
  created_at: string;
}

// GET /api/admin/riffa - List all contests with raffle stats
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    // 1. Fetch all concorsi
    const { data: concorsiRaw, error: cError } = await supabaseAdmin
      .from('concorsi')
      .select('id, nome, stato, created_at')
      .order('created_at', { ascending: false });

    if (cError) {
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }

    const concorsi = concorsiRaw as unknown as ConcorsoRow[];
    const resultList = [];

    // 2. Fetch stats for each concorso
    for (const c of concorsi) {
      // Get tickets sum & count of participants
      const { data: ticketsData } = await supabaseAdmin
        .from('user_tickets')
        .select('user_id, quantity')
        .eq('concorso_id', c.id);

      const ticketList = (ticketsData || []) as { user_id: string; quantity: number }[];
      const totalTickets = ticketList.reduce((acc, t) => acc + (t.quantity || 0), 0);
      const totalParticipants = new Set(ticketList.map(t => t.user_id)).size;

      // Check if winners have been drawn
      const { count: winnersCount } = await supabaseAdmin
        .from('concorso_winners')
        .select('id', { count: 'exact', head: true })
        .eq('concorso_id', c.id);

      resultList.push({
        id: c.id,
        nome: c.nome,
        stato: c.stato,
        created_at: c.created_at,
        total_tickets: totalTickets,
        total_participants: totalParticipants,
        has_drawn: (winnersCount ?? 0) > 0,
        winners_count: winnersCount ?? 0
      });
    }

    return NextResponse.json({ concorsi: resultList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
