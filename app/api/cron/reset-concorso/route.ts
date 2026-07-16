import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/reset-concorso
 * Called by Vercel Cron Jobs every 15 minutes.
 * Finds all active concorsi whose reset_scheduled_at <= now() and resets them.
 *
 * Protected by CRON_SECRET env variable.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  console.log(`[CRON] Checking for concorsi to reset at ${now}`);

  // Find active concorsi whose scheduled reset time has passed
  const { data: concorsiToReset, error } = await supabaseAdmin
    .from('concorsi')
    .select('id, nome')
    .eq('stato', 'attivo')
    .not('reset_scheduled_at', 'is', null)
    .lte('reset_scheduled_at', now);

  if (error) {
    console.error('[CRON] Error fetching concorsi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!concorsiToReset || concorsiToReset.length === 0) {
    console.log('[CRON] No concorsi to reset.');
    return NextResponse.json({ message: 'No concorsi to reset', checked: now });
  }

  const results = [];

  for (const concorso of concorsiToReset as { id: string; nome: string }[]) {
    console.log(`[CRON] Resetting concorso ${concorso.id} (${concorso.nome})`);

    // Delete pending_packs
    await supabaseAdmin.from('pending_packs').delete().eq('concorso_id', concorso.id);

    // Delete user_collection
    await supabaseAdmin.from('user_collection').delete().eq('concorso_id', concorso.id);

    // Delete user_tickets
    await supabaseAdmin.from('user_tickets').delete().eq('concorso_id', concorso.id);

    // Set stato = 'concluso'
    const { error: updateError } = await supabaseAdmin
      .from('concorsi')
      .update({ stato: 'concluso' })
      .eq('id', concorso.id);

    results.push({
      id: concorso.id,
      nome: concorso.nome,
      success: !updateError,
      error: updateError?.message,
    });

    console.log(`[CRON] Concorso ${concorso.id} reset: ${updateError ? 'FAILED' : 'OK'}`);
  }

  return NextResponse.json({ reset: results, checked: now });
}
