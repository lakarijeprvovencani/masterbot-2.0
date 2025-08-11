import dotenv from 'dotenv'

dotenv.config()

const perplexityApiKey = process.env.VITE_PERPLEXITY_API_KEY

console.log('🔑 Perplexity API Key:', perplexityApiKey ? 'Postoji' : 'Nema')

async function testWebsiteAccess() {
  const websites = [
    'https://example.com',
    'https://google.com', 
    'https://github.com',
    'https://stackoverflow.com',
    'https://tialorens.rs/',
    'https://nocodebalkan.com/'
  ]
  
  for (const website of websites) {
    console.log(`\n🌐 Testiram: ${website}`)
    
    try {
      const prompt = `Visit and analyze this website: ${website}. Give me a brief summary of what this website is about in 2-3 sentences.`
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        console.log('✅ Uspešno:', content.substring(0, 100) + '...')
      } else {
        const errorText = await response.text()
        console.log('❌ Greška:', response.status, errorText.substring(0, 100))
      }
      
    } catch (error) {
      console.log('❌ Exception:', error.message)
    }
    
    // Pauza između zahteva
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

testWebsiteAccess()
