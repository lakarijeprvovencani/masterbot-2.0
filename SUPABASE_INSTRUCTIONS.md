# 🔧 INSTRUKCIJE ZA KREIRANJE TABELE U SUPABASE

## Problem
Tabela `profiles` nije kreirana u Supabase, što uzrokuje grešku "Database error saving new user".

## Rešenje

### Korak 1: Idí na Supabase Dashboard
1. Otvori https://supabase.com/dashboard
2. Prijavi se na svoj nalog
3. Idí na projekat "Masterbot 2.0"

### Korak 2: Idí na SQL Editor
1. U levom meniju klikni na ikonu "SQL Editor" (ikonica sa `</>`)
2. Klikni na "New query"

### Korak 3: Kopiraj i pokreni SQL kod za ponovno kreiranje tabele
Kopiraj sledeći kod u SQL Editor:

```sql
-- Obriši postojeću tabelu ako postoji
DROP TABLE IF EXISTS profiles CASCADE;

-- Kreiraj novu profiles tabelu
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  industry text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  onboarding_completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies za authenticated korisnike
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy za service role
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### Korak 4: Pokreni kod za ponovno kreiranje tabele
1. Klikni na dugme "Run" (ili pritisni Ctrl+Enter)
2. Sačekaj da se kod izvrši

### Korak 5: Proveri da li je tabela kreirana
1. Idí na "Table Editor" u levom meniju
2. Trebalo bi da vidiš tabelu `profiles` u listi

### Korak 6: Testiraj signup
Nakon što ponovno kreiraš tabelu, testiraj signup ponovo.
