-- Kundens website-domæne (uden protokol), til senere overvågning (uptime, SSL, DNS).
alter table public.organisations
  add column if not exists domain text;

comment on column public.organisations.domain is 'Website hostname uden protokol, fx benjasmod.dk — til automatisk overvågning.';
