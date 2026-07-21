-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: CARTE REALI IN VENDITA (COLLEZIONE / MARKETPLACE)
-- ─────────────────────────────────────────────────────────────────────────────
-- Copia ed esegui questo script nel SQL Editor di Supabase.

create table if not exists public.marketplace_items (
  id text primary key, -- es. 'item_custom_001'
  nome text not null,
  gioco text not null default 'kudjo', -- 'pokemon' | 'one_piece' | 'kudjo' | 'yugioh' | 'magic' | 'lorcana'
  set_nome text not null default 'Kudjo Original Set I',
  prezzo numeric(10,2) not null check (prezzo >= 0),
  condizione_raw text not null default 'NM', -- 'NM', 'EX', 'Mint', etc.
  gradata boolean not null default false,
  grading_company text, -- 'PSA', 'BGS', 'CGC', 'GRAAD'
  voto text, -- '10', '9.5', '9', '8'
  foto text[] not null default '{}', -- Array di URL immagini (Fronte, Angolata, Retro)
  stato text not null default 'disponibile', -- 'disponibile' | 'in_trattativa' | 'venduta'
  nota_storia text,
  lingua_stampa text default 'IT',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.marketplace_items enable row level security;

drop policy if exists "Allow public read for marketplace_items" on public.marketplace_items;
create policy "Allow public read for marketplace_items"
  on public.marketplace_items for select
  using (true);

drop policy if exists "Allow admin full access for marketplace_items" on public.marketplace_items;
create policy "Allow admin full access for marketplace_items"
  on public.marketplace_items for all
  using (true);
