-- Månedlige IT-rapporter (kundeportal + admin).

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null,
  period text not null,
  status_summary text not null default '',
  incidents text not null default '',
  resolved text not null default '',
  recommendations text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reports_user_id_created_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin"
  on public.reports for select
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "reports_insert_admin" on public.reports;
create policy "reports_insert_admin"
  on public.reports for insert
  with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
    and exists (select 1 from public.profiles p where p.user_id = user_id)
  );
