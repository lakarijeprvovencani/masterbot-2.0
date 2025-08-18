
-- Prvo kreiram funkciju za proveru admin statusa
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Obrišem postojeće RLS politike za feedbacks koje su ograničavajuće
DROP POLICY IF EXISTS "Users can update their own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can delete their own feedbacks" ON public.feedbacks;

-- Kreiram nove RLS politike koje dozvoljavaju admin funkcionalnost
CREATE POLICY "Users can update own feedbacks or admins can update all" 
  ON public.feedbacks 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_user_admin());

CREATE POLICY "Users can delete own feedbacks or admins can delete all" 
  ON public.feedbacks 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_user_admin());

-- Takođe ažuriram votes politike da admini mogu da brišu sve glasove
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

CREATE POLICY "Users can delete own votes or admins can delete all" 
  ON public.votes 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR public.is_user_admin());
