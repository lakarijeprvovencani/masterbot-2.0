import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Profile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  industry?: string
  created_at: string
  updated_at: string
  onboarding_completed: boolean
  is_admin?: boolean
}