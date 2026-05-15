-- Tillad autentificerede brugere at læse andre profiler i samme organisation
-- (fx. union af onboarding_systems til portal-dashboard som matcher admin-preview).

drop policy if exists "profiles_select_org_members" on public.profiles;
create policy "profiles_select_org_members"
  on public.profiles
  for select
  to authenticated
  using (
    organisation_id is not null
    and exists (
      select 1
      from public.profiles me
      where me.user_id = auth.uid()
        and me.organisation_id is not null
        and me.organisation_id = profiles.organisation_id
    )
  );
