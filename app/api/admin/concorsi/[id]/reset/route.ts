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

/**
 * POST /api/admin/concorsi/[id]/reset
 * Executes the full contest reset:
 *  - Deletes all pending_packs for this concorso
 *  - Deletes all user_collection entries for this concorso
 *  - Deletes all user_tickets for this concorso
 *  - Sets the concorso stato = 'concluso'
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;

  // Verify concorso exists and is not already concluso
  const { data: concorso } = await supabaseAdmin
    .from('concorsi')
    .select('id, nome, stato')
    .eq('id', id)
    .single();

  if (!concorso) {
    return NextResponse.json({ error: 'Concorso non trovato' }, { status: 404 });
  }
  if ((concorso as { stato: string }).stato === 'concluso') {
    return NextResponse.json({ error: 'Il concorso è già concluso' }, { status: 400 });
  }

  console.log(`[RESET] Starting reset for concorso ${id} (${(concorso as { nome: string }).nome})`);

  // 1. Delete pending_packs
  const { error: packsError } = await supabaseAdmin
    .from('pending_packs')
    .delete()
    .eq('concorso_id', id);
  if (packsError) console.error('[RESET] Error deleting packs:', packsError);

  // 2. Delete user_collection
  const { error: collectionError } = await supabaseAdmin
    .from('user_collection')
    .delete()
    .eq('concorso_id', id);
  if (collectionError) console.error('[RESET] Error deleting collection:', collectionError);

  // 3. Delete user_tickets (they expire with the contest)
  const { error: ticketsError } = await supabaseAdmin
    .from('user_tickets')
    .delete()
    .eq('concorso_id', id);
  if (ticketsError) console.error('[RESET] Error deleting tickets:', ticketsError);

  // 4. Set concorso stato = 'concluso'
  const { error: updateError } = await supabaseAdmin
    .from('concorsi')
    .update({ stato: 'concluso' })
    .eq('id', id);
  if (updateError) {
    return NextResponse.json({ error: `Errore aggiornamento stato: ${updateError.message}` }, { status: 500 });
  }

  console.log(`[RESET] Concorso ${id} reset completed successfully.`);
  return NextResponse.json({
    success: true,
    message: `Concorso "${(concorso as { nome: string }).nome}" resettato e concluso con successo.`,
  });
}
