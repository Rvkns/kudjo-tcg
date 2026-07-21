import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUnifiedMarketplaceItems } from '@/lib/data/dynamic-marketplace';

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

// GET /api/admin/marketplace-items - Fetch all real marketplace cards
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const items = await getUnifiedMarketplaceItems();
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/marketplace-items - Create new real marketplace card for sale
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const {
      nome,
      gioco,
      set_nome,
      prezzo,
      condizione_raw,
      gradata,
      grading_company,
      voto,
      foto,
      stato,
      nota_storia,
      lingua_stampa,
    } = body;

    if (!nome || prezzo === undefined) {
      return NextResponse.json({ error: 'Nome carta e Prezzo sono obbligatori.' }, { status: 400 });
    }

    const priceNum = Number(prezzo);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Prezzo non valido.' }, { status: 400 });
    }

    const itemId = `item_${Date.now()}`;
    const fotoArray = Array.isArray(foto) && foto.length > 0 ? foto : ['/images/cards/placeholder_front.jpg'];

    const { data: newItem, error } = await supabaseAdmin
      .from('marketplace_items')
      .insert({
        id: itemId,
        nome: String(nome).trim(),
        gioco: gioco || 'kudjo',
        set_nome: set_nome || 'Kudjo Collection Store',
        prezzo: priceNum,
        condizione_raw: condizione_raw || 'NM',
        gradata: Boolean(gradata),
        grading_company: grading_company || null,
        voto: voto || null,
        foto: fotoArray,
        stato: stato || 'disponibile',
        nota_storia: nota_storia ? String(nota_storia).trim() : null,
        lingua_stampa: lingua_stampa || 'IT',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: newItem });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
