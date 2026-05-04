-- Kør i Supabase SQL Editor (eller via CLI).
-- Tabeller: admins, messages + opdaterede RLS-politikker for tickets.

-- Admins: én række pr. admin-bruger (auth.users.id)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self"
  on public.admins for select
  using (auth.uid() = user_id);

-- Beskeder på tickets
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_ticket_created_idx
  on public.messages (ticket_id, created_at asc);

alter table public.messages enable row level security;

-- Erstat gamle ticket-politikker med egne + admin
drop policy if exists "Brugere kan se egne tickets" on public.tickets;
drop policy if exists "Brugere kan oprette egne tickets" on public.tickets;
drop policy if exists "Brugere kan opdatere egne tickets" on public.tickets;
drop policy if exists "tickets_select_own_or_admin" on public.tickets;
drop policy if exists "tickets_insert_own" on public.tickets;
drop policy if exists "tickets_update_own_or_admin" on public.tickets;
drop policy if exists "tickets_delete_own_or_admin" on public.tickets;

create policy "tickets_select_own_or_admin"
  on public.tickets for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "tickets_insert_own"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "tickets_update_own_or_admin"
  on public.tickets for update
  using (
    auth.uid() = user_id
    or exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

create policy "tickets_delete_own_or_admin"
  on public.tickets for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

-- Messages: læs hvis ticket ejes af bruger eller bruger er admin
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1
      from public.tickets t
      where t.id = messages.ticket_id
        and (
          t.user_id = auth.uid()
          or exists (select 1 from public.admins a where a.user_id = auth.uid())
        )
    )
  );

-- Kunde: besked på egen sag, ikke markeret som admin
drop policy if exists "messages_insert_customer" on public.messages;
create policy "messages_insert_customer"
  on public.messages for insert
  with check (
    is_admin = false
    and auth.uid() = user_id
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- Admin: kan skrive som admin på enhver sag
drop policy if exists "messages_insert_admin" on public.messages;
create policy "messages_insert_admin"
  on public.messages for insert
  with check (
    is_admin = true
    and auth.uid() = user_id
    and exists (select 1 from public.admins a where a.user_id = auth.uid())
  );
