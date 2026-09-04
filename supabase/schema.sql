-- Run this script once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

-- ============================================================
-- profiles: one row per registered user, holds the public username
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(trim(username)) between 3 and 24),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
-- Expects the client to pass `username` in supabase.auth.signUp({ options: { data: { username } } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- scores: one row per submitted game result (registered or guest)
-- ============================================================
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  score integer not null check (score >= 0 and score <= 999999),
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc);

alter table public.scores enable row level security;

drop policy if exists "Scores are viewable by everyone" on public.scores;
create policy "Scores are viewable by everyone"
  on public.scores for select
  using (true);

-- Registered users may only insert scores under their own user_id; guests must leave user_id null.
drop policy if exists "Users can insert their own scores, guests insert anonymously" on public.scores;
create policy "Users can insert their own scores, guests insert anonymously"
  on public.scores for insert
  with check (
    (is_guest = false and user_id = auth.uid())
    or
    (is_guest = true and user_id is null)
  );
