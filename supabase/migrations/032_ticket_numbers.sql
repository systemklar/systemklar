-- Supportsager: løbenummer, prioritet og opdateret-tid.

alter table public.tickets
  add column if not exists ticket_number serial;

alter table public.tickets
  add column if not exists priority text not null default 'medium';

alter table public.tickets
  add column if not exists updated_at timestamptz not null default now();

-- Normaliser evt. danske prioritetsværdier fra admin.
update public.tickets
set priority = 'low'
where priority in ('lav', 'low');

update public.tickets
set priority = 'high'
where priority in ('høj', 'hoj', 'high');

update public.tickets
set priority = 'medium'
where priority is null
   or priority in ('normal', 'medium', '');

alter table public.tickets
  drop constraint if exists tickets_priority_check;

alter table public.tickets
  add constraint tickets_priority_check
  check (priority in ('low', 'medium', 'high'));

create unique index if not exists tickets_ticket_number_unique
  on public.tickets (ticket_number);

comment on column public.tickets.ticket_number is 'Løbenummer til visning, fx #1042.';
comment on column public.tickets.priority is 'low | medium | high';
comment on column public.tickets.updated_at is 'Senest opdateret (sag eller besked).';

create or replace function public.set_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.set_tickets_updated_at();

create or replace function public.bump_ticket_updated_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tickets
  set updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_bump_ticket_updated on public.messages;
create trigger trg_messages_bump_ticket_updated
  after insert on public.messages
  for each row execute procedure public.bump_ticket_updated_on_message();
