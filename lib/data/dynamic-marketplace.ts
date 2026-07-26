import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPopulatedItems, PopulatedItem } from '@/lib/data/mock-db';
import { maskPublicPrices } from '@/lib/data/price-mask';
import { Gioco } from '@/lib/schema/gioco';
import { Item } from '@/lib/schema/item';
import { Variant } from '@/lib/schema/variant';

export interface DBMarketplaceItemRow {
  id: string;
  nome: string;
  gioco: string;
  set_nome: string;
  prezzo: number;
  condizione_raw: string;
  gradata: boolean;
  grading_company: string | null;
  voto: string | null;
  foto: string[];
  stato: 'disponibile' | 'in_trattativa' | 'venduta';
  nota_storia: string | null;
  lingua_stampa: string | null;
  created_at: string;
}

/**
 * Full-fidelity item list with real prices, including pieces priced above
 * SOGLIA_PREZZO_PUBBLICO ("Su richiesta"). SERVER-ONLY: use only in admin-gated
 * routes or trusted server-side price validation (e.g. checkout). Never return
 * this directly from a public API route or pass it as props to a client component —
 * use getUnifiedMarketplaceItems() (masked) for anything that reaches the browser.
 */
export async function getUnifiedMarketplaceItemsRaw(): Promise<PopulatedItem[]> {
  const staticItems = getPopulatedItems();

  try {
    const { data: dbItemsRaw, error } = await supabaseAdmin
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !dbItemsRaw || dbItemsRaw.length === 0) {
      return staticItems;
    }

    const dbItems = dbItemsRaw as unknown as DBMarketplaceItemRow[];

    const dynamicPopulated: PopulatedItem[] = dbItems.map((dbi) => {
      const itemObj: Item = {
        id: dbi.id,
        variant_id: `var_${dbi.id}`,
        condizione_raw: (dbi.condizione_raw as Item['condizione_raw']) || 'NM',
        gradata: dbi.gradata,
        grading_company: (dbi.grading_company as Item['grading_company']) || undefined,
        voto: dbi.voto || undefined,
        foto: dbi.foto && dbi.foto.length > 0 ? dbi.foto : ['/images/cards/placeholder_front.jpg'],
        prezzo: Number(dbi.prezzo),
        stato: (dbi.stato as Item['stato']) || 'disponibile',
        nota_storia: dbi.nota_storia || 'Carta disponibile nello store ufficiale Kudjo.',
        data_inserimento: dbi.created_at.split('T')[0],
      };

      const variantObj: Variant = {
        id: `var_${dbi.id}`,
        card_definition_id: `card_${dbi.id}`,
        tipo_variante: (dbi.gradata ? 'secret_rare' : 'standard') as Variant['tipo_variante'],
        note: dbi.gradata ? `${dbi.grading_company || 'PSA'} ${dbi.voto || '10'}` : 'Raw Card',
      };

      const cardObj = {
        id: `card_${dbi.id}`,
        set_id: `set_${dbi.id}`,
        nome: dbi.nome,
        numero_raccolta: 'KUDJO-SINGLE',
        tipo_carta: 'Marketplace Card',
        rarita: dbi.gradata ? `Gradata ${dbi.grading_company || ''}` : 'Single Raw',
        lingua_stampa: dbi.lingua_stampa || 'IT',
      };

      const setObj = {
        id: `set_${dbi.id}`,
        gioco: (dbi.gioco.toLowerCase() as Gioco) || 'kudjo',
        nome: dbi.set_nome || 'Kudjo Collection Store',
        codice_ufficiale: 'KUDJO',
        data_uscita: '2026-01-01',
        numero_carte_totali: 100,
      };

      return {
        id: dbi.id,
        item: itemObj,
        variant: variantObj,
        card: cardObj,
        set: setObj,
      };
    });

    // Merge: Dynamic items first, then static items
    const dynamicIds = new Set(dynamicPopulated.map(i => i.id));
    const filteredStatic = staticItems.filter(s => !dynamicIds.has(s.id));

    return [...dynamicPopulated, ...filteredStatic];
  } catch (err: unknown) {
    console.error('Error fetching unified marketplace items:', err);
    return staticItems;
  }
}

/**
 * Public, safe-by-default item list: prices at or above SOGLIA_PREZZO_PUBBLICO are
 * clamped to the threshold (see lib/data/price-mask.ts). Use this everywhere the
 * result reaches a browser — public API routes, server-rendered props, client
 * fallback data.
 */
export async function getUnifiedMarketplaceItems(): Promise<PopulatedItem[]> {
  const items = await getUnifiedMarketplaceItemsRaw();
  return maskPublicPrices(items);
}

/**
 * Real-price lookup by ID. SERVER-ONLY — used for admin editing and checkout price
 * validation. Never expose this response directly to the client.
 */
export async function getUnifiedMarketplaceItemByIdRaw(id: string): Promise<PopulatedItem | null> {
  const all = await getUnifiedMarketplaceItemsRaw();
  return all.find(i => i.id === id) || null;
}

/** Public, masked single-item lookup (see getUnifiedMarketplaceItems). */
export async function getUnifiedMarketplaceItemById(id: string): Promise<PopulatedItem | null> {
  const item = await getUnifiedMarketplaceItemByIdRaw(id);
  return item ? maskPublicPrices([item])[0] : null;
}
