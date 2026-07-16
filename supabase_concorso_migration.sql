-- =============================================================================
-- KUDJO MULTI-CONCORSO MIGRATION
-- =============================================================================
-- Esegui questo script nel SQL Editor di Supabase dopo lo schema principale.
-- Aggiunge il supporto ai concorsi, ticket per utente, sconti persistenti e
-- collection sets da completare per sbloccare sconti.

-- =============================================================================
-- 1. TABELLA CONCORSI
-- =============================================================================

create table if not exists public.concorsi (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descrizione text,
  stato text not null default 'draft' check (stato in ('draft', 'attivo', 'concluso')),
  data_inizio timestamp with time zone,
  data_fine timestamp with time zone,
  reset_scheduled_at timestamp with time zone, -- Cron job reset configurato dall'admin
  created_at timestamp with time zone default now()
);

alter table public.concorsi enable row level security;

-- Lettura pubblica (tutti possono vedere il concorso attivo)
drop policy if exists "Allow public read for concorsi" on public.concorsi;
create policy "Allow public read for concorsi"
  on public.concorsi for select
  using (true);

-- Scrittura solo da service_role (admin via API)
drop policy if exists "Allow service role write for concorsi" on public.concorsi;
create policy "Allow service role write for concorsi"
  on public.concorsi for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 2. TABELLA COLLECTION SETS (Collezioni da completare per sconti)
-- =============================================================================

create table if not exists public.collection_sets (
  id uuid default gen_random_uuid() primary key,
  concorso_id uuid references public.concorsi(id) on delete cascade,
  nome text not null,                       -- es. "Collezione Fuoco"
  card_ids text[] not null,                 -- es. ['kj_001', 'kj_002', 'kj_003']
  sconto_percentuale integer not null check (sconto_percentuale > 0 and sconto_percentuale <= 100),
  descrizione text,
  created_at timestamp with time zone default now()
);

alter table public.collection_sets enable row level security;

drop policy if exists "Allow public read for collection_sets" on public.collection_sets;
create policy "Allow public read for collection_sets"
  on public.collection_sets for select
  using (true);

drop policy if exists "Allow service role write for collection_sets" on public.collection_sets;
create policy "Allow service role write for collection_sets"
  on public.collection_sets for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 3. TABELLA USER_TICKETS (Ticket per concorso - si azzerano alla chiusura)
-- =============================================================================

create table if not exists public.user_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  concorso_id uuid references public.concorsi(id) on delete cascade not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamp with time zone default now(),
  unique (user_id, concorso_id)
);

alter table public.user_tickets enable row level security;

drop policy if exists "Allow users to read own tickets" on public.user_tickets;
create policy "Allow users to read own tickets"
  on public.user_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "Allow service role write for user_tickets" on public.user_tickets;
create policy "Allow service role write for user_tickets"
  on public.user_tickets for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 4. TABELLA USER_DISCOUNTS (Sconti permanenti account-level)
-- =============================================================================

create table if not exists public.user_discounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  collection_set_id uuid references public.collection_sets(id),
  concorso_id uuid references public.concorsi(id),  -- riferimento storico
  codice_sconto text unique not null,
  percentuale integer not null check (percentuale > 0 and percentuale <= 100),
  motivo text,         -- es. "Collezione Fuoco completata nel Concorso A"
  usato boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.user_discounts enable row level security;

drop policy if exists "Allow users to read own discounts" on public.user_discounts;
create policy "Allow users to read own discounts"
  on public.user_discounts for select
  using (auth.uid() = user_id);

drop policy if exists "Allow service role write for user_discounts" on public.user_discounts;
create policy "Allow service role write for user_discounts"
  on public.user_discounts for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 5. MODIFICA TABELLE ESISTENTI (aggiungi concorso_id)
-- =============================================================================

-- pending_packs: aggiunta colonna concorso_id (nullable per retrocompatibilità)
alter table public.pending_packs
  add column if not exists concorso_id uuid references public.concorsi(id);

-- Rimuovi vecchio unique constraint e aggiungi quello nuovo (user_id + tier + concorso_id)
alter table public.pending_packs
  drop constraint if exists pending_packs_user_id_tier_key;

alter table public.pending_packs
  drop constraint if exists pending_packs_user_id_tier_concorso_id_key;

alter table public.pending_packs
  add constraint pending_packs_user_id_tier_concorso_id_key
  unique (user_id, tier, concorso_id);

-- user_collection: aggiunta colonna concorso_id (nullable per retrocompatibilità)
alter table public.user_collection
  add column if not exists concorso_id uuid references public.concorsi(id);


-- =============================================================================
-- 6. FUNZIONE HELPER: Ottieni il concorso attivo
-- =============================================================================

create or replace function public.get_active_concorso()
returns public.concorsi as $$
  select * from public.concorsi
  where stato = 'attivo'
  order by created_at desc
  limit 1;
$$ language sql security definer;
