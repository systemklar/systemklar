-- Onboarding for nye kunder i portalen.
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  add column if not exists onboarding_systems text[] not null default '{}';

comment on column public.profiles.onboarding_completed is 'Sættes true når kunden har gennemført /portal/onboarding.';
comment on column public.profiles.onboarding_systems is 'Valgte systemer fra onboarding (visningsnavne).';

-- Eksisterende profiler springer onboarding over.
update public.profiles
set onboarding_completed = true
where onboarding_completed = false;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or auth.uid() = user_id)
  with check (auth.uid() = id or auth.uid() = user_id);
