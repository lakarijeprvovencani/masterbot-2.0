// Test skripta za kompletan flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://maanxkfwijxeivbutgno.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYW54a2Z3aWp4ZWl2YnV0Z25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzA1NTgsImV4cCI6MjA3MDI0NjU1OH0.LX8Avntmj3ueWNnX0PM9SArqHLypc-GpGsUvVWq6Y3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteFlow() {
  console.log('🚀 Počinjem test kompletnog flow-a...')
  
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  const testFullName = 'Test Korisnik'
  
  try {
    // 1. Test signup (kao u React aplikaciji)
    console.log('\n📝 1. Testiram signup...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: testFullName }
      }
    })
    
    if (signupError) {
      console.error('❌ Signup greška:', signupError)
      return
    }
    
    console.log('✅ Signup uspešan:', signupData.user?.id)
    
    // 2. Simuliraj kreiranje profila (kao u React aplikaciji)
    console.log('\n👤 2. Simuliram kreiranje profila...')
    if (signupData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user.id,
          email: signupData.user.email || '',
          full_name: testFullName,
          onboarding_completed: false,
          is_admin: false
        })
      
      if (profileError) {
        console.error('❌ Greška pri kreiranju profila:', profileError)
      } else {
        console.log('✅ Profil kreiran')
      }
      
      // 3. Simuliraj kreiranje user_brain (kao u React aplikaciji)
      console.log('\n🧠 3. Simuliram kreiranje user_brain...')
      const { error: brainError } = await supabase
        .from('user_brain')
        .upsert({ user_id: signupData.user.id }, { onConflict: 'user_id' })
      
      if (brainError) {
        console.error('❌ Greška pri kreiranju user_brain:', brainError)
      } else {
        console.log('✅ User brain kreiran')
      }
    }
    
    // 4. Proveri da li su kreirani
    console.log('\n🔍 4. Proveravam da li su kreirani...')
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id)
      .single()
    
    if (profileCheckError) {
      console.error('❌ Greška pri proveri profila:', profileCheckError)
    } else {
      console.log('✅ Profil proveren:', profile)
    }
    
    const { data: brain, error: brainCheckError } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', signupData.user?.id)
      .single()
    
    if (brainCheckError) {
      console.error('❌ Greška pri proveri user_brain:', brainCheckError)
    } else {
      console.log('✅ User brain proveren:', brain)
    }
    
    // 5. Test čuvanja podataka u user_brain (Step 1)
    console.log('\n💾 5. Testiram čuvanje podataka (Step 1)...')
    const step1Data = {
      company_name: 'Test Company',
      industry: 'SaaS/Tehnologija'
    }
    
    const { error: step1Error } = await supabase
      .from('user_brain')
      .update(step1Data)
      .eq('user_id', signupData.user?.id)
    
    if (step1Error) {
      console.error('❌ Greška pri čuvanju Step 1:', step1Error)
    } else {
      console.log('✅ Step 1 podaci sačuvani:', step1Data)
    }
    
    // 6. Test čuvanja podataka (Step 2)
    console.log('\n💾 6. Testiram čuvanje podataka (Step 2)...')
    const step2Data = {
      goals: ['Povećanje prodaje', 'Više lead-ova']
    }
    
    const { error: step2Error } = await supabase
      .from('user_brain')
      .update(step2Data)
      .eq('user_id', signupData.user?.id)
    
    if (step2Error) {
      console.error('❌ Greška pri čuvanju Step 2:', step2Error)
    } else {
      console.log('✅ Step 2 podaci sačuvani:', step2Data)
    }
    
    // 7. Test čuvanja podataka (Step 3)
    console.log('\n💾 7. Testiram čuvanje podataka (Step 3)...')
    const step3Data = {
      website: 'https://testcompany.com'
    }
    
    const { error: step3Error } = await supabase
      .from('user_brain')
      .update(step3Data)
      .eq('user_id', signupData.user?.id)
    
    if (step3Error) {
      console.error('❌ Greška pri čuvanju Step 3:', step3Error)
    } else {
      console.log('✅ Step 3 podaci sačuvani:', step3Data)
    }
    
    // 8. Test čuvanja podataka (Step 4)
    console.log('\n💾 8. Testiram čuvanje podataka (Step 4)...')
    const step4Data = {
      data: {
        team_size: '2-5',
        monthly_revenue: '1.000 - 5.000 €',
        heard_from: 'Google'
      }
    }
    
    const { error: step4Error } = await supabase
      .from('user_brain')
      .update(step4Data)
      .eq('user_id', signupData.user?.id)
    
    if (step4Error) {
      console.error('❌ Greška pri čuvanju Step 4:', step4Error)
    } else {
      console.log('✅ Step 4 podaci sačuvani:', step4Data)
    }
    
    // 9. Proveri finalno stanje
    console.log('\n🔍 9. Proveravam finalno stanje...')
    const { data: finalBrain, error: finalError } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', signupData.user?.id)
      .single()
    
    if (finalError) {
      console.error('❌ Greška pri proveri finalnog stanja:', finalError)
    } else {
      console.log('✅ Finalno stanje user_brain:', finalBrain)
    }
    
    // 10. Test ažuriranja profila
    console.log('\n👤 10. Testiram ažuriranje profila...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        company_name: 'Test Company',
        industry: 'SaaS/Tehnologija'
      })
      .eq('id', signupData.user?.id)
    
    if (updateError) {
      console.error('❌ Greška pri ažuriranju profila:', updateError)
    } else {
      console.log('✅ Profil ažuriran')
    }
    
    console.log('\n🎉 Test kompletnog flow-a završen!')
    console.log('📧 Test email:', testEmail)
    console.log('🔑 Test password:', testPassword)
    console.log('🆔 User ID:', signupData.user?.id)
    
  } catch (error) {
    console.error('❌ Greška u testu:', error)
  }
}

testCompleteFlow()
