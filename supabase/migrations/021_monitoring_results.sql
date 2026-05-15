-- Automatisk overvågning: seneste resultat pr. organisation + systemnavn.
create table if not exists public.monitoring_results (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  system_name text not null,
  status text not null check (status in ('ok', 'advarsel', 'fejl', 'afventer')),
  checked_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create unique index if not exists monitoring_results_org_system_unique
  on public.monitoring_results (organisation_id, system_name);

create index if not exists monitoring_results_org_checked_idx
  on public.monitoring_results (organisation_id, checked_at desc);

comment on table public.monitoring_results is 'Seneste overvågningsresultat pr. valgt onboarding-system for en organisation.';

alter table public.monitoring_results enable row level security;

drop policy if exists "Bruger læser egen organisations monitoring" on public.monitoring_results;
create policy "Bruger læser egen organisations monitoring"
  on public.monitoring_results for select
  to authenticated
  using (
    organisation_id in (
      select p.organisation_id from public.profiles p
      where p.user_id = auth.uid() and p.organisation_id is not null
    )
  );

drop policy if exists "Admin fuld adgang monitoring_results" on public.monitoring_results;
create policy "Admin fuld adgang monitoring_results"
  on public.monitoring_results for all
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Kun service role / admin-policy skriver; ingen insert for alm. portalbruger.
grant select on public.monitoring_results to authenticated;
