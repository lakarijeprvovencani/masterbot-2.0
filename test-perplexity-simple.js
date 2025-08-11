import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')
console.log('🔑 API Key length:', perplexityApiKey?.length || 0)
console.log('🔑 API Key starts with:', perplexityApiKey?.substring(0, 10) || 'N/A')

async function testPerplexitySimple() {
  try {
    console.log('\n🧪 Testiram Perplexity API sa osnovnim modelom...')
    
    // Pokušavam sa najosnovnijim modelom
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      })
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      
      // Pokušavam da vidim šta Perplexity očekuje
      console.log('\n🔍 Pokušavam da vidim dostupne modele...')
      
      const modelsResponse = await fetch('https://api.perplexity.ai/models', {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`
        }
      })
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        console.log('📋 Dostupni modeli:', modelsData)
      } else {
        console.log('❌ Ne mogu da dobavim modele:', modelsResponse.status)
      }
      
      return
    }
    
    const data = await response.json()
    console.log('✅ Success response:', data)
    
  } catch (error) {
    console.error('❌ Fetch error:', error.message)
  }
}

testPerplexitySimple()
