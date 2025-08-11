import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY
const openaiApiKey = process.env.VITE_OPENAI_API_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Nedostaju Supabase environment varijable')
  process.exit(1)
}

if (!perplexityApiKey || !openaiApiKey) {
  console.error('❌ Nedostaju API ključevi za Perplexity i OpenAI')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test email - promeni ako treba
const testEmail = `test-${Date.now()}@example.com`
const testPassword = 'test123456'

async function testFullFlow() {
  console.log('🚀 Počinjem test celog flow-a...')
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
    
    // 2. KREIRAJ PROFIL I USER_BRAIN
    console.log('\n2️⃣ Kreiram profil i user_brain...')
    
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
    
    const { error: brainError } = await supabase
      .from('user_brain')
      .insert({
        user_id: signupData.user.id,
        company_name: 'Test Company',
        industry: 'Technology',
        goals: ['Increase sales', 'Improve marketing'],
        website: 'https://example.com',
        data: {
          team_size: '5-10',
          monthly_revenue: '10k-50k',
          heard_from: 'Google'
        }
      })
    
    if (brainError) {
      console.error('❌ Greška pri kreiranju user_brain:', brainError)
    } else {
      console.log('✅ User brain kreiran')
    }
    
    // 3. TESTIRAJ PERPLEXITY API
    console.log('\n3️⃣ Testiram Perplexity API...')
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'user',
          content: 'Visit https://example.com and give me a brief summary of what you see.'
        }]
      })
    })
    
    if (!perplexityResponse.ok) {
      console.error('❌ Perplexity API greška:', perplexityResponse.statusText)
    } else {
      const perplexityData = await perplexityResponse.json()
      console.log('✅ Perplexity API radi:', perplexityData.choices[0].message.content.substring(0, 100) + '...')
    }
    
    // 4. TESTIRAJ OPENAI API
    console.log('\n4️⃣ Testiram OpenAI API...')
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: 'Generate a brief business analysis for a technology company.'
        }]
      })
    })
    
    if (!openaiResponse.ok) {
      console.error('❌ OpenAI API greška:', openaiResponse.statusText)
    } else {
      const openaiData = await openaiResponse.json()
      console.log('✅ OpenAI API radi:', openaiData.choices[0].message.content.substring(0, 100) + '...')
    }
    
    // 5. PROVERI PODATKE U BAZI
    console.log('\n5️⃣ Proveravam podatke u bazi...')
    
    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single()
    
    if (profileFetchError) {
      console.error('❌ Greška pri učitavanju profila:', profileFetchError)
    } else {
      console.log('✅ Profil u bazi:', profileData)
    }
    
    const { data: brainData, error: brainFetchError } = await supabase
      .from('user_brain')
      .select('*')
      .eq('user_id', signupData.user.id)
      .single()
    
    if (brainFetchError) {
      console.error('❌ Greška pri učitavanju user_brain:', brainFetchError)
    } else {
      console.log('✅ User brain u bazi:', brainData)
    }
    
    // 6. SIMULIRAJ AI ANALIZU
    console.log('\n6️⃣ Simuliram AI analizu...')
    
    const { error: analysisUpdateError } = await supabase
      .from('user_brain')
      .update({
        analysis: 'Ovo je test AI analiza generisana tokom testiranja. Kompanija Test Company je tehnološka firma sa 5-10 zaposlenih i mesečnim prihodima od 10k-50k. Ciljevi su povećanje prodaje i poboljšanje marketinga.'
      })
      .eq('user_id', signupData.user.id)
    
    if (analysisUpdateError) {
      console.error('❌ Greška pri ažuriranju analize:', analysisUpdateError)
    } else {
      console.log('✅ AI analiza sačuvana u bazi')
    }
    
    // 7. FINALNA PROVERA
    console.log('\n7️⃣ Finalna provera...')
    
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
        heard_from: finalBrainData.data?.heard_from,
        analysis: finalBrainData.analysis ? 'Postoji' : 'Nema'
      })
    }
    
    console.log('\n🎉 Test završen!')
    console.log(`📧 Test korisnik: ${testEmail}`)
    console.log(`🔑 ID: ${signupData.user.id}`)
    
  } catch (error) {
    console.error('❌ Greška tokom testa:', error)
  }
}

testFullFlow()
