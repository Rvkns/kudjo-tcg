import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Shared Supabase Admin client for server-side API routes.
// Uses SERVICE_ROLE key (bypasses RLS) – never expose to the client!

let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
if (supabaseUrl.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
  supabaseUrl = supabaseUrl.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim();
}

let supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (supabaseServiceKey.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
  supabaseServiceKey = supabaseServiceKey.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim();
}

const createMockQueryBuilder = () => {
  const qb: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'gte', 'lte', 'not', 'or', 'filter', 'update', 'delete'];
  methods.forEach((m) => { qb[m] = () => qb; });
  qb['single'] = () => Promise.resolve({ data: null, error: { code: 'PGRST116' } });
  qb['maybeSingle'] = () => Promise.resolve({ data: null, error: null });
  qb['upsert'] = () => Promise.resolve({ error: null });
  qb['insert'] = () => Promise.resolve({ error: null });
  qb['then'] = (resolve: (value: unknown) => void) => resolve({ data: [], error: null });
  return qb;
};

export const supabaseAdmin: SupabaseClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : new Proxy({} as unknown as SupabaseClient, {
      get(_target, prop) {
        if (prop === 'from') return () => createMockQueryBuilder();
        return () => Promise.resolve({ data: null, error: null });
      },
    });

// ─── Contest helper ──────────────────────────────────────────────────────────

export interface Concorso {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: 'draft' | 'attivo' | 'concluso';
  data_inizio: string | null;
  data_fine: string | null;
  reset_scheduled_at: string | null;
  created_at: string;
}

/**
 * Returns the currently active concorso, or null if none is active.
 */
export async function getActiveConcorso(): Promise<Concorso | null> {
  const { data, error } = await supabaseAdmin
    .from('concorsi')
    .select('*')
    .eq('stato', 'attivo')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getActiveConcorso] Error:', error);
    return null;
  }
  return data as Concorso | null;
}

// Ticket quantities per pack tier (base + bonus)
export const TICKET_PER_TIER: Record<string, number> = {
  bronze:   10,
  silver:   55,
  gold:     115,
  platinum: 245,
};
