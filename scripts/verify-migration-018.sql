-- Kør i Supabase SQL Editor for at verificere migration 018.
-- Forventet: bucket findes, policies findes, attachments kan læses.

select id, name, public, file_size_limit
from storage.buckets
where id = 'ticket-attachments';

select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'ticket_attachments%'
order by policyname;

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'attachments'
  and policyname in ('attachments_select', 'attachments_insert', 'Admin fuld adgang')
order by policyname;
