// Test da proverim da li se environment varijable učitavaju u frontend
console.log('🔍 Testiram environment varijable u frontend...')

// Proveri da li postoje
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Postoji' : 'Nema')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Postoji' : 'Nema')
console.log('VITE_PERPLEXITY_API_KEY:', import.meta.env.VITE_PERPLEXITY_API_KEY ? 'Postoji' : 'Nema')
console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? 'Postoji' : 'Nema')

// Proveri dužine
console.log('VITE_SUPABASE_URL length:', import.meta.env.VITE_SUPABASE_URL?.length || 0)
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0)
console.log('VITE_PERPLEXITY_API_KEY length:', import.meta.env.VITE_PERPLEXITY_API_KEY?.length || 0)
console.log('VITE_OPENAI_API_KEY length:', import.meta.env.VITE_OPENAI_API_KEY?.length || 0)

// Test API poziva
async function testAPIs() {
  console.log('\n🧪 Testiram API pozive...')
  
  // Test Perplexity
  if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
    try {
      console.log('📡 Testiram Perplexity API...')
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 50
        })
      })
      
      if (response.ok) {
        console.log('✅ Perplexity API radi!')
      } else {
        console.log('❌ Perplexity API ne radi:', response.status)
      }
    } catch (err) {
      console.log('❌ Perplexity API error:', err.message)
    }
  } else {
    console.log('❌ Nema Perplexity API ključa')
  }
  
  // Test OpenAI
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    try {
      console.log('📡 Testiram OpenAI API...')
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 50
        })
      })
      
      if (response.ok) {
        console.log('✅ OpenAI API radi!')
      } else {
        console.log('❌ OpenAI API ne radi:', response.status)
      }
    } catch (err) {
      console.log('❌ OpenAI API error:', err.message)
    }
  } else {
    console.log('❌ Nema OpenAI API ključa')
  }
}

testAPIs()
