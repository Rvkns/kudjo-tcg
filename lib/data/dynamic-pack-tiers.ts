import { supabaseAdmin } from '@/lib/supabase-admin';

export interface PackTier {
  tier_key: string;
  nome: string;
  prezzo_eur: number;
  carte_per_busta: number;
  ticket_inclusi: number;
  descrizione: string;
}

export const DEFAULT_PACK_TIERS: Record<string, PackTier> = {
  bronze: {
    tier_key: 'bronze',
    nome: 'Bronze Pack #1',
    prezzo_eur: 5.00,
    carte_per_busta: 5,
    ticket_inclusi: 1,
    descrizione: 'Busta base con 5 carte TCG casuali ed 1 Ticket Riffa incluso.',
  },
  silver: {
    tier_key: 'silver',
    nome: 'Silver Pack #2',
    prezzo_eur: 25.00,
    carte_per_busta: 25,
    ticket_inclusi: 5,
    descrizione: 'Busta silver con 25 carte TCG e 5 Ticket Riffa inclusi.',
  },
  gold: {
    tier_key: 'gold',
    nome: 'Gold Pack #3',
    prezzo_eur: 50.00,
    carte_per_busta: 50,
    ticket_inclusi: 10,
    descrizione: 'Busta gold con 50 carte TCG e 10 Ticket Riffa inclusi.',
  },
  platinum: {
    tier_key: 'platinum',
    nome: 'Platinum Pack #4',
    prezzo_eur: 100.00,
    carte_per_busta: 100,
    ticket_inclusi: 25,
    descrizione: 'Busta platinum premium con 100 carte TCG e 25 Ticket Riffa inclusi.',
  },
};

export async function getUnifiedPackTiers(): Promise<Record<string, PackTier>> {
  try {
    const { data: dbTiers, error } = await supabaseAdmin
      .from('pack_tiers')
      .select('*');

    if (error || !dbTiers || dbTiers.length === 0) {
      return DEFAULT_PACK_TIERS;
    }

    interface DBPackTierRow {
      tier_key: string;
      nome: string;
      prezzo_eur: number;
      carte_per_busta: number;
      ticket_inclusi: number;
      descrizione: string | null;
    }

    const tiersMap: Record<string, PackTier> = { ...DEFAULT_PACK_TIERS };

    (dbTiers as unknown as DBPackTierRow[]).forEach((dbt) => {
      tiersMap[dbt.tier_key] = {
        tier_key: dbt.tier_key,
        nome: dbt.nome,
        prezzo_eur: Number(dbt.prezzo_eur),
        carte_per_busta: dbt.carte_per_busta,
        ticket_inclusi: dbt.ticket_inclusi,
        descrizione: dbt.descrizione || DEFAULT_PACK_TIERS[dbt.tier_key]?.descrizione || '',
      };
    });

    return tiersMap;
  } catch (err: unknown) {
    console.error('Error fetching pack tiers:', err);
    return DEFAULT_PACK_TIERS;
  }
}
