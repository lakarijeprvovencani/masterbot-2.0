import { createClient } from '@supabase/supabase-js'

// Supabase konfiguracija
const supabaseUrl = 'https://maanxkfwijxeivbutgno.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYW54a2Z3aWp4ZWl2YnV0Z25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzA1NTgsImV4cCI6MjA3MDI0NjU1OH0.LX8Avntmj3ueWNnX0PM9SArqHLypc-GpGsUvVWq6Y3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCleanSignup() {
  console.log('🚀 Počinjem test čiste signup implementacije...')
  
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  const testFullName = 'Test User'
  
  try {
    console.log('📧 Test email:', testEmail)
    
    // Test signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    })
    
    console.log('📊 Supabase auth response:', { data, error })
    
    if (error) {
      console.error('❌ Greška pri signup:', error)
      return
    }
    
    if (data.user) {
      console.log('✅ Korisnik kreiran:', data.user.id)
      
      // Test kreiranje profila
      try {
        console.log('🔧 Kreiram profil...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: testFullName,
            onboarding_completed: false
          })
        
        if (profileError) {
          console.error('❌ Greška pri kreiranju profila:', profileError)
        } else {
          console.log('✅ Profil kreiran uspešno')
        }
      } catch (profileErr) {
        console.error('❌ Exception pri kreiranju profila:', profileErr)
      }
    }
    
    if (data.user && !data.session) {
      console.log('📧 Email konfirmacija potrebna')
    } else {
      console.log('🎉 Signup uspešan!')
    }
    
  } catch (err) {
    console.error('❌ Exception u testCleanSignup:', err)
  }
}

testCleanSignup()
