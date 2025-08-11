import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')
console.log('🔑 API Key length:', perplexityApiKey?.length || 0)

async function testPerplexityEndpoints() {
  try {
    console.log('\n🧪 Testiram različite Perplexity endpoint-ove...')
    
    // Test 1: Chat completions sa ispravnim modelom
    console.log('\n1️⃣ Testiram chat completions sa llama-3.1-8b...')
    
    const chatResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
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
    
    console.log('Chat response status:', chatResponse.status)
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text()
      console.log('Chat error:', errorText.substring(0, 200))
    } else {
      const data = await chatResponse.json()
      console.log('✅ Chat radi:', data.choices[0].message.content)
    }
    
    // Test 2: Completions endpoint (stari format)
    console.log('\n2️⃣ Testiram completions endpoint...')
    
    const completionsResponse = await fetch('https://api.perplexity.ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        prompt: 'Hello',
        max_tokens: 50
      })
    })
    
    console.log('Completions response status:', completionsResponse.status)
    if (!completionsResponse.ok) {
      const errorText = await completionsResponse.text()
      console.log('Completions error:', errorText.substring(0, 200))
    } else {
      const data = await completionsResponse.json()
      console.log('✅ Completions radi:', data.choices[0].text)
    }
    
    // Test 3: Proveravam da li je API ključ aktivan
    console.log('\n3️⃣ Proveravam API ključ...')
    
    const testResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Pokušavam sa GPT modelom
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      })
    })
    
    console.log('GPT test status:', testResponse.status)
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.log('GPT test error:', errorText.substring(0, 200))
    } else {
      const data = await testResponse.json()
      console.log('✅ GPT test radi:', data.choices[0].message.content)
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error.message)
  }
}

testPerplexityEndpoints()
