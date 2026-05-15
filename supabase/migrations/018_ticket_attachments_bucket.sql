-- Public storage bucket for ticket file uploads (portal support).
insert into storage.buckets (id, name, public, file_size_limit)
values ('ticket-attachments', 'ticket-attachments', true, 10485760)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit;

-- Allow authenticated users in the ticket's organisation to upload (path: org_id/ticket_id/...).
drop policy if exists "ticket_attachments_storage_insert" on storage.objects;
create policy "ticket_attachments_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ticket-attachments'
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.profiles p
        inner join public.tickets t
          on t.organisation_id = p.organisation_id
          and t.organisation_id::text = split_part(name, '/', 1)
          and t.id::text = split_part(name, '/', 2)
        where p.id = auth.uid() or p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "ticket_attachments_storage_delete" on storage.objects;
create policy "ticket_attachments_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and (
      exists (select 1 from public.admins a where a.user_id = auth.uid())
      or exists (
        select 1
        from public.attachments att
        inner join public.tickets t on t.id = att.ticket_id
        inner join public.profiles p
          on p.organisation_id = t.organisation_id
          and (p.id = auth.uid() or p.user_id = auth.uid())
        where att.storage_path = objects.name
          and att.uploaded_by = auth.uid()
      )
    )
  );

-- Profiles matched by id OR user_id (same fix as portal support).
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
          and (p.id = auth.uid() or p.user_id = auth.uid())
        where t.id = ticket_id
      )
    )
  );

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
        and (p.id = auth.uid() or p.user_id = auth.uid())
      where t.id = attachments.ticket_id
    )
  );
