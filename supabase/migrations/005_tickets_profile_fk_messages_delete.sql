-- 1) Admin kan slette beskeder (bulk / oprydning)
drop policy if exists "messages_delete_admin" on public.messages;
create policy "messages_delete_admin"
  on public.messages for delete
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

-- 2) Tickets refererer til kundeprofil (samme UUID som auth), så PostgREST kan embed'e profiles(...)
-- Kræver at hver ticket-ejer har en profil med matchende user_id.
alter table public.tickets drop constraint if exists tickets_user_id_fkey;

alter table public.tickets
  add constraint tickets_user_id_fkey
  foreign key (user_id) references public.profiles (user_id) on delete cascade;
