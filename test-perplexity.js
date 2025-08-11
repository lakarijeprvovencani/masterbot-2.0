import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')
console.log('🔑 OpenAI API Key:', process.env.VITE_OPENAI_API_KEY ? 'Postoji' : 'Nema')

async function testPerplexity() {
  try {
    console.log('\n🧪 Testiram Perplexity API...')
    
    // Pokušavam sa različitim modelima
    const models = [
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-large-128k',
      'llama-3.1-sonar-large',
      'llama-3.1-sonar-medium',
      'llama-3.1-sonar-small',
      'llama-3.1-8b-instruct',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b',
      'llama-3.1-70b',
      'mixtral-8x7b-instruct',
      'mistral-7b-instruct',
      'codellama-70b-instruct',
      'pplx-7b-online',
      'pplx-70b-online',
      'pplx-7b-chat',
      'pplx-70b-chat'
    ]
    
    for (const model of models) {
      console.log(`\n🧪 Testiram model: ${model}`)
      
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${perplexityApiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'user',
              content: 'Hello, can you give me a brief summary of what you do?'
            }],
            max_tokens: 100
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Model ${model} radi!`)
          console.log('Response:', data.choices[0].message.content.substring(0, 100) + '...')
          return model // Nađen radni model
        } else {
          const errorText = await response.text()
          console.log(`❌ Model ${model} ne radi:`, response.status, errorText.substring(0, 100))
        }
      } catch (error) {
        console.log(`❌ Model ${model} error:`, error.message)
      }
    }
    
    console.log('\n❌ Nijedan model ne radi!')
    
  } catch (error) {
    console.error('❌ Fetch error:', error.message)
  }
}

testPerplexity()
