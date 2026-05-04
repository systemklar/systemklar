-- Kør dette i Supabase SQL Editor, eller brug Supabase CLI migreringer.
-- Tabel til supportsager fra portalen.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_id_created_at_idx
  on public.tickets (user_id, created_at desc);

alter table public.tickets enable row level security;

create policy "Brugere kan se egne tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

create policy "Brugere kan oprette egne tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "Brugere kan opdatere egne tickets"
  on public.tickets for update
  using (auth.uid() = user_id);
