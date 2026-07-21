import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUnifiedCardsList } from '@/lib/data/dynamic-cards';

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

// GET /api/admin/cards - Fetch all cards
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const cards = await getUnifiedCardsList();
    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/cards - Create a new TCG card
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { numero, nome, rarita, elemento, potere, descrizione, immagine_url } = body;

    if (!numero || !nome || !rarita || !elemento) {
      return NextResponse.json({ error: 'Numero, Nome, Rarità ed Elemento sono obbligatori.' }, { status: 400 });
    }

    if (!['comune', 'non_comune', 'raro'].includes(rarita)) {
      return NextResponse.json({ error: 'Rarità non valida. Scegli tra comune, non_comune, raro.' }, { status: 400 });
    }

    const cardId = `kj_${String(numero).padStart(3, '0')}`;

    const { data: newCard, error } = await supabaseAdmin
      .from('cards')
      .upsert({
        id: cardId,
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

    return NextResponse.json({ card: newCard });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
