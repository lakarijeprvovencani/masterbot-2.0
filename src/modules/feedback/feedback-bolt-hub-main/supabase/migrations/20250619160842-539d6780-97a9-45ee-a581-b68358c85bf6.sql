
-- Proverim da li postoje svi korisnici u profiles tabeli
SELECT 
  au.id as user_id,
  au.email,
  au.raw_user_meta_data->>'name' as auth_name,
  p.name as profile_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- Dodaj nedostajuće profile za korisnike koji ih nemaju
INSERT INTO public.profiles (id, name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Proverim da li postoji trigger za automatsko kreiranje profila
-- Ako ne postoji, kreiraj ga
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

-- Kreiraj trigger ako ne postoji
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
