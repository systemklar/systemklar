-- Guided dashboard tour (portal /portal).

alter table public.profiles
  add column if not exists onboarding_tour_completed boolean not null default false;

comment on column public.profiles.onboarding_tour_completed is 'Sættes true når kunden har gennemført eller sprunget dashboard-touren over.';
