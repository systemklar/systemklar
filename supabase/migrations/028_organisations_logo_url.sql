-- Public Storage URL for organisation logo (set after upload on /portal/team).

alter table public.organisations
  add column if not exists logo_url text;

comment on column public.organisations.logo_url is 'Fuld public Supabase Storage URL til organisationslogo.';

drop policy if exists "Org admin update own organisation" on public.organisations;
create policy "Org admin update own organisation"
  on public.organisations for update
  to authenticated
  using (
    id in (
      select p.organisation_id
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'org_admin'
        and p.organisation_id is not null
    )
  )
  with check (
    id in (
      select p.organisation_id
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'org_admin'
        and p.organisation_id is not null
    )
  );
