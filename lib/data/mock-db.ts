import { SetSchema, type Set } from '../schema/set';
import { CardDefinitionSchema, type CardDefinition } from '../schema/card-definition';
import { VariantSchema, type Variant } from '../schema/variant';
import { ItemSchema, type Item } from '../schema/item';
import { type Gioco } from '../schema/gioco';

// Mock Sets
export const mockSets: Set[] = [
  {
    id: 'set_p_151',
    gioco: 'pokemon',
    nome: 'Scarlet & Violet - 151',
    codice_ufficiale: 'MEW',
    data_uscita: '2023-09-22',
    numero_carte_totali: 165,
  },
  {
    id: 'set_p_sit',
    gioco: 'pokemon',
    nome: 'Silver Tempest',
    codice_ufficiale: 'SIT',
    data_uscita: '2022-11-11',
    numero_carte_totali: 195,
  },
  {
    id: 'set_op_05',
    gioco: 'one_piece',
    nome: 'Awakening of the New Era',
    codice_ufficiale: 'OP-05',
    data_uscita: '2023-12-08',
    numero_carte_totali: 126,
  },
  {
    id: 'set_op_07',
    gioco: 'one_piece',
    nome: '500 Years in the Future',
    codice_ufficiale: 'OP-07',
    data_uscita: '2024-06-28',
    numero_carte_totali: 126,
  },
];

// Mock Card Definitions
export const mockCardDefinitions: CardDefinition[] = [
  {
    id: 'card_p_charizard',
    set_id: 'set_p_151',
    nome: 'Charizard ex',
    numero_raccolta: '199/165',
    tipo_carta: 'Pokémon',
    rarita: 'Special Illustration Rare',
    lingua_stampa: 'EN',
  },
  {
    id: 'card_p_mew',
    set_id: 'set_p_151',
    nome: 'Mew ex',
    numero_raccolta: '205/165',
    tipo_carta: 'Pokémon',
    rarita: 'Hyper Rare',
    lingua_stampa: 'JA',
  },
  {
    id: 'card_p_lugia',
    set_id: 'set_p_sit',
    nome: 'Lugia V',
    numero_raccolta: '186/195',
    tipo_carta: 'Pokémon',
    rarita: 'Special Illustration Rare',
    lingua_stampa: 'IT',
  },
  {
    id: 'card_op_ace',
    set_id: 'set_op_05',
    nome: 'Portgas.D.Ace',
    numero_raccolta: 'OP05-119',
    tipo_carta: 'Character',
    rarita: 'SEC',
    lingua_stampa: 'JA',
  },
  {
    id: 'card_op_luffy',
    set_id: 'set_op_05',
    nome: 'Monkey.D.Luffy',
    numero_raccolta: 'OP05-060',
    tipo_carta: 'Leader',
    rarita: 'L',
    lingua_stampa: 'EN',
  },
  {
    id: 'card_op_bonney',
    set_id: 'set_op_07',
    nome: 'Jewelry Bonney',
    numero_raccolta: 'OP07-019',
    tipo_carta: 'Leader',
    rarita: 'L',
    lingua_stampa: 'EN',
  },
];

// Mock Variants
export const mockVariants: Variant[] = [
  {
    id: 'var_p_char_sar',
    card_definition_id: 'card_p_charizard',
    tipo_variante: 'alternate_art',
    note: 'Special Illustration Rare (SAR)',
  },
  {
    id: 'var_p_mew_gold',
    card_definition_id: 'card_p_mew',
    tipo_variante: 'secret_rare',
    note: 'Hyper Rare Gold Card',
  },
  {
    id: 'var_p_lugia_alt',
    card_definition_id: 'card_p_lugia',
    tipo_variante: 'alternate_art',
    note: 'Special Illustration Rare (Alt Art)',
  },
  {
    id: 'var_op_ace_manga',
    card_definition_id: 'card_op_ace',
    tipo_variante: 'manga_art',
    note: 'Super Secret Manga Rare card',
  },
  {
    id: 'var_op_luffy_aa',
    card_definition_id: 'card_op_luffy',
    tipo_variante: 'alternate_art',
    note: 'Alternate Art Comic Leader',
  },
  {
    id: 'var_op_bonney_aa',
    card_definition_id: 'card_op_bonney',
    tipo_variante: 'alternate_art',
    note: 'Special Alternate Art Leader (SP)',
  },
];

// Mock Items
export const mockItems: Item[] = [
  {
    id: 'item_p_charizard_psa10',
    variant_id: 'var_p_char_sar',
    condizione_raw: 'NM',
    gradata: true,
    grading_company: 'PSA',
    voto: '10',
    foto: [
      '/images/cards/charizard_front.svg',
      '/images/cards/charizard_angled.svg',
      '/images/cards/charizard_back.svg'
    ],
    prezzo: 420,
    stato: 'disponibile',
    nota_storia: 'Spacchettato personalmente in diretta streaming e gradato direttamente tramite servizio ufficiale PSA. Certificazione verificabile, gemma assoluta.',
    data_inserimento: '2026-06-01',
  },
  {
    id: 'item_op_ace_manga_psa10',
    variant_id: 'var_op_ace_manga',
    condizione_raw: 'NM',
    gradata: true,
    grading_company: 'PSA',
    voto: '10',
    foto: [
      '/images/cards/ace_front.svg',
      '/images/cards/ace_angled.svg',
      '/images/cards/ace_back.svg'
    ],
    prezzo: 1650, // Above SOGLIA_PREZZO_PUBBLICO (1000) -> "Su richiesta"
    stato: 'disponibile',
    nota_storia: 'Pezzo centrale della nostra collezione di One Piece TCG. L\'olografia a sfondo manga di OP-05 Awakening of the New Era è tra le più ricercate al mondo, valorizzata al massimo da una gradazione impeccabile PSA 10.',
    data_inserimento: '2026-06-10',
  },
  {
    id: 'item_p_lugia_psa9',
    variant_id: 'var_p_lugia_alt',
    condizione_raw: 'NM',
    gradata: true,
    grading_company: 'PSA',
    voto: '9',
    foto: [
      '/images/cards/lugia_front.svg',
      '/images/cards/lugia_angled.svg'
    ],
    prezzo: 280,
    stato: 'disponibile',
    nota_storia: 'Ottenuta da uno scambio privato a Lucca Comics 2024. Centratura ottima, retro pulito con lievi micro-imperfezioni invisibili se non a ingrandimento macro, classificate PSA 9.',
    data_inserimento: '2026-06-15',
  },
  {
    id: 'item_op_luffy_raw',
    variant_id: 'var_op_luffy_aa',
    condizione_raw: 'NM',
    gradata: false,
    foto: [
      '/images/cards/luffy_front.svg'
    ],
    prezzo: 140,
    stato: 'riservata',
    nota_storia: 'Carta tenuta fin dal primo secondo in sleeve protettiva KMC Perfect Fit ed inserita in toploader rigido UltraPRO. Condizioni indistinguibili dal nuovo (NM).',
    data_inserimento: '2026-06-20',
  },
  {
    id: 'item_p_mew_gold_raw',
    variant_id: 'var_p_mew_gold',
    condizione_raw: 'LP',
    gradata: false,
    foto: [
      '/images/cards/mew_front.svg'
    ],
    prezzo: 95,
    stato: 'disponibile',
    nota_storia: 'Piccola e classica imperfezione di fabbrica (micro-punto argentato sul bordo superiore sinistro del retro), per il resto intonsa. Ottima opportunità per collezione raw.',
    data_inserimento: '2026-06-25',
  },
  {
    id: 'item_op_bonney_sold',
    variant_id: 'var_op_bonney_aa',
    condizione_raw: 'NM',
    gradata: true,
    grading_company: 'BGS',
    voto: '9.5',
    foto: [
      '/images/cards/bonney_front.svg'
    ],
    prezzo: 210,
    stato: 'venduta',
    nota_storia: 'Splendida leader di OP-07. Già venduta ad un collezionista appassionato nel giugno 2026. Mantenuta in archivio storico a scopo espositivo.',
    data_inserimento: '2026-05-10',
  },
];


// Helper to validate entire database at runtime
export function validateDatabase(): boolean {
  try {
    mockSets.forEach(s => SetSchema.parse(s));
    mockCardDefinitions.forEach(c => CardDefinitionSchema.parse(c));
    mockVariants.forEach(v => VariantSchema.parse(v));
    mockItems.forEach(i => ItemSchema.parse(i));
    return true;
  } catch (error) {
    console.error('Database validation failed:', error);
    return false;
  }
}

// Struct representing a fully populated item for the UI
export interface PopulatedItem {
  id: string;
  item: Item;
  variant: Variant;
  card: CardDefinition;
  set: Set;
}

// Populate an item with its associations
export function populateItem(item: Item): PopulatedItem {
  const variant = mockVariants.find(v => v.id === item.variant_id);
  if (!variant) throw new Error(`Variant not found for item: ${item.id}`);

  const card = mockCardDefinitions.find(c => c.id === variant.card_definition_id);
  if (!card) throw new Error(`CardDefinition not found for variant: ${variant.id}`);

  const set = mockSets.find(s => s.id === card.set_id);
  if (!set) throw new Error(`Set not found for card: ${card.id}`);

  return {
    id: item.id,
    item,
    variant,
    card,
    set,
  };
}

// Retrieve all populated items
export function getPopulatedItems(): PopulatedItem[] {
  return mockItems.map(item => populateItem(item));
}

// Query populated items with filters
export interface FilterParams {
  gioco?: Gioco;
  setId?: string;
  condizione?: string;
  gradata?: boolean;
  stato?: string;
  prezzoMax?: number;
  search?: string;
  sortBy?: 'recent' | 'price_asc' | 'price_desc';
}

export function queryItems(filters: FilterParams): PopulatedItem[] {
  let items = getPopulatedItems();

  if (filters.gioco) {
    items = items.filter(i => i.set.gioco === filters.gioco);
  }

  if (filters.setId && filters.setId !== 'all') {
    items = items.filter(i => i.set.id === filters.setId);
  }

  if (filters.condizione && filters.condizione !== 'all') {
    items = items.filter(i => i.item.condizione_raw === filters.condizione);
  }

  if (filters.gradata !== undefined) {
    items = items.filter(i => i.item.gradata === filters.gradata);
  }

  if (filters.stato) {
    items = items.filter(i => i.item.stato === filters.stato);
  }

  if (filters.prezzoMax !== undefined) {
    const maxPrice = filters.prezzoMax;
    items = items.filter(i => i.item.prezzo <= maxPrice);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    items = items.filter(i => 
      i.card.nome.toLowerCase().includes(term) ||
      i.set.nome.toLowerCase().includes(term) ||
      i.card.numero_raccolta.toLowerCase().includes(term) ||
      i.set.codice_ufficiale.toLowerCase().includes(term)
    );
  }

  // Sort
  const sortBy = filters.sortBy || 'recent';
  if (sortBy === 'recent') {
    items.sort((a, b) => new Date(b.item.data_inserimento).getTime() - new Date(a.item.data_inserimento).getTime());
  } else if (sortBy === 'price_asc') {
    items.sort((a, b) => a.item.prezzo - b.item.prezzo);
  } else if (sortBy === 'price_desc') {
    items.sort((a, b) => b.item.prezzo - a.item.prezzo);
  }

  return items;
}

// Retrieve single populated item by ID
export function getItemById(id: string): PopulatedItem | null {
  const item = mockItems.find(i => i.id === id);
  if (!item) return null;
  return populateItem(item);
}
