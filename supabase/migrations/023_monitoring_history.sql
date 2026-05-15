-- Overvågning: gem historik (flere rækker pr. organisation + system over tid).
drop index if exists public.monitoring_results_org_system_unique;

comment on table public.monitoring_results is 'Overvågningsresultater pr. kørsel; historik bevares (seneste pr. system findes i applikationen).';
