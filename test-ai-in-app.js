import dotenv from 'dotenv'

dotenv.config()

console.log('🔑 Perplexity API Key:', process.env.VITE_PERPLEXITY_API_KEY ? 'Postoji' : 'Nema')
console.log('🔑 OpenAI API Key:', process.env.VITE_OPENAI_API_KEY ? 'Postoji' : 'Nema')

// Simuliram setStage funkciju
const setStage = (stage) => {
  console.log(`📊 Stage: ${stage}`)
}

// Simuliram user ID
const testUserId = 'aa2357bf-4156-4382-bdf7-b616270e290f'

console.log('\n🧪 Testiram AI modul koji se koristi u aplikaciji...')
console.log('📝 Test user ID:', testUserId)

// Test Perplexity API direktno
async function testPerplexityDirect() {
  try {
    console.log('\n1️⃣ Testiram Perplexity API direktno...')
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: 'Visit https://example.com and give me a brief summary of what you see.'
        }],
        max_tokens: 200
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Perplexity API radi!')
      console.log('📝 Response:', data.choices[0].message.content.substring(0, 150) + '...')
      return data.choices[0].message.content
    } else {
      const errorText = await response.text()
      console.log('❌ Perplexity error:', response.status, errorText.substring(0, 200))
      return null
    }
    
  } catch (error) {
    console.error('❌ Perplexity test error:', error.message)
    return null
  }
}

// Test OpenAI API direktno
async function testOpenAIDirect(websiteSummary) {
  try {
    console.log('\n2️⃣ Testiram OpenAI API direktno...')
    
    const onboardingData = `
      Naziv kompanije: Test Company
      Industrija: Technology
      Ciljevi: Increase sales, Improve marketing
      Veličina tima: 5-10
      Mesečni prihodi: 10k-50k
      Kako su čuli za Masterbot: Google
    `

    const openAIPrompt = `You are an assistant that combines two sets of data:
      1. Information gathered from the client's website research (see: ${websiteSummary ? `\n\`\`\`\n${websiteSummary}\n\`\`\`` : 'Nema podataka sa sajta.'})
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: openAIPrompt }]
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ OpenAI API radi!')
      console.log('📝 Response:', data.choices[0].message.content.substring(0, 150) + '...')
      return data.choices[0].message.content
    } else {
      const errorText = await response.text()
      console.log('❌ OpenAI error:', response.status, errorText.substring(0, 200))
      return null
    }
    
  } catch (error) {
    console.error('❌ OpenAI test error:', error.message)
    return null
  }
}

// Pokretanje testova
async function runTests() {
  console.log('🚀 Počinjem testove...')
  
  const perplexityResult = await testPerplexityDirect()
  if (perplexityResult) {
    const openaiResult = await testOpenAIDirect(perplexityResult)
    if (openaiResult) {
      console.log('\n🎉 Oba API-ja rade!')
      console.log('💡 Perplexity Summary:', perplexityResult.substring(0, 100) + '...')
      console.log('💡 OpenAI Analysis:', openaiResult.substring(0, 100) + '...')
    } else {
      console.log('\n❌ OpenAI API ne radi')
    }
  } else {
    console.log('\n❌ Perplexity API ne radi')
  }
}

runTests()
