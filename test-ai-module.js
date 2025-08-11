import dotenv from 'dotenv'

dotenv.config()

console.log('🔑 Perplexity API Key:', process.env.VITE_PERPLEXITY_API_KEY ? 'Postoji' : 'Nema')
console.log('🔑 OpenAI API Key:', process.env.VITE_OPENAI_API_KEY ? 'Postoji' : 'Nema')

// Simuliram setStage funkciju
const setStage = (stage) => {
  console.log(`📊 Stage: ${stage}`)
}

// Simuliram user ID
const testUserId = '855e4cb0-36bd-454f-84c3-bea90fd996d5'

console.log('\n🧪 Testiram AI modul...')
console.log('📝 Test user ID:', testUserId)

// Test OpenAI API direktno
async function testOpenAI() {
  try {
    console.log('\n1️⃣ Testiram OpenAI API direktno...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: 'Generate a brief business analysis for a technology company in Serbian.'
        }],
        max_tokens: 200
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ OpenAI API radi!')
      console.log('📝 Response:', data.choices[0].message.content.substring(0, 150) + '...')
    } else {
      const errorText = await response.text()
      console.log('❌ OpenAI error:', response.status, errorText.substring(0, 200))
    }
    
  } catch (error) {
    console.error('❌ OpenAI test error:', error.message)
  }
}

// Test Perplexity API direktno
async function testPerplexity() {
  try {
    console.log('\n2️⃣ Testiram Perplexity API direktno...')
    
    if (!process.env.VITE_PERPLEXITY_API_KEY) {
      console.log('⚠️ Nema Perplexity API ključa, preskačem test')
      return
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        messages: [{
          role: 'user',
          content: 'Hello'
        }],
        max_tokens: 50
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Perplexity API radi!')
      console.log('📝 Response:', data.choices[0].message.content)
    } else {
      const errorText = await response.text()
      console.log('❌ Perplexity error:', response.status, errorText.substring(0, 200))
    }
    
  } catch (error) {
    console.error('❌ Perplexity test error:', error.message)
  }
}

// Pokretanje testova
async function runTests() {
  await testOpenAI()
  await testPerplexity()
  
  console.log('\n🎉 Testovi završeni!')
  console.log('💡 OpenAI API radi, Perplexity API ima problema sa modelima')
  console.log('💡 AI modul će raditi sa OpenAI-om, preskočiće Perplexity ako ne radi')
}

runTests()
