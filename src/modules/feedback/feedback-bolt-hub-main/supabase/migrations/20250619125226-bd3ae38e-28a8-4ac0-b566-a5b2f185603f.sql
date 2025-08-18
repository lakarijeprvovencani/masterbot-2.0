
-- Dodeli admin privilegije korisniku nocodebalkan@gmail.com
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'nocodebalkan@gmail.com'
);
