-- Kør i Supabase SQL Editor (eller via CLI).
--
-- Giver brugere der findes i public.admins fuld læse- og skriveadgang til
-- alle tabeller som vises i admin-portalen. Policies er additive: eksisterende
-- bruger-scopede policies (auth.uid() = user_id m.fl.) bevares og fortsætter
-- med at gælde for almindelige brugere — admin-policy'en lægger blot et OR
-- ovenpå (Postgres anvender OR mellem permissive policies).
--
-- Idempotent: kan køres flere gange uden bivirkninger.

-- Sikrer at RLS er slået til på alle tabeller (no-op hvis allerede aktivt).
alter table public.organisations    enable row level security;
alter table public.profiles         enable row level security;
alter table public.tickets          enable row level security;
alter table public.messages         enable row level security;
alter table public.invitations      enable row level security;
alter table public.reports          enable row level security;
alter table public.systems          enable row level security;
alter table public.vault_entries    enable row level security;
alter table public.guides           enable row level security;
alter table public.guide_categories enable row level security;
alter table public.email_templates  enable row level security;
alter table public.attachments      enable row level security;

-- organisations
drop policy if exists "Admin fuld adgang" on public.organisations;
create policy "Admin fuld adgang"
on public.organisations
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- profiles
drop policy if exists "Admin fuld adgang" on public.profiles;
create policy "Admin fuld adgang"
on public.profiles
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- tickets
drop policy if exists "Admin fuld adgang" on public.tickets;
create policy "Admin fuld adgang"
on public.tickets
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- messages
drop policy if exists "Admin fuld adgang" on public.messages;
create policy "Admin fuld adgang"
on public.messages
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- invitations
drop policy if exists "Admin fuld adgang" on public.invitations;
create policy "Admin fuld adgang"
on public.invitations
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- reports
drop policy if exists "Admin fuld adgang" on public.reports;
create policy "Admin fuld adgang"
on public.reports
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- systems
drop policy if exists "Admin fuld adgang" on public.systems;
create policy "Admin fuld adgang"
on public.systems
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- vault_entries
drop policy if exists "Admin fuld adgang" on public.vault_entries;
create policy "Admin fuld adgang"
on public.vault_entries
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- guides
drop policy if exists "Admin fuld adgang" on public.guides;
create policy "Admin fuld adgang"
on public.guides
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- guide_categories
drop policy if exists "Admin fuld adgang" on public.guide_categories;
create policy "Admin fuld adgang"
on public.guide_categories
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- email_templates
drop policy if exists "Admin fuld adgang" on public.email_templates;
create policy "Admin fuld adgang"
on public.email_templates
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- attachments
drop policy if exists "Admin fuld adgang" on public.attachments;
create policy "Admin fuld adgang"
on public.attachments
for all
to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));
