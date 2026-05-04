-- Tidspunkt for velkomst/invite-flow (Supabase invite sendt fra admin).
alter table public.profiles add column if not exists invited_at timestamptz;

comment on column public.profiles.invited_at is 'Sættes når admin sender invitation (invite-mail).';

-- Eksisterende profiler med auth-bruger men uden invited_at: antag allerede inviteret.
update public.profiles
set invited_at = coalesce(invited_at, created_at)
where user_id is not null
  and invited_at is null;
