-- ANT Fantezi Lig - Supabase veritabanı
create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_name text not null default 'A' check (group_name in ('A','B')),
  color text default '#0ea5e9',
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  position text not null default 'Forvet',
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  group_name text not null default 'A' check (group_name in ('A','B')),
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  match_date timestamptz not null,
  played boolean not null default false,
  home_score integer,
  away_score integer,
  created_at timestamptz not null default now(),
  constraint different_teams check (home_team_id <> away_team_id),
  constraint scores_nonnegative check ((home_score is null or home_score >= 0) and (away_score is null or away_score >= 0))
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  created_at timestamptz not null default now(),
  constraint event_has_stat check (goals > 0 or assists > 0)
);

create index if not exists idx_players_team on public.players(team_id);
create index if not exists idx_matches_date on public.matches(match_date);
create index if not exists idx_events_match on public.match_events(match_id);
create index if not exists idx_events_player on public.match_events(player_id);

-- İlk kurulum için: Authentication > Users bölümünden admin hesabını oluştur.
-- RLS: sadece giriş yapmış kullanıcılar admin panelinden CRUD yapabilsin.
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

drop policy if exists "authenticated_all_teams" on public.teams;
create policy "authenticated_all_teams" on public.teams for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_all_players" on public.players;
create policy "authenticated_all_players" on public.players for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_all_matches" on public.matches;
create policy "authenticated_all_matches" on public.matches for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_all_events" on public.match_events;
create policy "authenticated_all_events" on public.match_events for all to authenticated using (true) with check (true);

-- Ana site daha sonra herkese açık okuyabilsin diye SELECT policy'leri:
drop policy if exists "public_read_teams" on public.teams;
create policy "public_read_teams" on public.teams for select to anon, authenticated using (true);
drop policy if exists "public_read_players" on public.players;
create policy "public_read_players" on public.players for select to anon, authenticated using (true);
drop policy if exists "public_read_matches" on public.matches;
create policy "public_read_matches" on public.matches for select to anon, authenticated using (true);
drop policy if exists "public_read_events" on public.match_events;
create policy "public_read_events" on public.match_events for select to anon, authenticated using (true);
