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

interface Participant {
  user_id: string;
  quantity: number;
  email: string;
  full_name: string;
}

// POST /api/admin/riffa/[id]/draw - Perform the weighted random drawing
export async function POST(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { prizes } = body; // Array of strings (e.g. ["1° Premio", "2° Premio"])

    if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
      return NextResponse.json({ error: 'Devi specificare almeno un premio per l\'estrazione.' }, { status: 400 });
    }

    // 1. Fetch participants with tickets
    const { data: ticketsRaw, error: tError } = await supabaseAdmin
      .from('user_tickets')
      .select('user_id, quantity, profiles(email, full_name)')
      .eq('concorso_id', id)
      .gt('quantity', 0);

    if (tError) {
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    interface DBTicketRow {
      user_id: string;
      quantity: number;
      profiles: { email: string; full_name: string } | null;
    }

    const participants: Participant[] = (ticketsRaw as unknown as DBTicketRow[] || [])
      .map(t => ({
        user_id: t.user_id,
        quantity: t.quantity,
        email: t.profiles?.email || 'Sconosciuto',
        full_name: t.profiles?.full_name || 'Sconosciuto'
      }));

    if (participants.length === 0) {
      return NextResponse.json({ error: 'Nessun utente possiede ticket per questo concorso. Impossibile effettuare l\'estrazione.' }, { status: 400 });
    }

    // Check if winners already exist for this contest
    const { count: existingWinners } = await supabaseAdmin
      .from('concorso_winners')
      .select('id', { count: 'exact', head: true })
      .eq('concorso_id', id);

    if ((existingWinners ?? 0) > 0) {
      return NextResponse.json({ error: 'L\'estrazione per questo concorso è già stata effettuata. Resetta i vincitori prima di estrarre nuovamente.' }, { status: 400 });
    }

    // 2. Perform weighted random draw
    const pool = [...participants];
    const winnersToInsert = [];

    for (let i = 0; i < prizes.length; i++) {
      if (pool.length === 0) break; // No more participants left

      const prizeName = prizes[i];
      const totalWeight = pool.reduce((acc, p) => acc + p.quantity, 0);

      // Weighted random selection
      const randomVal = Math.floor(Math.random() * totalWeight);
      let winnerIdx = -1;
      let cumulativeWeight = 0;

      for (let j = 0; j < pool.length; j++) {
        cumulativeWeight += pool[j].quantity;
        if (randomVal < cumulativeWeight) {
          winnerIdx = j;
          break;
        }
      }

      if (winnerIdx !== -1) {
        const winner = pool[winnerIdx];
        winnersToInsert.push({
          concorso_id: id,
          user_id: winner.user_id,
          ticket_count: winner.quantity,
          prize: prizeName,
          draw_index: i
        });

        // Remove the winner from eligible pool for subsequent drawings
        pool.splice(winnerIdx, 1);
      }
    }

    // 3. Save winners in DB
    const { data: savedWinners, error: wError } = await supabaseAdmin
      .from('concorso_winners')
      .insert(winnersToInsert)
      .select('id, user_id, ticket_count, prize, draw_index, drawn_at, profiles(email, full_name)');

    if (wError) {
      return NextResponse.json({ error: wError.message }, { status: 500 });
    }

    interface DBWinnerRow {
      id: string;
      user_id: string;
      ticket_count: number;
      prize: string;
      draw_index: number;
      drawn_at: string;
      profiles: { email: string; full_name: string } | null;
    }

    const formattedWinners = (savedWinners as unknown as DBWinnerRow[] || []).map(w => ({
      id: w.id,
      user_id: w.user_id,
      ticket_count: w.ticket_count,
      prize: w.prize,
      draw_index: w.draw_index,
      drawn_at: w.drawn_at,
      user: w.profiles || { email: 'Sconosciuto', full_name: 'Sconosciuto' }
    }));

    return NextResponse.json({ winners: formattedWinners });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
