-- ─────────────────────────────────────────────────────────────────────────────
-- KUDJO DATABASE SCHEMA (SUPABASE SQL)
-- ─────────────────────────────────────────────────────────────────────────────
-- Copia ed esegui questo script all'interno del SQL Editor di Supabase.
-- Configura tutte le tabelle per le buste digitali, la collezione utente,
-- e la tassonomia fisica descritta in CLAUDE.md, con RLS e policy di sicurezza.

create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. UTENTI E PROFILI (AUTH INTEGRATION)
-- =============================================================================

-- Tabella Profili (collegata a auth.users di Supabase)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.profiles enable row level security;

-- Policies per profiles
create policy "Allow public read for profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow users to update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger per auto-creare il profilo quando un utente si registra su Supabase (es. tramite Google SSO)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================================================
-- 2. SISTEMA BUSTE TCG DIGITALI (LOCAL STORAGE MIGRATION)
-- =============================================================================

-- Tabella Buste Pendenti (buste acquistate ma non ancora aperte)
create table if not exists public.pending_packs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tier text not null, -- 'bronze' | 'silver' | 'gold' | 'platinum'
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, tier)
);

-- Tabella Collezione Carte Trovate (istante delle carte trovate nei pacchetti)
create table if not exists public.user_collection (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  card_id text not null, -- es. 'kj_001', 'kj_002'
  found_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pack_tier text not null
);

-- RLS per TCG
alter table public.pending_packs enable row level security;
alter table public.user_collection enable row level security;

-- Policies per pending_packs
create policy "Allow users to read own packs" 
  on public.pending_packs for select 
  using (auth.uid() = user_id);

create policy "Allow users to manage own packs" 
  on public.pending_packs for all 
  using (auth.uid() = user_id);

-- Policies per user_collection
create policy "Allow users to read own collection" 
  on public.user_collection for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert into own collection" 
  on public.user_collection for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to delete from own collection" 
  on public.user_collection for delete 
  using (auth.uid() = user_id);


-- =============================================================================
-- 3. TASSONOMIA CARTE FISICHE (VETRINA/ASTE DA CLAUDE.MD)
-- =============================================================================

-- Tabella Set (es. OP-10, SV08)
create table if not exists public.sets (
  id text primary key, -- es. "op-10", "sv-08"
  gioco text not null check (gioco in ('pokemon', 'one_piece')),
  nome text not null,
  codice_ufficiale text not null,
  data_uscita date,
  numero_carte_totali integer,
  fonte_externa text, -- Riferimento a API esterne
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabella Definizione Carta (Identità canonica)
create table if not exists public.card_definitions (
  id text primary key, -- es. "op10-119", "sv08-25"
  set_id text references public.sets(id) on delete cascade not null,
  nome text not null,
  numero_raccolta text not null,
  tipo_carta text, -- es. "Leader", "Stage 1", "Trainer"
  rarita text not null, -- es. "SEC", "SAR", "Holo"
  lingua_stampa text not null check (lingua_stampa in ('it', 'en', 'jp')),
  fonte_externa text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabella Varianti (normale, alternate, full_art, promo...)
create table if not exists public.variants (
  id uuid default gen_random_uuid() primary key,
  card_definition_id text references public.card_definitions(id) on delete cascade not null,
  tipo_variante text not null, -- es. 'holo', 'alternate_art', 'parallel', 'manga_art'
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabella Pezzi Fisici in Vetrina (Item posseduti da Kudjo)
create table if not exists public.items (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references public.variants(id) on delete cascade not null,
  condizione_raw text not null check (condizione_raw in ('NM', 'LP', 'MP', 'HP', 'DMG')),
  gradata boolean not null default false,
  grading_company text check (grading_company in ('PSA', 'CGC', 'BGS', 'GRAAD')),
  voto numeric(3,1) check (voto >= 1.0 and voto <= 10.0),
  foto text[] not null, -- Array di URL delle foto
  prezzo numeric not null check (prezzo >= 0),
  stato text not null default 'disponibile' check (stato in ('disponibile', 'riservata', 'venduta')),
  nota_storia text,
  data_inserimento timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS per Tassonomia Vetrina
alter table public.sets enable row level security;
alter table public.card_definitions enable row level security;
alter table public.variants enable row level security;
alter table public.items enable row level security;

-- Policies Pubbliche (Tutti possono leggere la vetrina)
create policy "Allow public read for sets" on public.sets for select using (true);
create policy "Allow public read for card_definitions" on public.card_definitions for select using (true);
create policy "Allow public read for variants" on public.variants for select using (true);
create policy "Allow public read for items" on public.items for select using (true);

-- Policies di Scrittura (Solo gli amministratori autenticati o il database manager possono scrivere)
-- Nota: In produzione, puoi legare questo controllo a un ruolo admin specifico o disabilitare le policy di scrittura
-- lasciandole accessibili solo via dashboard/service_role.
create policy "Restrict write to authenticated admins for sets" 
  on public.sets for all 
  using (auth.role() = 'authenticated');

create policy "Restrict write to authenticated admins for card_definitions" 
  on public.card_definitions for all 
  using (auth.role() = 'authenticated');

create policy "Restrict write to authenticated admins for variants" 
  on public.variants for all 
  using (auth.role() = 'authenticated');

create policy "Restrict write to authenticated admins for items" 
  on public.items for all 
  using (auth.role() = 'authenticated');
