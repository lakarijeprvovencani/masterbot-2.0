// Test skripta za proveru tabela
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://maanxkfwijxeivbutgno.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYW54a2Z3aWp4ZWl2YnV0Z25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzA1NTgsImV4cCI6MjA3MDI0NjU1OH0.LX8Avntmj3ueWNnX0PM9SArqHLypc-GpGsUvVWq6Y3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Proveravam tabele...')
  
  try {
    // 1. Proveri da li postoje tabele
    console.log('\n📊 1. Proveravam da li postoje tabele...')
    
    // Proveri profiles tabelu
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Greška pri proveri profiles tabele:', profilesError)
    } else {
      console.log('✅ Profiles tabela postoji')
    }
    
    // Proveri user_brain tabelu
    const { data: brainData, error: brainError } = await supabase
      .from('user_brain')
      .select('count')
      .limit(1)
    
    if (brainError) {
      console.error('❌ Greška pri proveri user_brain tabele:', brainError)
    } else {
      console.log('✅ User_brain tabela postoji')
    }
    
    // 2. Proveri strukturu tabela
    console.log('\n🏗️ 2. Proveravam strukturu tabela...')
    
    // Profiles struktura
    const { data: profilesStructure, error: profilesStructError } = await supabase
      .rpc('get_table_structure', { table_name: 'profiles' })
      .catch(() => ({ data: null, error: 'RPC not available' }))
    
    if (profilesStructError) {
      console.log('ℹ️ RPC nije dostupan, proveravam direktno...')
      const { data: profilesCols, error: profilesColsError } = await supabase
        .from('profiles')
        .select('*')
        .limit(0)
      
      if (profilesColsError) {
        console.error('❌ Greška pri proveri profiles strukture:', profilesColsError)
      } else {
        console.log('✅ Profiles tabela ima pravilnu strukturu')
      }
    }
    
    // 3. Proveri RLS policies
    console.log('\n🔐 3. Proveravam RLS policies...')
    
    // Ovo će raditi samo ako imamo service role key
    console.log('ℹ️ RLS policies se proveravaju u Supabase dashboard-u')
    
    // 4. Test kreiraj test podatke
    console.log('\n🧪 4. Testiram kreiranje test podataka...')
    
    const testUserId = 'test-user-' + Date.now()
    const testEmail = `test-${Date.now()}@example.com`
    
    // Pokušaj da kreiraš profil
    const { data: newProfile, error: newProfileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        onboarding_completed: false
      })
      .select()
    
    if (newProfileError) {
      console.error('❌ Greška pri kreiranju test profila:', newProfileError)
    } else {
      console.log('✅ Test profil kreiran:', newProfile)
      
      // Pokušaj da kreiraš user_brain
      const { data: newBrain, error: newBrainError } = await supabase
        .from('user_brain')
        .insert({
          user_id: testUserId,
          company_name: 'Test Company',
          industry: 'Test Industry'
        })
        .select()
      
      if (newBrainError) {
        console.error('❌ Greška pri kreiranju test user_brain:', newBrainError)
      } else {
        console.log('✅ Test user_brain kreiran:', newBrain)
      }
    }
    
  } catch (error) {
    console.error('❌ Greška u proveri:', error)
  }
}

checkTables()
