-- Ydelser (prisliste) og tilbud (AI-genererede til kunder).

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null,
  unit text not null check (unit in ('månedlig', 'time', 'engangspris')),
  created_at timestamptz not null default now()
);

create index if not exists services_created_at_idx on public.services (created_at desc);

alter table public.services enable row level security;

drop policy if exists "services_select_admin" on public.services;
create policy "services_select_admin"
  on public.services for select
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "services_insert_admin" on public.services;
create policy "services_insert_admin"
  on public.services for insert
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "services_update_admin" on public.services;
create policy "services_update_admin"
  on public.services for update
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "services_delete_admin" on public.services;
create policy "services_delete_admin"
  on public.services for delete
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists quotes_customer_created_idx
  on public.quotes (customer_profile_id, created_at desc);

alter table public.quotes enable row level security;

drop policy if exists "quotes_select_admin" on public.quotes;
create policy "quotes_select_admin"
  on public.quotes for select
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "quotes_insert_admin" on public.quotes;
create policy "quotes_insert_admin"
  on public.quotes for insert
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "quotes_update_admin" on public.quotes;
create policy "quotes_update_admin"
  on public.quotes for update
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "quotes_delete_admin" on public.quotes;
create policy "quotes_delete_admin"
  on public.quotes for delete
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "quotes_select_own_sent" on public.quotes;
create policy "quotes_select_own_sent"
  on public.quotes for select
  using (
    status = 'sent'
    and exists (
      select 1 from public.profiles p
      where p.id = quotes.customer_profile_id
        and p.user_id is not null
        and p.user_id = auth.uid()
    )
  );
