import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUnifiedPackTiers } from '@/lib/data/dynamic-pack-tiers';

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

// GET /api/admin/pack-tiers
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const packTiers = await getUnifiedPackTiers();
    return NextResponse.json({ packTiers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/pack-tiers - Update prices and descriptions for pack tiers
export async function PUT(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { tier_key, nome, prezzo_eur, carte_per_busta, ticket_inclusi, descrizione } = body;

    if (!tier_key || prezzo_eur === undefined) {
      return NextResponse.json({ error: 'Tier key e Prezzo sono obbligatori.' }, { status: 400 });
    }

    const { data: updatedTier, error } = await supabaseAdmin
      .from('pack_tiers')
      .upsert({
        tier_key,
        nome,
        prezzo_eur: Number(prezzo_eur),
        carte_per_busta: Number(carte_per_busta) || 5,
        ticket_inclusi: Number(ticket_inclusi) || 1,
        descrizione: descrizione ? String(descrizione).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ packTier: updatedTier });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
