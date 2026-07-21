import { NextResponse } from 'next/server';
import { getUnifiedPackTiers } from '@/lib/data/dynamic-pack-tiers';

export const dynamic = 'force-dynamic';

// GET /api/pack-tiers - Public endpoint to retrieve all pack tiers and prices
export async function GET() {
  try {
    const packTiers = await getUnifiedPackTiers();
    return NextResponse.json({ packTiers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
