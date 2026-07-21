import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET /api/concorso/winners - Get winners of completed contests
export async function GET() {
  try {
    // 1. Fetch completed concorsi that have winners
    const { data: concorsiRaw, error: cError } = await supabaseAdmin
      .from('concorsi')
      .select('id, nome, descrizione, data_fine')
      .eq('stato', 'concluso')
      .order('data_fine', { ascending: false });

    if (cError) {
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }

    const concorsi = concorsiRaw || [];
    const results = [];

    // 2. Fetch winners for each completed concorso
    for (const c of concorsi) {
      const { data: winnersRaw } = await supabaseAdmin
        .from('concorso_winners')
        .select('id, user_id, ticket_count, prize, draw_index, profiles(full_name, email)')
        .eq('concorso_id', c.id)
        .order('draw_index', { ascending: true });

      if (winnersRaw && winnersRaw.length > 0) {
        interface DBWinnerRow {
          id: string;
          user_id: string;
          ticket_count: number;
          prize: string;
          draw_index: number;
          profiles: { full_name: string; email: string } | null;
        }

        const winners = (winnersRaw as unknown as DBWinnerRow[]).map(w => {
          // Hide part of email/name for privacy
          const fullName = w.profiles?.full_name || 'Utente';
          const email = w.profiles?.email || '—';
          
          let maskedName = fullName;
          if (fullName.includes(' ')) {
            const parts = fullName.split(' ');
            maskedName = `${parts[0]} ${parts[1][0]}.***`;
          } else if (fullName.length > 3) {
            maskedName = `${fullName.slice(0, 3)}***`;
          }

          let maskedEmail = email;
          if (email.includes('@')) {
            const [local, domain] = email.split('@');
            maskedEmail = `${local.slice(0, 2)}***@${domain}`;
          }

          return {
            id: w.id,
            prize: w.prize,
            draw_index: w.draw_index,
            ticket_count: w.ticket_count,
            user_name: maskedName,
            user_email: maskedEmail
          };
        });

        results.push({
          id: c.id,
          nome: c.nome,
          descrizione: c.descrizione,
          data_fine: c.data_fine,
          winners
        });
      }
    }

    return NextResponse.json({ concorsi: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/concorso/winners] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
