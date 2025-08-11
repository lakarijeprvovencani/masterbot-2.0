-- Tabela koja služi kao "brain" za korisnika
CREATE TABLE IF NOT EXISTS public.user_brain (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  industry text,
  goals text[] DEFAULT '{}',
  website text,
  analysis text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.user_brain ENABLE ROW LEVEL SECURITY;

-- Policies: korisnik vidi/menja svoje
CREATE POLICY "Users can view own brain"
  ON public.user_brain FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brain"
  ON public.user_brain FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brain"
  ON public.user_brain FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role može da insertuje (npr. server-side)
CREATE POLICY "Service role can insert brain"
  ON public.user_brain FOR INSERT
  TO service_role
  WITH CHECK (true);
