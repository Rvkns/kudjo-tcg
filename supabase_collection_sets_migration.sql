-- =============================================================================
-- KUDJO COLLECTION SETS & DISCOUNTS SYSTEM MIGRATION
-- =============================================================================
-- Copia ed esegui questo script all'interno del SQL Editor di Supabase.

-- 1. TABELLA COLLECTION_SETS (Set di carte da completare per sbloccare sconti)
create table if not exists public.collection_sets (
  id uuid default gen_random_uuid() primary key,
  concorso_id uuid references public.concorsi(id) on delete cascade not null,
  nome text not null,
  card_ids text[] not null, -- es. ['kj_001', 'kj_009', 'kj_017']
  sconto_percentuale integer not null check (sconto_percentuale > 0 and sconto_percentuale <= 100),
  descrizione text,
  created_at timestamp with time zone default now() not null
);

alter table public.collection_sets enable row level security;

-- Policy di lettura pubblica/autenticata per i collection sets
drop policy if exists "Allow public read for collection_sets" on public.collection_sets;
create policy "Allow public read for collection_sets"
  on public.collection_sets for select
  using (true);

-- Policy di scrittura riservata al service_role
drop policy if exists "Allow service role write for collection_sets" on public.collection_sets;
create policy "Allow service role write for collection_sets"
  on public.collection_sets for all
  using (auth.role() = 'service_role');


-- 2. TABELLA USER_DISCOUNTS (Sconti permanentemente riscattati dagli utenti)
create table if not exists public.user_discounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null unique,
  sconto_percentuale integer not null check (sconto_percentuale > 0 and sconto_percentuale <= 100),
  concorso_id uuid references public.concorsi(id) on delete cascade,
  collection_set_id uuid references public.collection_sets(id) on delete set null,
  created_at timestamp with time zone default now() not null,
  unique(user_id, collection_set_id) -- Un utente può riscattare lo sconto di un determinato set una sola volta
);

alter table public.user_discounts enable row level security;

-- Policy per consentire agli utenti di leggere i propri sconti
drop policy if exists "Allow users to read own discounts" on public.user_discounts;
create policy "Allow users to read own discounts"
  on public.user_discounts for select
  using (auth.uid() = user_id);

-- Policy di scrittura riservata al service_role
drop policy if exists "Allow service role write for user_discounts" on public.user_discounts;
create policy "Allow service role write for user_discounts"
  on public.user_discounts for all
  using (auth.role() = 'service_role');
