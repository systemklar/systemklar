-- Kundeprofiler til admin-portalen (CRM-light).
-- Kør i Supabase SQL Editor eller via CLI.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text not null,
  plan text not null default 'basis' check (plan in ('basis', 'standard', 'plus')),
  status text not null default 'active' check (status in ('active', 'paused', 'churned')),
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique on public.profiles (lower(email));

create index if not exists profiles_user_id_idx on public.profiles (user_id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
