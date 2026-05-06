-- Vejledninger/FAQ + ticket-vedhæftninger + storage bucket "attachments".

-- ─── guide_categories ─────────────────────────────────────────────────────
create table if not exists public.guide_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_key text not null default 'HelpCircle'
    check (icon_key in (
      'LayoutDashboard',
      'MessageSquare',
      'Lock',
      'FileText',
      'Monitor',
      'HelpCircle'
    )),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists guide_categories_sort_idx
  on public.guide_categories (sort_order, name);

alter table public.guide_categories enable row level security;

drop policy if exists "guide_categories_select_auth" on public.guide_categories;
create policy "guide_categories_select_auth"
  on public.guide_categories for select
  to authenticated
  using (true);

drop policy if exists "guide_categories_admin_all" on public.guide_categories;
create policy "guide_categories_admin_all"
  on public.guide_categories for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ─── guides ────────────────────────────────────────────────────────────────
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.guide_categories (id) on delete restrict,
  title text not null,
  type text not null check (type in ('video', 'faq', 'article')),
  content text not null default '',
  video_url text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guides_category_sort_idx
  on public.guides (category_id, sort_order, title);

create index if not exists guides_published_idx
  on public.guides (published)
  where published = true;

alter table public.guides enable row level security;

drop policy if exists "guides_select_published" on public.guides;
create policy "guides_select_published"
  on public.guides for select
  to authenticated
  using (published = true);

drop policy if exists "guides_admin_all" on public.guides;
create policy "guides_admin_all"
  on public.guides for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ─── attachments ───────────────────────────────────────────────────────────
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  organisation_id uuid not null,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_size bigint,
  file_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists attachments_ticket_idx
  on public.attachments (ticket_id, created_at);

create index if not exists attachments_message_idx
  on public.attachments (message_id);

alter table public.attachments enable row level security;

drop policy if exists "attachments_select" on public.attachments;
create policy "attachments_select"
  on public.attachments for select
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
    or exists (
      select 1
      from public.tickets t
      inner join public.profiles p
        on p.organisation_id = t.organisation_id
        and p.user_id = auth.uid()
      where t.id = attachments.ticket_id
    )
  );

drop policy if exists "attachments_insert" on public.attachments;
create policy "attachments_insert"
  on public.attachments for insert
  with check (
    auth.uid() = uploaded_by
    and organisation_id = (
      select t.organisation_id from public.tickets t where t.id = ticket_id
    )
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.tickets t
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where t.id = ticket_id
      )
    )
  );

drop policy if exists "attachments_update" on public.attachments;
create policy "attachments_update"
  on public.attachments for update
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
    or (
      auth.uid() = uploaded_by
      and exists (
        select 1
        from public.tickets t
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where t.id = attachments.ticket_id
      )
    )
  )
  with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
    or (
      auth.uid() = uploaded_by
      and exists (
        select 1
        from public.tickets t
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where t.id = attachments.ticket_id
      )
    )
  );

drop policy if exists "attachments_delete" on public.attachments;
create policy "attachments_delete"
  on public.attachments for delete
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
    or (
      auth.uid() = uploaded_by
      and exists (
        select 1
        from public.tickets t
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where t.id = attachments.ticket_id
      )
    )
  );

-- ─── Storage bucket ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit;

drop policy if exists "attachments_storage_select" on storage.objects;
create policy "attachments_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.attachments att
        inner join public.tickets t on t.id = att.ticket_id
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where att.storage_path = objects.name
      )
    )
  );

drop policy if exists "attachments_storage_insert" on storage.objects;
create policy "attachments_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.profiles p
        inner join public.tickets t
          on t.organisation_id = p.organisation_id
          and t.organisation_id::text = split_part(objects.name, '/', 1)
          and t.id::text = split_part(objects.name, '/', 2)
        where p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "attachments_storage_delete" on storage.objects;
create policy "attachments_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.attachments att
        inner join public.tickets t on t.id = att.ticket_id
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and p.user_id = auth.uid()
        where att.storage_path = objects.name
          and att.uploaded_by = auth.uid()
      )
    )
  );
