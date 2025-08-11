import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')
console.log('🔑 API Key length:', perplexityApiKey?.length || 0)

async function testPerplexityModels() {
  const models = [
    'sonar-pro',
    'sonar-medium-online',
    'sonar-small-online',
    'llama-3.1-sonar-large-128k-online',
    'llama-3.1-sonar-large-128k',
    'llama-3.1-sonar-large',
    'llama-3.1-8b-online',
    'llama-3.1-70b-online'
  ]
  
  for (const model of models) {
    console.log(`\n🧪 Testiram model: ${model}`)
    
    try {
      const prompt = `Visit https://tialorens.rs/ and give me a brief summary of what this website is about in 2-3 sentences.`
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${perplexityApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200
        })
      })
      
      console.log(`📡 Response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        console.log(`✅ Model ${model} radi!`)
        console.log(`📝 Response: ${content.substring(0, 150)}...`)
        
        // Ako ovaj model radi, testiraj ga sa tialorens.rs
        if (content.includes('tialorens') || content.includes('fashion') || content.includes('moda') || !content.includes("can't") && !content.includes("cannot")) {
          console.log(`🎯 Model ${model} uspešno analizirao tialorens.rs!`)
          return model // Nađen radni model
        }
      } else {
        const errorText = await response.text()
        console.log(`❌ Model ${model} ne radi:`, errorText.substring(0, 100))
      }
      
    } catch (error) {
      console.log(`❌ Model ${model} error:`, error.message)
    }
    
    // Pauza između zahteva
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n❌ Nijedan model ne može da analizira tialorens.rs')
}

testPerplexityModels()
