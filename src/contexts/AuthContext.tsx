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
  userBrain: UserBrain | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>
  saveUserBrain: (payload: Partial<UserBrain>) => Promise<{ error?: string }>
  fetchUserBrain: (userId: string) => Promise<void>
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
  const [userBrain, setUserBrain] = useState<UserBrain | null>(null)
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

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🪝 onAuthStateChange', { event, hasSession: Boolean(session), userId: session?.user?.id })
      if (!isMounted) return
      setUser(session?.user || null)
      if (session?.user) {
        console.log('🔄 onAuthStateChange poziva fetchProfile...')
        await fetchProfile(session.user.id)
        console.log('✅ onAuthStateChange fetchProfile završen')
      } else {
        setProfile(null)
        setUserBrain(null)
      }
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
    console.log('🔗 Supabase client:', !!supabase)
    
    try {
      console.log('📡 Pozivam supabase.from("profiles")...')
      
      // Dodaj timeout za Supabase poziv
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 5000)
      )
      
      const supabasePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const result = await Promise.race([supabasePromise, timeoutPromise]) as any
      const { data, error } = result

      console.log('📋 fetchProfile rezultat:', { data, error })

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Greška pri učitavanju profila:', error)
        return
      }

    // Ako profil ne postoji (PGRST116) ili je data prazno, kreiraj ga odmah da se app ne zaglavi
    if ((error && error.code === 'PGRST116') || !data) {
      console.warn('ℹ️ Profil ne postoji – kreiram inicijalni profil...')
      const { data: userInfo } = await supabase.auth.getUser()
      const email = userInfo.user?.email || ''
      const insertObj = {
        id: userId,
        email,
        full_name: userInfo.user?.user_metadata?.full_name || null,
        onboarding_completed: false,
        is_admin: false,
      } as any
      const { error: insertError } = await supabase.from('profiles').insert(insertObj)
      if (insertError) {
        console.error('❌ Greška pri kreiranju inicijalnog profila:', insertError)
      }
      // Postavi minimalni profil u state čak i ako insert nije odmah vidljiv
      const minimalProfile: Profile = {
        id: userId,
        email,
        full_name: insertObj.full_name || undefined,
        company_name: undefined,
        industry: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_completed: false,
        is_admin: false,
      }
      setProfile(minimalProfile)
      console.log('✅ Kreiran i postavljen inicijalni profil')
    } else {
      console.log('📥 Profile podaci iz baze:', data)
      console.log('🎯 onboarding_completed:', data?.onboarding_completed)
      setProfile(data)
      console.log('✅ Profile state ažuriran')
    }

      // Učitaj i user_brain podatke u pozadini da ne blokira auth loading/navigaciju
      fetchUserBrain(userId).catch(err => {
        console.warn('fetchUserBrain background error:', err)
      })
      
      console.log('🏁 fetchProfile završen uspešno')
    } catch (fetchError) {
      console.error('❌ fetchProfile catch error:', fetchError)
      
      // Ako je timeout ili druga greška, kreiraj fallback profil
      if ((fetchError as any)?.message === 'Supabase timeout' || fetchError) {
        console.warn('⚠️ Kreiranje fallback profila zbog greške...')
        const fallbackProfile: Profile = {
          id: userId,
          email: '',
          full_name: 'Korisnik',
          company_name: undefined,
          industry: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          onboarding_completed: true, // Postaviti na true da chat radi
          is_admin: false,
        }
        setProfile(fallbackProfile)
        console.log('✅ Fallback profil postavljen')
      }
    }
  }

  const fetchUserBrain = async (userId: string) => {
    console.log('🧠 fetchUserBrain pozvan za user ID:', userId)
    
    const { data, error } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Greška pri učitavanju user_brain:', error)
      return
    }

    if (error && error.code === 'PGRST116') {
      console.warn('ℹ️ user_brain ne postoji – kreiram inicijalni red...')
      const { error: insertBrainError } = await supabase
        .from('user_brain')
        .insert({ user_id: userId })
      if (insertBrainError) {
        console.error('❌ Greška pri kreiranju user_brain:', insertBrainError)
      }
      setUserBrain({ user_id: userId })
      console.log('✅ Kreiran i postavljen inicijalni user_brain')
    } else {
      console.log('🧠 UserBrain podaci iz baze:', data)
      setUserBrain(data)
      console.log('✅ UserBrain state ažuriran')
    }
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
      console.log('🔐 signIn start', { email })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('🔐 signIn response', { data, error })
      if (error) return { error: error.message }
      // Ako ima session, odmah povuci profil (ne čekamo onAuthStateChange)
      if (data?.user?.id) {
        await fetchProfile(data.user.id)
      }
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

  const value: AuthContextType = { user, profile, userBrain, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile, saveUserBrain, fetchUserBrain }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}