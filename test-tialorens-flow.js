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

// Test email
const testEmail = `tialorens-${Date.now()}@example.com`
const testPassword = 'test123456'

async function testTialorensFlow() {
  console.log('🚀 Počinjem test celog flow-a sa tialorens.rs...')
  console.log(`📧 Test email: ${testEmail}`)
  console.log(`🌐 Test website: https://tialorens.rs/`)
  
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
        company_name: 'Tia Lorens',
        industry: 'Fashion/Moda',
        goals: ['Increase brand awareness', 'Grow online sales'],
        website: 'https://tialorens.rs/',
        data: {
          team_size: '5-10',
          monthly_revenue: '10k-50k',
          heard_from: 'Social Media'
        }
      })
    
    if (brainError) {
      console.error('❌ Greška pri kreiranju user_brain:', brainError)
    } else {
      console.log('✅ User brain kreiran')
    }
    
    // 3. TESTIRAJ PERPLEXITY API SA TIALORENS.RS
    console.log('\n3️⃣ Testiram Perplexity API sa tialorens.rs...')
    try {
      const perplexityPrompt = `You are a research assistant tasked with extracting all relevant business information from a given website. Visit and explore the following website: https://tialorens.rs/. Your goal is to produce a comprehensive, structured summary with as much detail as possible. Include the following sections: 1. **Business Overview** – Brief history, mission, and values. 2. **Products / Services** – List all products or services with descriptions, features, benefits, and pricing (if available). 3. **Target Audience** – Who they serve (demographics, industries, niches). 4. **Unique Selling Proposition (USP)** – What makes them stand out from competitors. 5. **Brand Style & Tone** – How they communicate (formal, casual, technical, emotional, luxury, etc.). 6. **Visual Identity** – Colors, logo style, fonts, and general website aesthetics. 7. **Key Team Members** – Names, roles, and bios (if available). 8. **Customer Testimonials / Reviews** – Any quotes, ratings, or case studies. 9. **Marketing Channels** – Social media presence, email newsletters, advertising approaches. 10. **Notable Clients or Partners** – Mention if listed. 11. **Additional Observations** – Anything else relevant to understanding their business. Return all findings in a **clear, well-structured markdown format** so they can be easily parsed and reused for marketing purposes.`

      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: perplexityPrompt }]
        })
      })

      if (perplexityResponse.ok) {
        const data = await perplexityResponse.json()
        const websiteSummary = data.choices[0].message.content
        console.log('✅ Perplexity Summary dobijen!')
        console.log('📝 Prvih 300 karaktera:', websiteSummary.substring(0, 300) + '...')
        
        // 4. TESTIRAJ OPENAI API SA PERPLEXITY PODACIMA
        console.log('\n4️⃣ Testiram OpenAI API sa Perplexity podacima...')
        
        const onboardingData = `
          Naziv kompanije: Tia Lorens
          Industrija: Fashion/Moda
          Ciljevi: Increase brand awareness, Grow online sales
          Veličina tima: 5-10
          Mesečni prihodi: 10k-50k
          Kako su čuli za Masterbot: Social Media
        `

        const openAIPrompt = `You are an assistant that combines two sets of data:
          1. Information gathered from the client's website research (see: \n\`\`\`\n${websiteSummary}\n\`\`\`)
          2. Information provided during onboarding (see: \n\`\`\`\n${onboardingData}\n\`\`\`)

          Your task:
          - Merge both data sources into a single, clear, and user-friendly business profile.
          - Avoid repeating identical info — consolidate where possible.
          - Keep factual accuracy from the original sources.
          - Organize output into the following sections:

          1. **Kratak opis kompanije** – Sažet, ali sadržajan pregled poslovanja.
          2. **Glavni proizvodi/usluge** – Osnovna ponuda, pojednostavljena radi lakšeg razumevanja.
          3. **Ciljna publika i pozicija na tržištu** – Ko su kupci i gde se brend pozicionira.
          4. **Ličnost i ton brenda** – Način na koji brend komunicira sa publikom.
          5. **Prednosti i jedinstvene karakteristike** – Šta ih izdvaja od konkurencije.
          6. **Marketinške prilike** – Kratki predlozi na osnovu prikupljenih podataka.
          7. **Prikupljeni resursi** – Linkovi, ključni vizuali ili drugi materijali.

          ⚠️ **Važno:** Finalni tekst prikaži u potpunosti na srpskom jeziku, u profesionalnom i jasnom tonu.

          Na kraju dodaj poruku:
          > "Ovo su informacije koje smo do sada prikupili o vašem biznisu. One će biti korišćene za kreiranje prilagođenih marketinških strategija."
        `

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: openAIPrompt }]
          })
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          const analysis = openaiData.choices[0].message.content
          console.log('✅ OpenAI analiza generisana!')
          console.log('📝 Prvih 300 karaktera:', analysis.substring(0, 300) + '...')
          
          // 5. SAČUVAJ AI ANALIZU U BAZU
          console.log('\n5️⃣ Čuvam AI analizu u bazu...')
          
          const { error: analysisUpdateError } = await supabase
            .from('user_brain')
            .update({
              analysis: analysis
            })
            .eq('user_id', signupData.user.id)
          
          if (analysisUpdateError) {
            console.error('❌ Greška pri čuvanju analize:', analysisUpdateError)
          } else {
            console.log('✅ AI analiza sačuvana u bazi')
          }
          
        } else {
          const errorData = await openaiResponse.json()
          console.error('❌ OpenAI API greška:', errorData)
        }
        
      } else {
        const errorText = await perplexityResponse.text()
        console.error('❌ Perplexity API greška:', errorText)
      }
      
    } catch (err) {
      console.error('❌ Greška pri AI analizi:', err)
    }
    
    // 6. FINALNA PROVERA
    console.log('\n6️⃣ Finalna provera podataka u bazi...')
    
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
        analysis: finalBrainData.analysis ? 'Postoji (' + finalBrainData.analysis.length + ' karaktera)' : 'Nema'
      })
    }
    
    console.log('\n🎉 Test završen!')
    console.log(`📧 Test korisnik: ${testEmail}`)
    console.log(`🔑 ID: ${signupData.user.id}`)
    console.log(`🌐 Website: https://tialorens.rs/`)
    
  } catch (error) {
    console.error('❌ Greška tokom testa:', error)
  }
}

testTialorensFlow()
