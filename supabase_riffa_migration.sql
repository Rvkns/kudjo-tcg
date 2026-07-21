-- =============================================================================
-- KUDJO RIFFA WINNERS SYSTEM MIGRATION
-- =============================================================================
-- Copia ed esegui questo script all'interno del SQL Editor di Supabase.
-- Crea la tabella per memorizzare i vincitori estratti per ogni concorso.

-- =============================================================================
-- 1. TABELLA VINCITORI CONCORSO (CONCORSO_WINNERS)
-- =============================================================================
create table if not exists public.concorso_winners (
  id uuid default gen_random_uuid() primary key,
  concorso_id uuid references public.concorsi(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticket_count integer not null check (ticket_count >= 0),
  prize text not null,
  draw_index integer not null default 0,
  drawn_at timestamp with time zone default now() not null,
  unique (concorso_id, draw_index) -- Un solo vincitore per specifico indice di estrazione per concorso
);

alter table public.concorso_winners enable row level security;

-- Lettura consentita a tutti gli utenti autenticati (per vedere i vincitori dei concorsi)
drop policy if exists "Allow authenticated read for concorso_winners" on public.concorso_winners;
create policy "Allow authenticated read for concorso_winners"
  on public.concorso_winners for select
  using (auth.role() = 'authenticated');

-- Scrittura riservata al service_role (usato lato backend nell'endpoint di sorteggio)
drop policy if exists "Allow service role write for concorso_winners" on public.concorso_winners;
create policy "Allow service role write for concorso_winners"
  on public.concorso_winners for all
  using (auth.role() = 'service_role');
