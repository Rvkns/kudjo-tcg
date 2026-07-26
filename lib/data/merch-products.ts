// Canonical server-side catalog for non-card, non-pack merchandise (accessories) sold
// via the cart. This is the single source of truth for pricing: the UI
// (app/[locale]/concorso/page.tsx) reads prices from here too, so the displayed price
// and the price enforced at checkout (app/api/checkout/stripe/route.ts) can never drift.
export interface MerchProduct {
  id: string;
  name: string;
  price: number;
  brand: string;
}

export const MERCH_PRODUCTS: Record<string, MerchProduct> = {
  sleeves_pokemon: {
    id: 'sleeves_pokemon',
    name: 'Sleeves Protettive (Pokémon)',
    price: 9.90,
    brand: 'Pokémon',
  },
  sleeves_one_piece: {
    id: 'sleeves_one_piece',
    name: 'Sleeves Protettive (One Piece)',
    price: 9.90,
    brand: 'One Piece',
  },
  deck_box_premium: {
    id: 'deck_box_premium',
    name: 'Portamazzo Premium (Deck Box)',
    price: 14.90,
    brand: 'Kudjo',
  },
  album_collezione: {
    id: 'album_collezione',
    name: 'Raccoglitore 9-Pocket (Binder)',
    price: 24.90,
    brand: 'Kudjo',
  },
};
