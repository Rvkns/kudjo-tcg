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

function generateAdminDiscountCode(percent: number): string {
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KUDJO-VIP${percent}-${randomPart}`;
}

// GET /api/admin/discounts - List all user discounts
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { data: discountsRaw, error } = await supabaseAdmin
      .from('user_discounts')
      .select('*, profiles(email, full_name), concorsi(nome), collection_sets(nome)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    interface DBDiscountRow {
      id: string;
      user_id: string;
      code: string;
      sconto_percentuale: number;
      concorso_id: string | null;
      collection_set_id: string | null;
      created_at: string;
      profiles: { email: string; full_name: string } | null;
      concorsi: { nome: string } | null;
      collection_sets: { nome: string } | null;
    }

    const discounts = (discountsRaw as unknown as DBDiscountRow[] || []).map(d => ({
      id: d.id,
      user_id: d.user_id,
      user_email: d.profiles?.email || 'Utente Sconosciuto',
      user_full_name: d.profiles?.full_name || 'Utente Sconosciuto',
      code: d.code,
      sconto_percentuale: d.sconto_percentuale,
      concorso_nome: d.concorsi?.nome || null,
      collection_set_nome: d.collection_sets?.nome || null,
      source: d.collection_sets?.nome ? `Collection Set: ${d.collection_sets.nome}` : 'Assegnazione Manuale Admin',
      created_at: d.created_at,
    }));

    return NextResponse.json({ discounts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/discounts - Manually assign a discount code to a user
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { user_id, sconto_percentuale, code, concorso_id } = body;

    if (!user_id || !sconto_percentuale) {
      return NextResponse.json({ error: 'Utente e percentuale di sconto sono obbligatori.' }, { status: 400 });
    }

    const percent = Number(sconto_percentuale);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: 'La percentuale di sconto deve essere compresa tra 1 e 100.' }, { status: 400 });
    }

    const finalCode = code && String(code).trim() ? String(code).trim().toUpperCase() : generateAdminDiscountCode(percent);

    // Verify user profile exists
    const { data: profile, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (pError || !profile) {
      return NextResponse.json({ error: 'Utente specificato non trovato.' }, { status: 404 });
    }

    // Insert discount code
    const { data: discount, error: dError } = await supabaseAdmin
      .from('user_discounts')
      .insert({
        user_id,
        code: finalCode,
        sconto_percentuale: percent,
        concorso_id: concorso_id || null,
        collection_set_id: null
      })
      .select('*, profiles(email, full_name)')
      .single();

    if (dError) {
      if (dError.code === '23505') {
        return NextResponse.json({ error: 'Questo codice sconto esiste già. Usa un codice diverso.' }, { status: 409 });
      }
      return NextResponse.json({ error: dError.message }, { status: 500 });
    }

    return NextResponse.json({ discount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
