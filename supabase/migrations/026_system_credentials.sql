-- Krypterede API-nøgler til self-service integrationer (portal /systemer).
-- Payload krypteres i applikationen (VAULT_ENCRYPTION_KEY eller b64-fallback).

create table if not exists public.system_credentials (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  system_name text not null,
  encrypted_payload text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, system_name)
);

create index if not exists system_credentials_org_idx
  on public.system_credentials (organisation_id);

comment on table public.system_credentials is 'Krypterede integrationsnøgler pr. organisation og onboarding-systemnavn.';

alter table public.system_credentials enable row level security;

drop policy if exists "Org members read system_credentials" on public.system_credentials;
create policy "Org members read system_credentials"
  on public.system_credentials for select
  to authenticated
  using (
    organisation_id in (
      select p.organisation_id from public.profiles p
      where p.user_id = auth.uid() and p.organisation_id is not null
    )
  );

drop policy if exists "Org members insert system_credentials" on public.system_credentials;
create policy "Org members insert system_credentials"
  on public.system_credentials for insert
  to authenticated
  with check (
    organisation_id in (
      select p.organisation_id from public.profiles p
      where p.user_id = auth.uid() and p.organisation_id is not null
    )
  );

drop policy if exists "Org members update system_credentials" on public.system_credentials;
create policy "Org members update system_credentials"
  on public.system_credentials for update
  to authenticated
  using (
    organisation_id in (
      select p.organisation_id from public.profiles p
      where p.user_id = auth.uid() and p.organisation_id is not null
    )
  )
  with check (
    organisation_id in (
      select p.organisation_id from public.profiles p
      where p.user_id = auth.uid() and p.organisation_id is not null
    )
  );

drop policy if exists "Admin fuld adgang system_credentials" on public.system_credentials;
create policy "Admin fuld adgang system_credentials"
  on public.system_credentials for all
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create or replace function public.set_system_credentials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_system_credentials_updated_at on public.system_credentials;
create trigger trg_system_credentials_updated_at
  before update on public.system_credentials
  for each row execute procedure public.set_system_credentials_updated_at();

grant select, insert, update on public.system_credentials to authenticated;
