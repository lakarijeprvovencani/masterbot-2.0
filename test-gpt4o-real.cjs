/**
 * Test GPT-4o Real Analysis
 * Stvarno poziva GPT-4o sa podacima sa tialorens.rs
 * Da vidimo šta AI generiše za ecommerce brend
 */

async function testGPT4oReal() {
  console.log('🤖 TESTIRAM PRAVU GPT-4o ANALIZU - tialorens.rs\n')
  
  try {
    // ========================================
    // KORAK 1: SKIDANJE SAJTA
    // ========================================
    console.log('1️⃣ Skidam sajt tialorens.rs...')
    console.log('─'.repeat(50))
    
    const response = await fetch('https://tialorens.rs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MasterbotAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    console.log('✅ Sajt uspešno skinut!')
    console.log(`📊 HTML dužina: ${html.length} karaktera`)
    
    // ========================================
    // KORAK 2: HTML CLEANING
    // ========================================
    console.log('\n2️⃣ Čistim HTML...')
    
    const cleanHTML = (html) => {
      let text = html
      text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      text = text.replace(/<[^>]+>/g, ' ')
      text = text.replace(/&amp;/g, '&')
      text = text.replace(/&lt;/g, '<')
      text = text.replace(/&gt;/g, '>')
      text = text.replace(/&quot;/g, '"')
      text = text.replace(/&#39;/g, "'")
      text = text.replace(/&nbsp;/g, ' ')
      text = text.replace(/\s+/g, ' ')
      text = text.replace(/\n\s*\n/g, '\n\n')
      text = text.trim()
      text = text.split('\n').filter(line => line.trim().length > 0).join('\n')
      return text
    }
    
    const cleanedText = cleanHTML(html)
    console.log(`✅ HTML očišćen: ${cleanedText.length} karaktera`)
    
    // ========================================
    // KORAK 3: IZVLАČENJE INFORMACIJA
    // ========================================
    console.log('\n3️⃣ Izvlačim ključne informacije...')
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Bez naslova'
    
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    const description = descMatch ? descMatch[1].trim() : 'Bez opisa'
    
    console.log(`📄 Naslov: ${title}`)
    console.log(`📋 Opis: ${description}`)
    
    // ========================================
    // KORAK 4: WEBSITE SUMMARY
    // ========================================
    console.log('\n4️⃣ Pripremam podatke za GPT-4o...')
    
    const websiteSummary = `Web sajt: https://tialorens.rs
Naslov: ${title}
Opis: ${description}
Broj reči: ${cleanedText.split(/\s+/).filter(word => word.length > 0).length}

Sadržaj sajta:
${cleanedText.substring(0, 2000)}${cleanedText.length > 2000 ? '...' : ''}`
    
    // ========================================
    // KORAK 5: ONBOARDING PODACI
    // ========================================
    const onboardingData = `
      Naziv kompanije: Tia Lorens
      Industrija: Ecommerce - prodaja ženske garderobe
      Ciljevi: Povećanje online prodaje, proširenje kataloga, poboljšanje customer experience
      Veličina tima: 5-10 zaposlenih
      Mesečni prihodi: 15000-25000 EUR
      Kako su čuli za Masterbot: Preko Instagram reklame
      Dodatne informacije: Fokus na premium žensku garderobu, ciljna publika 18-35 godina, planiraju proširenje na evropsko tržište
    `
    
    // ========================================
    // KORAK 6: GPT-4o PROMPT
    // ========================================
    console.log('\n5️⃣ Kreiram AI prompt...')
    
    const aiPrompt = `You are an expert ecommerce business analyst that analyzes website content and onboarding data to create comprehensive business profiles for online fashion brands.

**ANALIZIRAJ SLEDEĆE PODATKE:**

1. **WEBSITE PODACI** (skinuti direktno sa sajta):
\`\`\`
${websiteSummary}
\`\`\`

2. **ONBOARDING PODACI** (korisnik unet):
\`\`\`
${onboardingData.trim()}
\`\`\`

**ZADATAK:**
Analiziraj oba izvora podataka i kreiraj detaljnu, profesionalnu analizu ecommerce biznisa na srpskom jeziku.

**ANALIZA WEBSITE PODATAKA:**
- Pročitaj i analiziraj skinuti tekst sa sajta
- Identifikuj ključne informacije o ecommerce brendu
- Izvuci proizvode/kolekcije, ciljnu publiku, ton brenda
- Analiziraj marketinšku poziciju i prednosti
- Identifikuj ecommerce funkcionalnosti (shop, cene, katalog)

**KOMBINUJ SA ONBOARDING PODACIMA:**
- Spoji website analizu sa korisničkim podacima
- Eliminiši duplikate
- Kreiraj jedinstvenu, konzistentnu sliku ecommerce biznisa

**STRUKTURA IZLAZA:**
1. Kratak opis ecommerce brenda
2. Glavni proizvodi/kolekcije
3. Ciljna publika i pozicija na tržištu
4. Ličnost i ton brenda
5. Prednosti i jedinstvene karakteristike
6. Marketinške prilike za ecommerce
7. Prikupljeni resursi

**VAŽNE INSTRUKCIJE:**
- Fokus na ECOMMERCE i ONLINE PRODAJU
- Analiziraj website podatke detaljno i pažljivo
- Koristi sve dostupne informacije sa sajta
- Piši na srpskom jeziku u profesionalnom tonu
- NE koristi markdown formatiranje
- Budi konkretan i detaljan u analizi
- Identifikuj ecommerce prednosti i prilike

**NA KRAJU DODAJ:**
Ovo su informacije koje smo do sada prikupili o vašem ecommerce biznisu. One će biti korišćene za kreiranje prilagođenih marketinških strategija za online prodaju.`

    console.log(`✅ AI prompt kreiran: ${aiPrompt.length} karaktera`)
    
    // ========================================
    // KORAK 7: POZIV GPT-4o API-ja
    // ========================================
    console.log('\n6️⃣ POZIVAM GPT-4o API...')
    console.log('─'.repeat(50))
    
    // Učitaj API ključ iz environment-a
    const apiKey = process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE'
    
    console.log('🔑 API ključ: ' + apiKey.substring(0, 20) + '...')
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: aiPrompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
    })
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('❌ OpenAI API greška:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }
    
    const data = await openaiResponse.json()
    const analysis = data.choices[0].message.content
    
    // ========================================
    // KORAK 8: REZULTAT
    // ========================================
    console.log('\n🎉 GPT-4o ANALIZA GENERISANA! 🎉')
    console.log('═'.repeat(80))
    
    console.log('📊 STATISTIKE:')
    console.log(`   🤖 Model: ${data.model}`)
    console.log(`   📝 Tokens korišćeni: ${data.usage.total_tokens}`)
    console.log(`   💰 Trošak: ~$${(data.usage.total_tokens * 0.00001).toFixed(4)}`)
    console.log(`   ⏱️ Vreme odgovora: ${data.usage.total_tokens}ms`)
    
    console.log('\n📋 GPT-4o ANALIZA TIA LORENS:')
    console.log('─'.repeat(50))
    console.log(analysis)
    console.log('─'.repeat(50))
    
    console.log('\n✨ ANALIZA KOMPLETNA! GPT-4o je uspešno analizirao tvoj ecommerce brend!')
    
  } catch (error) {
    console.error('💥 Greška pri testiranju GPT-4o:', error)
    
    if (error.message.includes('OpenAI API error')) {
      console.log('\n💡 SUGESTIJA:')
      console.log('   - Proveri da li je API ključ validan')
      console.log('   - Proveri da li imaš kredite na OpenAI računu')
      console.log('   - Proveri da li je API dostupan')
    }
  }
}

// Pokreni test
testGPT4oReal().catch(console.error)
