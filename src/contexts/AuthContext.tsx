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

export interface UserBrain {
  user_id: string
  company_name?: string
  industry?: string
  goals?: string[]
  website?: string
  data?: Record<string, unknown>
  analysis?: string
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
  saveUserBrain: (payload: Partial<UserBrain>) => Promise<{ error?: string }>
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
    let isMounted = true

    // Fail-safe: ako se nešto zaglavi, ugasi loading posle 3s
    const failSafe = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 3000)

    const hasEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

    const initSession = async () => {
      try {
        if (!hasEnv) {
          console.warn('Supabase env varijable nisu postavljene. Preskačem auth inicijalizaciju.')
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        setUser(session?.user || null)
        if (session?.user) await fetchProfile(session.user.id)
      } catch (error) {
        console.error('Greška pri inicijalnom učitavanju sesije:', error)
      } finally {
        if (isMounted) setLoading(false)
        clearTimeout(failSafe)
      }
    }

    initSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!isMounted) return
      setUser(session?.user || null)
      if (session?.user) await fetchProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      clearTimeout(failSafe)
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    console.log('🔄 fetchProfile pozvan za user ID:', userId)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Greška pri učitavanju profila:', error)
      return
    }
    
    console.log('📥 Profile podaci iz baze:', data)
    console.log('🎯 onboarding_completed:', data?.onboarding_completed)
    
    setProfile(data)
    console.log('✅ Profile state ažuriran')
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🚀 Počinjem signup proces...', { email, fullName })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      console.log('📊 Supabase auth response:', { data, error })

      if (error) return { error: error.message }

      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              onboarding_completed: false,
              is_admin: false
            })
          if (profileError) console.error('Greška pri kreiranju profila:', profileError)

          // Inicijalni red u user_brain (ako ne postoji)
          const { error: brainError } = await supabase
            .from('user_brain')
            .upsert({ user_id: data.user.id }, { onConflict: 'user_id' })
          if (brainError) console.error('Greška pri kreiranju user_brain:', brainError)
        } catch (profileErr) {
          console.error('Exception pri kreiranju profila/brain:', profileErr)
        }
      }

      if (data.user && !data.session) {
        return { error: 'Molimo vas da proverite vaš email i kliknite na link za potvrdu naloga.' }
      }

      return {}
    } catch (err: any) {
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
    try {
      // Prvo: sinhrono ukloni sve Supabase session ključeve da spreči auto-restore
      try {
        const lsKeys: string[] = []
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i)
          if (k) lsKeys.push(k)
        }
        lsKeys.filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))

        const ssKeys: string[] = []
        for (let i = 0; i < sessionStorage.length; i += 1) {
          const k = sessionStorage.key(i)
          if (k) ssKeys.push(k)
        }
        ssKeys.filter(k => k.startsWith('sb-')).forEach(k => sessionStorage.removeItem(k))
      } catch (e) {
        console.warn('Upozorenje pri čišćenju storage-a tokom odjave:', e)
      }

      // Zatim: supabase odjava
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Greška pri signOut:', e)
    } finally {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Nema prijavljenog korisnika' }
    
    console.log('🔄 updateProfile pozvan sa:', updates)
    console.log('👤 Korisnik ID:', user.id)
    
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error('❌ Greška pri updateProfile:', error)
      return { error: error.message }
    }
    
    console.log('✅ Profile uspešno ažuriran u bazi')
    console.log('🔄 Pozivam fetchProfile...')
    
    await fetchProfile(user.id)
    
    console.log('✅ fetchProfile završen')
    return {}
  }

  const saveUserBrain = async (payload: Partial<UserBrain>) => {
    if (!user) return { error: 'Nema prijavljenog korisnika' }

    console.log('🧠 saveUserBrain pozvan sa:', { user_id: user.id, payload })

    // Proveri da li red već postoji
    const { data: existing, error: selectError } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ user_brain select error:', selectError)
      return { error: selectError.message }
    }

    // Pripremi update/insert objekat samo sa definisanim poljima
    const fields: any = { updated_at: new Date().toISOString() }
    if (payload.company_name !== undefined) fields.company_name = payload.company_name
    if (payload.industry !== undefined) fields.industry = payload.industry
    if (payload.goals !== undefined) fields.goals = payload.goals
    if (payload.website !== undefined) fields.website = payload.website
    if (payload.analysis !== undefined) fields.analysis = payload.analysis
    if (payload.data !== undefined) {
      if (existing && (existing as any).data && typeof (existing as any).data === 'object') {
        fields.data = { ...(existing as any).data, ...payload.data }
      } else {
        fields.data = payload.data
      }
    }

    console.log('📝 Pripremljeni fields za user_brain:', fields)

    if (existing) {
      console.log('🔄 Ažuriram postojeći user_brain red...')
      const { error } = await supabase
        .from('user_brain')
        .update(fields)
        .eq('user_id', user.id)
      if (error) {
        console.error('❌ user_brain update error:', error)
        return { error: error.message }
      }
      console.log('✅ user_brain uspešno ažuriran')
      return {}
    } else {
      console.log('🆕 Kreiram novi user_brain red...')
      const insertObj = { user_id: user.id, ...fields }
      const { error } = await supabase
        .from('user_brain')
        .insert(insertObj)
      if (error) {
        console.error('❌ user_brain insert error:', error)
        return { error: error.message }
      }
      console.log('✅ user_brain uspešno kreiran')
      return {}
    }
  }

  const value: AuthContextType = { user, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile, saveUserBrain }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}