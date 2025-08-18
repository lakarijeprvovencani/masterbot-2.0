
-- Add RLS policy to allow all authenticated users to read all profile names
CREATE POLICY "All authenticated users can view profile names" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);
