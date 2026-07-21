import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUnifiedCardById } from '@/lib/data/dynamic-cards';

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

// GET /api/admin/cards/[id]
export async function GET(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const card = await getUnifiedCardById(id);
    if (!card) return NextResponse.json({ error: 'Carta non trovata.' }, { status: 404 });
    return NextResponse.json({ card });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/cards/[id] - Update card
export async function PUT(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { numero, nome, rarita, elemento, potere, descrizione, immagine_url } = body;

    const { data: updatedCard, error } = await supabaseAdmin
      .from('cards')
      .upsert({
        id,
        numero: Number(numero),
        nome: String(nome).trim(),
        rarita,
        elemento: String(elemento).trim(),
        potere: Number(potere) || 0,
        descrizione: descrizione ? String(descrizione).trim() : null,
        immagine_url: immagine_url ? String(immagine_url).trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ card: updatedCard });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/cards/[id] - Delete card from database
export async function DELETE(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { error } = await supabaseAdmin
      .from('cards')
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
