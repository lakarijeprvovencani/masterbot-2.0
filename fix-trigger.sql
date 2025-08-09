-- Obriši postojeću trigger funkciju ako postoji
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Kreiraj novu trigger funkciju sa boljim error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Proveri da li profil već postoji
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Loguj grešku ali ne prekidaj proces registracije
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obriši postojeće triggere ako postoje
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Kreiraj novi trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
