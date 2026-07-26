import { SOGLIA_PREZZO_PUBBLICO } from '@/lib/config';
import type { PopulatedItem } from '@/lib/data/mock-db';

/**
 * Clamps `prezzo` to SOGLIA_PREZZO_PUBBLICO for any item priced at or above the public
 * threshold, before the item reaches a browser (API response, server-rendered props,
 * or client-bundled fallback data). Existing `prezzo >= SOGLIA_PREZZO_PUBBLICO` UI checks
 * keep working correctly against the clamped value — only the exact figure above the
 * threshold is withheld, matching the "Su richiesta" business rule.
 *
 * Callers that legitimately need the real price (admin panel, checkout price
 * validation) must read it from the raw/unfiltered data layer instead of through this.
 */
export function maskPublicPrice(populatedItem: PopulatedItem): PopulatedItem {
  if (populatedItem.item.prezzo < SOGLIA_PREZZO_PUBBLICO) return populatedItem;
  return {
    ...populatedItem,
    item: { ...populatedItem.item, prezzo: SOGLIA_PREZZO_PUBBLICO },
  };
}

export function maskPublicPrices(items: PopulatedItem[]): PopulatedItem[] {
  return items.map(maskPublicPrice);
}
