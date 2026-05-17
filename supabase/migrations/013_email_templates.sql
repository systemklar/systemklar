-- Email-skabeloner editor (admins kolonne = user_id, som øvrige policies)
create table if not exists public.email_templates (
  id text primary key,
  name text not null,
  subject text not null,
  body text not null,
  variables text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

drop policy if exists "admin_only" on public.email_templates;
create policy "admin_only"
  on public.email_templates
  for all
  using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

insert into public.email_templates (id, name, subject, body, variables) values
(
  'invite',
  'Invitations-email',
  'Du er inviteret til {{orgName}} på systemklar',
  '<h2 style="margin-top:0;">Du er inviteret til systemklar</h2>
<p>Hej {{contactName}},</p>
<p>Du er blevet inviteret til at få adgang til <strong>{{orgName}}</strong> på systemklar – en IT-platform der samler support, overblik og dokumentation ét sted.</p>
<p>Klik på knappen nedenfor for at oprette din profil. Det tager under 2 minutter.</p>
<p>{{inviteButton}}</p>
<p style="color:#4A6478; font-size:13px;">Linket udløber om 7 dage. Har du spørgsmål? Skriv til os på kontakt@systemklar.dk</p>',
  ARRAY['contactName', 'orgName', 'inviteButton']
),
(
  'welcome',
  'Velkomst-email',
  'Velkommen til systemklar, {{name}}',
  '<h2 style="margin-top:0;">Velkommen til systemklar</h2>
<p>Hej {{name}},</p>
<p>Din profil for <strong>{{orgName}}</strong> er nu klar. Du kan logge ind og komme i gang med det samme.</p>
<p>{{portalButton}}</p>
<p style="color:#4A6478; font-size:13px;">Har du spørgsmål? Skriv til os på kontakt@systemklar.dk</p>',
  ARRAY['name', 'orgName', 'portalButton']
),
(
  'ticket_reply',
  'Svar på supportssag',
  'Nyt svar på din sag: {{ticketTitle}}',
  '<h2 style="margin-top:0;">Du har fået et svar</h2>
<p>Hej {{name}},</p>
<p>Vi har svaret på din sag <strong>{{ticketTitle}}</strong>:</p>
<div style="background:#EAF1F7; border-left:3px solid #4A7FA5; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#4A6478; font-size:14px;">{{messagePreview}}</div>
<p>{{ticketButton}}</p>',
  ARRAY['name', 'ticketTitle', 'messagePreview', 'ticketButton']
),
(
  'ticket_closed',
  'Sag lukket',
  'Sag løst: {{ticketTitle}}',
  '<h2 style="margin-top:0;">Din sag er løst</h2>
<p>Hej {{name}},</p>
<p>Vi har markeret sagen <strong>{{ticketTitle}}</strong> som løst.</p>
<p>Har du stadig problemer? Svar på denne email eller opret en ny sag i portalen.</p>
<p>{{ticketButton}}</p>',
  ARRAY['name', 'ticketTitle', 'ticketButton']
),
(
  'monthly_report',
  'Månedlig IT-rapport',
  'Din IT-rapport for {{month}} er klar',
  '<h2 style="margin-top:0;">IT-rapport klar</h2>
<p>Hej {{name}},</p>
<p>Din månedlige IT-rapport for <strong>{{orgName}}</strong> for {{month}} er nu klar.</p>
<p>Rapporten giver dig et overblik over drift, hændelser og anbefalinger for måneden.</p>
<p>{{reportButton}}</p>',
  ARRAY['name', 'orgName', 'month', 'reportButton']
),
(
  'new_ticket_admin',
  'Ny supportssag (intern)',
  'Ny sag fra {{orgName}}: {{ticketTitle}}',
  '<h2 style="margin-top:0;">Ny supportssag</h2>
<p><strong>Virksomhed:</strong> {{orgName}}</p>
<p><strong>Oprettet af:</strong> {{createdBy}}</p>
<p><strong>Emne:</strong> {{ticketTitle}}</p>
<p>{{adminButton}}</p>',
  ARRAY['orgName', 'createdBy', 'ticketTitle', 'adminButton']
),
(
  'contact',
  'Kontaktformular',
  'Ny henvendelse fra {{name}} – {{company}}',
  '<h2 style="margin-top:0;">Ny kontakthenvendelse</h2>
<p><strong>Navn:</strong> {{name}}</p>
<p><strong>Virksomhed:</strong> {{company}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Telefon:</strong> {{phone}}</p>
<p><strong>Besked:</strong></p>
<div style="background:#EAF1F7; border-left:3px solid #4A7FA5; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#4A6478; font-size:14px;">{{message}}</div>
<p>{{replyButton}}</p>',
  ARRAY['name', 'company', 'email', 'phone', 'message', 'replyButton']
),
(
  'book_demo',
  'Demo-forespørgsel',
  'Demo-forespørgsel fra {{name}} – {{company}}',
  '<h2 style="margin-top:0;">Ny demo-forespørgsel</h2>
<p><strong>Navn:</strong> {{name}}</p>
<p><strong>Virksomhed:</strong> {{company}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Besked:</strong></p>
<div style="background:#EAF1F7; border-left:3px solid #4A7FA5; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; color:#4A6478; font-size:14px;">{{message}}</div>
<p>{{replyButton}}</p>',
  ARRAY['name', 'company', 'email', 'message', 'replyButton']
)
on conflict (id) do nothing;
