import { NextResponse } from 'next/server';
import { getUnifiedCardsList } from '@/lib/data/dynamic-cards';

export const dynamic = 'force-dynamic';

// GET /api/cards - Public endpoint to retrieve all Kudjo TCG cards
export async function GET() {
  try {
    const cards = await getUnifiedCardsList();
    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
