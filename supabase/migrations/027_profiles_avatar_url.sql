-- Public Storage URL for user profile picture (set after upload in portal).

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'Fuld public Supabase Storage URL til profilbillede.';
