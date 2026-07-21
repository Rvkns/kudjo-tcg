import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPopulatedItems, PopulatedItem } from '@/lib/data/mock-db';
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

export async function getUnifiedMarketplaceItems(): Promise<PopulatedItem[]> {
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

export async function getUnifiedMarketplaceItemById(id: string): Promise<PopulatedItem | null> {
  const all = await getUnifiedMarketplaceItems();
  return all.find(i => i.id === id) || null;
}
