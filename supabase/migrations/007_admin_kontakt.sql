-- Kør i Supabase SQL Editor efter at brugeren findes i auth.users (f.eks. efter oprettet konto / første login).
-- Giver admin-adgang til kontakt@systemklar.dk via public.admins.

INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = lower('kontakt@systemklar.dk')
ON CONFLICT (user_id) DO NOTHING;
