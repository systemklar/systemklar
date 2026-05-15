-- Portal profile pictures: bucket `avatars` (see src/app/portal/profil/page.tsx — upload path = auth.uid()).
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 5242880)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- Public URLs (getPublicUrl) need SELECT for anonymous clients loading images.
drop policy if exists "Public read avatars bucket" on storage.objects;
create policy "Public read avatars bucket"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (auth.uid())::text
  );

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and name = (auth.uid())::text
  );
