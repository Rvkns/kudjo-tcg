-- =============================================================================
-- KUDJO SURVEYS SYSTEM MIGRATION
-- =============================================================================
-- Copia ed esegui questo script all'interno del SQL Editor di Supabase.
-- Crea il supporto ai sondaggi admin, le domande ad essi correlate, 
-- le risposte generali degli utenti e le singole risposte alle domande.

-- =============================================================================
-- 1. TABELLA SONDAGGI (SURVEYS)
-- =============================================================================
create table if not exists public.surveys (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.surveys enable row level security;

-- Lettura consentita a tutti gli utenti autenticati
drop policy if exists "Allow authenticated read for surveys" on public.surveys;
create policy "Allow authenticated read for surveys"
  on public.surveys for select
  using (auth.role() = 'authenticated');

-- Scrittura riservata al service_role (usato lato backend)
drop policy if exists "Allow service role write for surveys" on public.surveys;
create policy "Allow service role write for surveys"
  on public.surveys for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 2. TABELLA DOMANDE (SURVEY_QUESTIONS)
-- =============================================================================
create table if not exists public.survey_questions (
  id uuid default gen_random_uuid() primary key,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  question_text text not null,
  question_type text not null check (question_type in ('open', 'multiple_choice')),
  options text[], -- Array di testi per risposte chiuse
  order_index integer not null default 0,
  created_at timestamp with time zone default now() not null
);

alter table public.survey_questions enable row level security;

-- Lettura consentita a tutti gli utenti autenticati
drop policy if exists "Allow authenticated read for survey_questions" on public.survey_questions;
create policy "Allow authenticated read for survey_questions"
  on public.survey_questions for select
  using (auth.role() = 'authenticated');

-- Scrittura riservata al service_role (usato lato backend)
drop policy if exists "Allow service role write for survey_questions" on public.survey_questions;
create policy "Allow service role write for survey_questions"
  on public.survey_questions for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 3. TABELLA RISPOSTE UTENTI (SURVEY_RESPONSES)
-- =============================================================================
create table if not exists public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (survey_id, user_id)
);

alter table public.survey_responses enable row level security;

-- L'utente può leggere solo le proprie risposte ai sondaggi
drop policy if exists "Allow users to read own survey_responses" on public.survey_responses;
create policy "Allow users to read own survey_responses"
  on public.survey_responses for select
  using (auth.uid() = user_id);

-- L'utente può inserire la propria risposta a un sondaggio
drop policy if exists "Allow users to insert own survey_responses" on public.survey_responses;
create policy "Allow users to insert own survey_responses"
  on public.survey_responses for insert
  with check (auth.uid() = user_id);

-- Scrittura/Gestione per il service_role
drop policy if exists "Allow service role write for survey_responses" on public.survey_responses;
create policy "Allow service role write for survey_responses"
  on public.survey_responses for all
  using (auth.role() = 'service_role');


-- =============================================================================
-- 4. TABELLA RISPOSTE AI SINGOLI QUESITI (SURVEY_ANSWERS)
-- =============================================================================
create table if not exists public.survey_answers (
  id uuid default gen_random_uuid() primary key,
  response_id uuid references public.survey_responses(id) on delete cascade not null,
  question_id uuid references public.survey_questions(id) on delete cascade not null,
  answer_text text, -- Risposta aperta testuale o valore dell'opzione selezionata
  created_at timestamp with time zone default now() not null
);

alter table public.survey_answers enable row level security;

-- L'utente può leggere le proprie risposte dettagliate se possiede il survey_response
drop policy if exists "Allow users to read own survey_answers" on public.survey_answers;
create policy "Allow users to read own survey_answers"
  on public.survey_answers for select
  using (
    exists (
      select 1 from public.survey_responses r
      where r.id = response_id and r.user_id = auth.uid()
    )
  );

-- L'utente può inserire risposte se possiede il survey_response
drop policy if exists "Allow users to insert own survey_answers" on public.survey_answers;
create policy "Allow users to insert own survey_answers"
  on public.survey_answers for insert
  with check (
    exists (
      select 1 from public.survey_responses r
      where r.id = response_id and r.user_id = auth.uid()
    )
  );

-- Scrittura/Gestione per il service_role
drop policy if exists "Allow service role write for survey_answers" on public.survey_answers;
create policy "Allow service role write for survey_answers"
  on public.survey_answers for all
  using (auth.role() = 'service_role');
