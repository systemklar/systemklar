-- Profile & organisation settings (portal /profil and /team).

alter table public.profiles
  add column if not exists phone text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.phone is 'Valgfrit telefonnummer (portal profil).';
comment on column public.profiles.notification_preferences is 'JSON: ticket_updated, system_failure, report_ready, weekly_status (booleans).';

alter table public.organisations
  add column if not exists industry text,
  add column if not exists employee_count text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

comment on column public.organisations.industry is 'Branche (portal team).';
comment on column public.organisations.employee_count is 'Antal ansatte interval (portal team).';
comment on column public.organisations.notification_preferences is 'JSON: notify_all_system_failure, notify_all_monthly_report (booleans).';
