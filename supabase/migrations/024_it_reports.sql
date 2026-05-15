-- Månedlige IT-rapporter pr. organisation (AI + PDF + portal).

create table if not exists public.it_reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  content jsonb not null default '{}'::jsonb,
  ai_summary text,
  ai_recommendations text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists it_reports_org_created_idx
  on public.it_reports (organisation_id, created_at desc);

create index if not exists it_reports_status_idx
  on public.it_reports (organisation_id, status);

comment on table public.it_reports is 'Månedlige IT-statusrapporter (kladde → sendt til kundeportal).';

create or replace function public.set_it_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_it_reports_updated_at on public.it_reports;
create trigger trg_it_reports_updated_at
  before update on public.it_reports
  for each row execute procedure public.set_it_reports_updated_at();

alter table public.it_reports enable row level security;

drop policy if exists "Admin fuld adgang til it_reports" on public.it_reports;
create policy "Admin fuld adgang til it_reports"
  on public.it_reports for all
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Kunder kan se sendte it_rapporter" on public.it_reports;
create policy "Kunder kan se sendte it_rapporter"
  on public.it_reports for select
  to authenticated
  using (
    status = 'sent'
    and organisation_id in (
      select p.organisation_id
      from public.profiles p
      where p.user_id = auth.uid()
        and p.organisation_id is not null
    )
  );
