import { createClient } from '@supabase/supabase-js'

// Supabase konfiguracija
const supabaseUrl = 'https://maanxkfwijxeivbutgno.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYW54a2Z3aWp4ZWl2YnV0Z25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzA1NTgsImV4cCI6MjA3MDI0NjU1OH0.LX8Avntmj3ueWNnX0PM9SArqHLypc-GpGsUvVWq6Y3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDetailedLog() {
  console.log('🚀 Počinjem test sa detaljnim logovanjem...')
  
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  const testFullName = 'Test User'
  
  try {
    console.log('📧 Test email:', testEmail)
    console.log('🔑 Test password:', testPassword)
    console.log('👤 Test full name:', testFullName)
    
    // Test signup sa detaljnim logovanjem
    console.log('🔍 Pozivam supabase.auth.signUp...')
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    })
    
    console.log('📊 Supabase auth response:')
    console.log('  - data:', JSON.stringify(data, null, 2))
    console.log('  - error:', error ? {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : null)
    
    if (error) {
      console.error('❌ Greška pri signup:')
      console.error('  - Message:', error.message)
      console.error('  - Status:', error.status)
      console.error('  - Code:', error.code)
      console.error('  - Details:', error.details)
      console.error('  - Hint:', error.hint)
      return
    }
    
    if (data.user) {
      console.log('✅ Korisnik kreiran:', data.user.id)
      console.log('  - Email:', data.user.email)
      console.log('  - Created at:', data.user.created_at)
      console.log('  - Email confirmed:', data.user.email_confirmed_at)
      
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
          console.error('❌ Greška pri kreiranju profila:')
          console.error('  - Message:', profileError.message)
          console.error('  - Code:', profileError.code)
          console.error('  - Details:', profileError.details)
          console.error('  - Hint:', profileError.hint)
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
    console.error('❌ Exception u testDetailedLog:')
    console.error('  - Error:', err)
    console.error('  - Stack:', err.stack)
  }
}

testDetailedLog()
