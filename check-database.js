import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Nedostaju Supabase environment varijable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('🔍 Proveravam bazu podataka...')
  
  try {
    // 1. Proveri da li postoji user_brain tabela
    console.log('\n1️⃣ Proveravam user_brain tabelu...')
    
    const { data: brainData, error: brainError } = await supabase
      .from('user_brain')
      .select('*')
      .limit(1)
    
    if (brainError) {
      console.error('❌ Greška pri pristupu user_brain tabeli:', brainError)
      
      // Pokušaj da vidiš šta postoji
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables')
        .catch(() => ({ data: null, error: 'RPC ne postoji' }))
      
      if (tablesError) {
        console.log('ℹ️ Pokušavam da vidim strukturu baze...')
        
        // Pokušaj sa SQL query
        const { data: sqlResult, error: sqlError } = await supabase
          .rpc('exec_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" })
          .catch(() => ({ data: null, error: 'SQL RPC ne postoji' }))
        
        if (sqlError) {
          console.log('ℹ️ Ne mogu da vidim strukturu baze direktno')
        } else {
          console.log('📋 Tabele u bazi:', sqlResult)
        }
      } else {
        console.log('📋 Tabele u bazi:', tables)
      }
      
      return
    }
    
    console.log('✅ user_brain tabela postoji!')
    console.log('📊 Prvi red:', brainData?.[0] || 'Nema podataka')
    
    // 2. Proveri strukturu tabele
    console.log('\n2️⃣ Proveravam strukturu user_brain tabele...')
    
    if (brainData && brainData.length > 0) {
      const firstRow = brainData[0]
      console.log('🏗️ Struktura tabele:')
      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key]
        const type = Array.isArray(value) ? 'array' : typeof value
        console.log(`  - ${key}: ${type} = ${JSON.stringify(value).substring(0, 100)}...`)
      })
    }
    
    // 3. Proveri profiles tabelu
    console.log('\n3️⃣ Proveravam profiles tabelu...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profileError) {
      console.error('❌ Greška pri pristupu profiles tabeli:', profileError)
    } else {
      console.log('✅ profiles tabela postoji!')
      if (profileData && profileData.length > 0) {
        console.log('📊 Prvi profil:', profileData[0])
      }
    }
    
    // 4. Pokušaj da vidiš RLS policies
    console.log('\n4️⃣ Proveravam RLS policies...')
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'user_brain' })
        .catch(() => ({ data: null, error: 'RPC ne postoji' }))
      
      if (policiesError) {
        console.log('ℹ️ Ne mogu da vidim RLS policies direktno')
      } else {
        console.log('🔒 RLS policies za user_brain:', policies)
      }
    } catch (err) {
      console.log('ℹ️ Ne mogu da proverim RLS policies')
    }
    
  } catch (error) {
    console.error('❌ Greška tokom provere baze:', error)
  }
}

checkDatabase()
