-- Flyt tilbudsgeneratoren til kundeportalen med ejerskab pr. bruger.

alter table public.services
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists services_user_created_idx
  on public.services (user_id, created_at desc);

alter table public.quotes
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists recipient_email text;

update public.quotes q
set
  user_id = p.user_id,
  recipient_email = coalesce(q.recipient_email, p.email)
from public.profiles p
where q.customer_profile_id = p.id
  and q.user_id is null;

drop index if exists quotes_customer_created_idx;
create index if not exists quotes_user_created_idx
  on public.quotes (user_id, created_at desc);

alter table public.quotes
  alter column user_id set not null;

drop policy if exists "services_select_admin" on public.services;
drop policy if exists "services_insert_admin" on public.services;
drop policy if exists "services_update_admin" on public.services;
drop policy if exists "services_delete_admin" on public.services;

drop policy if exists "quotes_select_admin" on public.quotes;
drop policy if exists "quotes_insert_admin" on public.quotes;
drop policy if exists "quotes_update_admin" on public.quotes;
drop policy if exists "quotes_delete_admin" on public.quotes;
drop policy if exists "quotes_select_own_sent" on public.quotes;

drop policy if exists "services_select_own" on public.services;
create policy "services_select_own"
  on public.services for select
  using (auth.uid() = user_id);

drop policy if exists "services_insert_own" on public.services;
create policy "services_insert_own"
  on public.services for insert
  with check (auth.uid() = user_id);

drop policy if exists "services_update_own" on public.services;
create policy "services_update_own"
  on public.services for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "services_delete_own" on public.services;
create policy "services_delete_own"
  on public.services for delete
  using (auth.uid() = user_id);

drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own"
  on public.quotes for select
  using (auth.uid() = user_id);

drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own"
  on public.quotes for insert
  with check (auth.uid() = user_id);

drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own"
  on public.quotes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own"
  on public.quotes for delete
  using (auth.uid() = user_id);

alter table public.quotes
  drop column if exists customer_profile_id;
