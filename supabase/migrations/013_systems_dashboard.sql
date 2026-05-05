create table if not exists public.systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cloud', 'server', 'netværk', 'software')),
  status text not null default 'ok' check (status in ('ok', 'advarsel', 'nede')),
  url text,
  notes text,
  last_checked timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists systems_user_created_idx on public.systems (user_id, created_at desc);
create index if not exists systems_status_idx on public.systems (status);

alter table public.systems enable row level security;

drop policy if exists "systems_select_own" on public.systems;
create policy "systems_select_own"
  on public.systems for select
  using (auth.uid() = user_id);

drop policy if exists "systems_insert_own" on public.systems;
create policy "systems_insert_own"
  on public.systems for insert
  with check (auth.uid() = user_id);

drop policy if exists "systems_update_own" on public.systems;
create policy "systems_update_own"
  on public.systems for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "systems_delete_own" on public.systems;
create policy "systems_delete_own"
  on public.systems for delete
  using (auth.uid() = user_id);
