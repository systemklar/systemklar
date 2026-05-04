-- Kunder må læse egen profil (fx. firmanavn på supportsiden).
-- Flere SELECT-politikker på samme tabel kombineres med OR i Postgres (RLS permissive).

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);
