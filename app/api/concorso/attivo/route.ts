import { NextResponse } from 'next/server';
import { supabaseAdmin, getActiveConcorso } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/concorso/attivo
 * Returns the currently active concorso and the requesting user's ticket count.
 */
export async function GET(request: Request) {
  try {
    const concorso = await getActiveConcorso();

    if (!concorso) {
      return NextResponse.json({ concorso: null, tickets: 0 });
    }

    // Optionally enrich with user's ticket count if Authorization header is present
    let tickets = 0;
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const { supabase } = await import('@/lib/supabase');
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: ticketRow } = await supabaseAdmin
          .from('user_tickets')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('concorso_id', concorso.id)
          .maybeSingle();
        tickets = (ticketRow as { quantity?: number } | null)?.quantity ?? 0;
      }
    }

    return NextResponse.json({ concorso, tickets });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/concorso/attivo] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
