create table if not exists public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  username text,
  encrypted_password text,
  url text,
  category text check (category in ('microsoft', 'google', 'regnskab', 'webshop', 'hr', 'it', 'andet')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_entries_user_id_idx
  on public.vault_entries (user_id, created_at desc);

alter table public.vault_entries enable row level security;

drop policy if exists "vault_select_own" on public.vault_entries;
create policy "vault_select_own"
  on public.vault_entries for select
  using (auth.uid() = user_id);

drop policy if exists "vault_insert_own" on public.vault_entries;
create policy "vault_insert_own"
  on public.vault_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "vault_update_own" on public.vault_entries;
create policy "vault_update_own"
  on public.vault_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "vault_delete_own" on public.vault_entries;
create policy "vault_delete_own"
  on public.vault_entries for delete
  using (auth.uid() = user_id);

create or replace function public.set_vault_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vault_entries_updated_at on public.vault_entries;
create trigger trg_vault_entries_updated_at
before update on public.vault_entries
for each row execute procedure public.set_vault_entries_updated_at();
