import { NextResponse } from 'next/server';
import { getUnifiedMarketplaceItems } from '@/lib/data/dynamic-marketplace';

export const dynamic = 'force-dynamic';

// GET /api/marketplace/items - Public endpoint to retrieve all marketplace items
export async function GET() {
  try {
    const items = await getUnifiedMarketplaceItems();
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
