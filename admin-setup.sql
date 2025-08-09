-- 1) Dodaj admin kolonu (idempotentno)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2) Obeleži admin nalog za postojeći auth korisnik
-- Napomena: korisnik sa ovim email-om mora postojati u Auth > Users
INSERT INTO public.profiles (id, email, full_name, onboarding_completed, is_admin)
SELECT u.id, u.email, COALESCE(u.raw_app_meta_data->>'full_name','Admin'), true, true
FROM auth.users u
WHERE u.email = 'nocodebalkan@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;

-- Provera
SELECT id, email, is_admin FROM public.profiles WHERE email = 'nocodebalkan@gmail.com';
