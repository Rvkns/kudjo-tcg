import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// ─── Guard: only admin emails can call these endpoints ───────────────────────
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

// ─── GET /api/admin/concorsi ─────────────────────────────────────────────────
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ concorsi: data });
}

// ─── POST /api/admin/concorsi ────────────────────────────────────────────────
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json();
  const { nome, descrizione, stato, data_inizio, data_fine, reset_scheduled_at } = body;

  if (!nome) return NextResponse.json({ error: 'Il campo "nome" è obbligatorio' }, { status: 400 });

  // Only one concorso can be 'attivo' at a time
  if (stato === 'attivo') {
    const { data: existing } = await supabaseAdmin
      .from('concorsi')
      .select('id')
      .eq('stato', 'attivo')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Esiste già un concorso attivo. Concludilo prima di attivarne un altro.' },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .insert({ nome, descrizione, stato: stato || 'draft', data_inizio, data_fine, reset_scheduled_at })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ concorso: data }, { status: 201 });
}
