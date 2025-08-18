
-- Prvo proverim postojeće politike
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'votes';

-- Kreiram ili zamenim politike za votes tabelu
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- Omogući RLS na votes tabeli
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Politika za čitanje glasova
CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politika za kreiranje glasova
CREATE POLICY "Users can create their own votes" ON votes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politika za brisanje glasova - OVO JE KLJUČNO
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Takođe dodaj politiku za ažuriranje ako bude potrebno
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
