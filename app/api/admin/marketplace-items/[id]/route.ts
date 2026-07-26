import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUnifiedMarketplaceItemByIdRaw } from '@/lib/data/dynamic-marketplace';

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

// GET /api/admin/marketplace-items/[id]
export async function GET(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const item = await getUnifiedMarketplaceItemByIdRaw(id);
    if (!item) return NextResponse.json({ error: 'Carta non trovata.' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/marketplace-items/[id]
export async function PUT(request: Request, props: { params: Params }) {
  const { id } = await props.params;
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

    const priceNum = Number(prezzo);
    const fotoArray = Array.isArray(foto) && foto.length > 0 ? foto : ['/images/cards/placeholder_front.jpg'];

    const { data: updatedItem, error } = await supabaseAdmin
      .from('marketplace_items')
      .upsert({
        id,
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

    return NextResponse.json({ item: updatedItem });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/marketplace-items/[id]
export async function DELETE(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { error } = await supabaseAdmin
      .from('marketplace_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
