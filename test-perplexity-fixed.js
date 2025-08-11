import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')
console.log('🔑 API Key length:', perplexityApiKey?.length || 0)

async function testPerplexityFixed() {
  try {
    console.log('\n🧪 Testiram Perplexity API sa sonar-pro modelom...')
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: 'Hello, can you give me a brief summary of what you do?'
        }],
        max_tokens: 100
      })
    })
    
    console.log('📡 Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Success response:', data.choices[0].message.content)
    
  } catch (error) {
    console.error('❌ Fetch error:', error.message)
  }
}

testPerplexityFixed()
