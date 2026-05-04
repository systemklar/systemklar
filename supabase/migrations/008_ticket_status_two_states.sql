-- Kun to ticket-statusser: aktiv (= tidligere åben/i gang) og løst (= tidligere lukket).

do $$
declare
  r record;
begin
  for r in (
    select conname
    from pg_constraint
    where conrelid = 'public.tickets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  ) loop
    execute format('alter table public.tickets drop constraint %I', r.conname);
  end loop;
end $$;

update public.tickets set status = 'active' where status in ('open', 'in_progress');
update public.tickets set status = 'resolved' where status in ('closed');

alter table public.tickets
  add constraint tickets_status_check check (status in ('active', 'resolved'));

alter table public.tickets alter column status set default 'active';
