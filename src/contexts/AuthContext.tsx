// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Tip za profil
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

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth mora biti korišćen unutar AuthProvider')
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Učitaj session na startu
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    }
    initSession()

    // Slušaj promene
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user || null)
      if (session?.user) await fetchProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Greška pri učitavanju profila:', error)
      return
    }
    setProfile(data)
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🚀 Počinjem signup proces...', { email, fullName })
      
      // Prvo kreiraj korisnika
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      console.log('📊 Supabase auth response:', { data, error })

      if (error) {
        console.error('❌ Greška pri signup:', error)
        return { error: error.message }
      }

      if (data.user) {
        console.log('✅ Korisnik kreiran:', data.user.id)
        
        // Kreiraj profil ručno - bez trigger funkcije
        try {
          console.log('🔧 Kreiram profil ručno...')
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              onboarding_completed: false,
              is_admin: false
            })
          
          if (profileError) {
            console.error('❌ Greška pri kreiranju profila:', profileError)
            // Ne vraćaj grešku - možda profil već postoji
            console.log('⚠️ Profil možda već postoji ili je kreiran automatski')
          } else {
            console.log('✅ Profil kreiran uspešno')
          }
        } catch (profileErr) {
          console.error('❌ Exception pri kreiranju profila:', profileErr)
          // Ne vraćaj grešku - možda profil već postoji
          console.log('⚠️ Profil možda već postoji')
        }
      }

      // Ako je email konfirmacija potrebna, vrati poruku
      if (data.user && !data.session) {
        console.log('📧 Email konfirmacija potrebna')
        return { error: 'Molimo vas da proverite vaš email i kliknite na link za potvrdu naloga.' }
      }

      console.log('🎉 Signup uspešan!')
      return {}
    } catch (err: any) {
      console.error('❌ Exception u signUp:', err)
      return { error: err.message }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/onboarding` }
      })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Nema prijavljenog korisnika' }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) return { error: error.message }
    await fetchProfile(user.id)
    return {}
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}