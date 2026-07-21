import { supabaseAdmin } from '@/lib/supabase-admin';
import { kudjoCards } from '@/lib/data/kudjo-cards-db';

export interface DynamicCard {
  id: string;
  numero: number;
  nome: string;
  rarita: 'comune' | 'non_comune' | 'raro';
  elemento: string;
  potere: number;
  descrizione?: string;
  immagine_url?: string;
  is_custom?: boolean;
}

// Helper to fetch all unified cards (static defaults + database dynamic cards)
export async function getUnifiedCardsList(): Promise<DynamicCard[]> {
  try {
    const { data: dbCards, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .order('numero', { ascending: true });

    if (error || !dbCards || dbCards.length === 0) {
      return kudjoCards;
    }

    interface DBCardRow {
      id: string;
      numero: number;
      nome: string;
      rarita: 'comune' | 'non_comune' | 'raro';
      elemento: string;
      potere: number;
      descrizione: string | null;
      immagine_url: string | null;
    }

    const customCardsMap: Record<string, DynamicCard> = {};
    (dbCards as unknown as DBCardRow[]).forEach((dbc) => {
      customCardsMap[dbc.id] = {
        id: dbc.id,
        numero: dbc.numero,
        nome: dbc.nome,
        rarita: dbc.rarita,
        elemento: dbc.elemento,
        potere: dbc.potere,
        descrizione: dbc.descrizione || undefined,
        immagine_url: dbc.immagine_url || `/cards/${dbc.id}.png`,
        is_custom: true,
      };
    });

    // Merge: Static default cards overridden or augmented by database cards
    const mergedList: DynamicCard[] = [...kudjoCards];

    Object.values(customCardsMap).forEach((customCard) => {
      const existingIdx = mergedList.findIndex((c) => c.id === customCard.id);
      if (existingIdx !== -1) {
        mergedList[existingIdx] = { ...mergedList[existingIdx], ...customCard };
      } else {
        mergedList.push(customCard);
      }
    });

    return mergedList.sort((a, b) => a.numero - b.numero);
  } catch (err: unknown) {
    console.error('Error fetching unified cards:', err);
    return kudjoCards;
  }
}

// Fetch single card by ID
export async function getUnifiedCardById(cardId: string): Promise<DynamicCard | null> {
  const allCards = await getUnifiedCardsList();
  return allCards.find((c) => c.id === cardId) || null;
}
