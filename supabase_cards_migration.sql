-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: GESTIONE CARTE TCG & PREZZI PACCHETTI
-- ─────────────────────────────────────────────────────────────────────────────
-- Copia ed esegui questo script nel SQL Editor di Supabase.

-- 1. Tabella Carte TCG dinamiche
create table if not exists public.cards (
  id text primary key, -- es. 'kj_056' o 'card_uuid'
  numero integer not null,
  nome text not null,
  rarita text not null check (rarita in ('comune', 'non_comune', 'raro')),
  elemento text not null,
  potere integer not null default 0,
  descrizione text,
  immagine_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS per public.cards
alter table public.cards enable row level security;

drop policy if exists "Allow public read for cards" on public.cards;
create policy "Allow public read for cards"
  on public.cards for select
  using (true);

drop policy if exists "Allow admin full access for cards" on public.cards;
create policy "Allow admin full access for cards"
  on public.cards for all
  using (true);


-- 2. Tabella Tier Pacchetti Buste & Prezzi
create table if not exists public.pack_tiers (
  tier_key text primary key, -- 'bronze', 'silver', 'gold', 'platinum'
  nome text not null,
  prezzo_eur numeric(10,2) not null check (prezzo_eur >= 0),
  carte_per_busta integer not null default 5,
  ticket_inclusi integer not null default 1,
  descrizione text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS per public.pack_tiers
alter table public.pack_tiers enable row level security;

drop policy if exists "Allow public read for pack_tiers" on public.pack_tiers;
create policy "Allow public read for pack_tiers"
  on public.pack_tiers for select
  using (true);

drop policy if exists "Allow admin full access for pack_tiers" on public.pack_tiers;
create policy "Allow admin full access for pack_tiers"
  on public.pack_tiers for all
  using (true);


-- 3. Inserimento dati iniziali (Seed) per i 4 pacchetti predefiniti
insert into public.pack_tiers (tier_key, nome, prezzo_eur, carte_per_busta, ticket_inclusi, descrizione)
values
  ('bronze', 'Bronze Pack #1', 5.00, 5, 1, 'Busta base con 5 carte TCG casuali ed 1 Ticket Riffa incluso.'),
  ('silver', 'Silver Pack #2', 25.00, 25, 5, 'Busta silver con 25 carte TCG e 5 Ticket Riffa inclusi.'),
  ('gold', 'Gold Pack #3', 50.00, 50, 10, 'Busta gold con 50 carte TCG e 10 Ticket Riffa inclusi.'),
  ('platinum', 'Platinum Pack #4', 100.00, 100, 25, 'Busta platinum premium con 100 carte TCG e 25 Ticket Riffa inclusi.')
on conflict (tier_key) do nothing;
