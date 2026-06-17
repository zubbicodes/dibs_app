create table if not exists public.auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{2}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz not null default now()
);

alter table public.auth_challenges enable row level security;

drop policy if exists "auth_challenges_select_own" on public.auth_challenges;
create policy "auth_challenges_select_own"
  on public.auth_challenges for select
  using (auth.uid() = user_id);

drop policy if exists "auth_challenges_update_own" on public.auth_challenges;
create policy "auth_challenges_update_own"
  on public.auth_challenges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "auth_challenges_insert_own" on public.auth_challenges;
create policy "auth_challenges_insert_own"
  on public.auth_challenges for insert
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'auth_challenges'
  ) then
    alter publication supabase_realtime add table public.auth_challenges;
  end if;
end;
$$;
