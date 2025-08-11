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

// Test email
const testEmail = `step-test-${Date.now()}@example.com`
const testPassword = 'test123456'

async function testStepByStep() {
  console.log('🚀 Testiram korak po korak čuvanje podataka...')
  console.log(`📧 Test email: ${testEmail}`)
  
  try {
    // 1. SIGNUP
    console.log('\n1️⃣ Testiram signup...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signupError) {
      console.error('❌ Signup greška:', signupError)
      return
    }
    
    console.log('✅ Signup uspešan:', signupData.user.id)
    
    // 2. KREIRAJ PROFIL
    console.log('\n2️⃣ Kreiram profil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signupData.user.id,
        email: testEmail,
        onboarding_completed: false
      })
    
    if (profileError) {
      console.error('❌ Greška pri kreiranju profila:', profileError)
    } else {
      console.log('✅ Profil kreiran')
    }
    
    // 3. SIMULIRAJ STEP 1 - Company name i industry
    console.log('\n3️⃣ Simuliram Step 1 - Company name i industry...')
    const { error: step1Error } = await supabase
      .from('user_brain')
      .insert({
        user_id: signupData.user.id,
        company_name: 'Test Company Step 1',
        industry: 'Technology'
      })
    
    if (step1Error) {
      console.error('❌ Greška pri Step 1:', step1Error)
    } else {
      console.log('✅ Step 1 uspešno sačuvan')
    }
    
    // 4. SIMULIRAJ STEP 2 - Goals
    console.log('\n4️⃣ Simuliram Step 2 - Goals...')
    const { error: step2Error } = await supabase
      .from('user_brain')
      .update({
        goals: ['Increase sales', 'Improve marketing']
      })
      .eq('user_id', signupData.user.id)
    
    if (step2Error) {
      console.error('❌ Greška pri Step 2:', step2Error)
    } else {
      console.log('✅ Step 2 uspešno sačuvan')
    }
    
    // 5. SIMULIRAJ STEP 3 - Website
    console.log('\n5️⃣ Simuliram Step 3 - Website...')
    const { error: step3Error } = await supabase
      .from('user_brain')
      .update({
        website: 'https://test-company.com'
      })
      .eq('user_id', signupData.user.id)
    
    if (step3Error) {
      console.error('❌ Greška pri Step 3:', step3Error)
    } else {
      console.log('✅ Step 3 uspešno sačuvan')
    }
    
    // 6. SIMULIRAJ STEP 4 - Demografija
    console.log('\n6️⃣ Simuliram Step 4 - Demografija...')
    const { error: step4Error } = await supabase
      .from('user_brain')
      .update({
        data: {
          team_size: '5-10',
          monthly_revenue: '10k-50k',
          heard_from: 'Google'
        }
      })
      .eq('user_id', signupData.user.id)
    
    if (step4Error) {
      console.error('❌ Greška pri Step 4:', step4Error)
    } else {
      console.log('✅ Step 4 uspešno sačuvan')
    }
    
    // 7. FINALNA PROVERA
    console.log('\n7️⃣ Finalna provera svih koraka...')
    const { data: finalBrainData, error: finalBrainError } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', signupData.user.id)
      .single()
    
    if (finalBrainError) {
      console.error('❌ Greška pri finalnoj proveri:', finalBrainError)
    } else {
      console.log('✅ Finalni user brain podaci:', {
        company_name: finalBrainData.company_name,
        industry: finalBrainData.industry,
        goals: finalBrainData.goals,
        website: finalBrainData.website,
        team_size: finalBrainData.data?.team_size,
        monthly_revenue: finalBrainData.data?.monthly_revenue,
        heard_from: finalBrainData.data?.heard_from
      })
    }
    
    console.log('\n🎉 Test korak po korak završen!')
    console.log(`📧 Test korisnik: ${testEmail}`)
    console.log(`🔑 ID: ${signupData.user.id}`)
    
  } catch (error) {
    console.error('❌ Greška tokom testa:', error)
  }
}

testStepByStep()
