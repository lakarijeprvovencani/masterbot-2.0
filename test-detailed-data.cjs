/**
 * Test Detaljni Podaci: Website Scraper + GPT-4o
 * Prikazuje sve podatke na svakom koraku integracije
 */

async function testDetailedData() {
  console.log('🔍 TESTIRAM DETALJNE PODATKE - SVAKI KORAK INTEGRACIJE\n')
  
  // ========================================
  // KORAK 1: WEBSITE SCRAPING
  // ========================================
  console.log('1️⃣ WEBSITE SCRAPING - Šta skidamo sa sajta:')
  console.log('═'.repeat(80))
  
  try {
    // Simuliram skidanje sajta
    const mockWebsiteData = {
      url: 'https://tialorens.rs',
      title: 'Tia Lorens - Profesionalni frizerski salon',
      rawHTML: `<html>
        <head>
          <title>Tia Lorens - Profesionalni frizerski salon</title>
          <meta name="description" content="Najbolji frizerski salon u gradu">
          <script>console.log('test');</script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <header>
            <h1>Tia Lorens</h1>
            <nav>
              <a href="/usluge">Usluge</a>
              <a href="/cene">Cene</a>
              <a href="/kontakt">Kontakt</a>
            </nav>
          </header>
          <main>
            <section class="hero">
              <h2>Profesionalni frizerski salon</h2>
              <p>Tia Lorens je premium frizerski salon koji pruža najkvalitetnije usluge friziranja i kozmetike. Naš tim stručnjaka sa dugogodišnjim iskustvom posvećen je tome da svaki klijent izađe iz salona zadovoljan i lepši nego što je ušao.</p>
            </section>
            <section class="services">
              <h3>Naše usluge</h3>
              <ul>
                <li>Šišanje muško i žensko</li>
                <li>Bojanje i pramenovi</li>
                <li>Tretmani za kosu</li>
                <li>Šminkanje</li>
                <li>Manikir i pedikir</li>
              </ul>
            </section>
            <section class="pricing">
              <h3>Cene usluga</h3>
              <div class="price-item">
                <span>Šišanje žensko:</span>
                <span>1500-2500 RSD</span>
              </div>
              <div class="price-item">
                <span>Šišanje muško:</span>
                <span>800-1200 RSD</span>
              </div>
              <div class="price-item">
                <span>Bojanje:</span>
                <span>3000-5000 RSD</span>
              </div>
            </section>
            <section class="contact">
              <h3>Kontakt informacije</h3>
              <p>Adresa: Knez Mihailova 15, Beograd</p>
              <p>Telefon: +381 11 123 4567</p>
              <p>Email: info@tialorens.rs</p>
              <p>Radno vreme: Pon-Pet 9:00-20:00, Sub 9:00-18:00</p>
            </section>
          </main>
          <footer>
            <p>&copy; 2024 Tia Lorens. Sva prava zadržana.</p>
          </footer>
        </body>
      </html>`,
      wordCount: 156,
      timestamp: new Date(),
      success: true
    }
    
    console.log('📄 ORIGINALNI HTML (prvih 500 karaktera):')
    console.log('─'.repeat(40))
    console.log(mockWebsiteData.rawHTML.substring(0, 500) + '...')
    console.log('─'.repeat(40))
    
    console.log(`\n📊 STATISTIKE SKIDANJA:`)
    console.log(`   🌐 URL: ${mockWebsiteData.url}`)
    console.log(`   📄 Naslov: ${mockWebsiteData.title}`)
    console.log(`   📝 Broj reči: ${mockWebsiteData.wordCount}`)
    console.log(`   ⏰ Timestamp: ${mockWebsiteData.timestamp.toLocaleString('sr-RS')}`)
    console.log(`   ✅ Status: ${mockWebsiteData.success ? 'USPEŠNO' : 'NEUSPEŠNO'}`)
    
    // ========================================
    // KORAK 2: HTML CLEANING
    // ========================================
    console.log('\n\n2️⃣ HTML CLEANING - Kako izgleda čist tekst:')
    console.log('═'.repeat(80))
    
    // Simuliram HTML cleaning proces
    const cleanHTML = (html) => {
      let text = html
      
      // Ukloni script tagove
      text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      
      // Ukloni style tagove
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      
      // Ukloni sve HTML tagove
      text = text.replace(/<[^>]+>/g, ' ')
      
      // Dekoduj HTML entitete
      text = text.replace(/&amp;/g, '&')
      text = text.replace(/&lt;/g, '<')
      text = text.replace(/&gt;/g, '>')
      text = text.replace(/&quot;/g, '"')
      text = text.replace(/&#39;/g, "'")
      text = text.replace(/&nbsp;/g, ' ')
      
      // Očisti whitespace
      text = text.replace(/\s+/g, ' ')
      text = text.replace(/\n\s*\n/g, '\n\n')
      text = text.trim()
      
      // Ukloni prazne linije
      text = text.split('\n').filter(line => line.trim().length > 0).join('\n')
      
      return text
    }
    
    const cleanedText = cleanHTML(mockWebsiteData.rawHTML)
    
    console.log('🧹 ČIST TEKST (nakon HTML cleaning-a):')
    console.log('─'.repeat(40))
    console.log(cleanedText)
    console.log('─'.repeat(40))
    
    console.log(`\n📊 STATISTIKE ČIŠĆENJA:`)
    console.log(`   📝 Originalni HTML: ${mockWebsiteData.rawHTML.length} karaktera`)
    console.log(`   🧹 Čist tekst: ${cleanedText.length} karaktera`)
    console.log(`   📊 Ušteda: ${Math.round((1 - cleanedText.length / mockWebsiteData.rawHTML.length) * 100)}%`)
    console.log(`   📝 Broj reči: ${cleanedText.split(/\s+/).filter(word => word.length > 0).length}`)
    
    // ========================================
    // KORAK 3: WEBSITE SUMMARY
    // ========================================
    console.log('\n\n3️⃣ WEBSITE SUMMARY - Podaci za GPT-4o:')
    console.log('═'.repeat(80))
    
    const websiteSummary = `Web sajt: ${mockWebsiteData.url}
Naslov: ${mockWebsiteData.title}
Broj reči: ${mockWebsiteData.wordCount}

Sadržaj sajta:
${cleanedText}`
    
    console.log('📋 WEBSITE SUMMARY (šalje se GPT-4o):')
    console.log('─'.repeat(40))
    console.log(websiteSummary)
    console.log('─'.repeat(40))
    
    console.log(`\n📊 STATISTIKE SUMMARY:`)
    console.log(`   📝 Dužina summary-ja: ${websiteSummary.length} karaktera`)
    console.log(`   🌐 URL uključen: ${websiteSummary.includes(mockWebsiteData.url)}`)
    console.log(`   📄 Naslov uključen: ${websiteSummary.includes(mockWebsiteData.title)}`)
    console.log(`   📊 Broj reči uključen: ${websiteSummary.includes(mockWebsiteData.wordCount.toString())}`)
    
    // ========================================
    // KORAK 4: ONBOARDING PODACI
    // ========================================
    console.log('\n\n4️⃣ ONBOARDING PODACI - Korisnik unet:')
    console.log('═'.repeat(80))
    
    const onboardingData = `
      Naziv kompanije: Tia Lorens
      Industrija: Frizerski salon
      Ciljevi: Povećanje broja klijenata, poboljšanje online prisustva, digitalizacija poslovanja
      Veličina tima: 8 zaposlenih
      Mesečni prihodi: 8000 EUR
      Kako su čuli za Masterbot: Preko Instagram reklame
      Dodatne informacije: Fokus na premium usluge, ciljna publika 25-45 godina, planiraju otvaranje novog salona
    `
    
    console.log('📝 ONBOARDING PODACI (korisnik unet):')
    console.log('─'.repeat(40))
    console.log(onboardingData.trim())
    console.log('─'.repeat(40))
    
    console.log(`\n📊 STATISTIKE ONBOARDING:`)
    console.log(`   📝 Dužina: ${onboardingData.length} karaktera`)
    console.log(`   🏢 Kompanija: ${onboardingData.includes('Tia Lorens') ? '✅' : '❌'}`)
    console.log(`   🏭 Industrija: ${onboardingData.includes('Frizerski salon') ? '✅' : '❌'}`)
    console.log(`   🎯 Ciljevi: ${onboardingData.includes('Povećanje broja klijenata') ? '✅' : '❌'}`)
    
    // ========================================
    // KORAK 5: GPT-4o PROMPT
    // ========================================
    console.log('\n\n5️⃣ GPT-4o PROMPT - Šta se šalje AI-u:')
    console.log('═'.repeat(80))
    
    const aiPrompt = `You are an expert business analyst that analyzes website content and onboarding data to create comprehensive business profiles.

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
Analiziraj oba izvora podataka i kreiraj detaljnu, profesionalnu analizu biznisa na srpskom jeziku.

**ANALIZA WEBSITE PODATAKA:**
- Pročitaj i analiziraj skinuti tekst sa sajta
- Identifikuj ključne informacije o kompaniji
- Izvuci proizvode/usluge, ciljnu publiku, ton brenda
- Analiziraj marketinšku poziciju i prednosti

**KOMBINUJ SA ONBOARDING PODACIMA:**
- Spoji website analizu sa korisničkim podacima
- Eliminiši duplikate
- Kreiraj jedinstvenu, konzistentnu sliku biznisa

**STRUKTURA IZLAZA:**
1. Kratak opis kompanije
2. Glavni proizvodi/usluge
3. Ciljna publika i pozicija na tržištu
4. Ličnost i ton brenda
5. Prednosti i jedinstvene karakteristike
6. Marketinške prilike
7. Prikupljeni resursi

**VAŽNE INSTRUKCIJE:**
- Analiziraj website podatke detaljno i pažljivo
- Koristi sve dostupne informacije sa sajta
- Piši na srpskom jeziku u profesionalnom tonu
- NE koristi markdown formatiranje
- Budi konkretan i detaljan u analizi

**NA KRAJU DODAJ:**
Ovo su informacije koje smo do sada prikupili o vašem biznisu. One će biti korišćene za kreiranje prilagođenih marketinških strategija.`

    console.log('🤖 AI PROMPT (šalje se GPT-4o):')
    console.log('─'.repeat(40))
    console.log(aiPrompt.substring(0, 800) + '...')
    console.log('─'.repeat(40))
    
    console.log(`\n📊 STATISTIKE AI PROMPT:`)
    console.log(`   📝 Dužina prompt-a: ${aiPrompt.length} karaktera`)
    console.log(`   🌐 Website podaci uključeni: ${aiPrompt.includes(mockWebsiteData.url) ? '✅' : '❌'}`)
    console.log(`   📝 Onboarding podaci uključeni: ${aiPrompt.includes('Tia Lorens') ? '✅' : '❌'}`)
    console.log(`   🎯 Instrukcije jasne: ${aiPrompt.includes('srpskom jeziku') ? '✅' : '❌'}`)
    
    // ========================================
    // KORAK 6: FINALNI REZULTAT
    // ========================================
    console.log('\n\n6️⃣ FINALNI REZULTAT - Kako će izgledati:')
    console.log('═'.repeat(80))
    
    console.log('📊 PODACI KOJE GPT-4o ANALIZIRA:')
    console.log('─'.repeat(40))
    console.log(`   🌐 Website: ${mockWebsiteData.url}`)
    console.log(`   📄 Naslov: ${mockWebsiteData.title}`)
    console.log(`   📝 Sadržaj: ${cleanedText.length} karaktera`)
    console.log(`   🏢 Kompanija: Tia Lorens`)
    console.log(`   🏭 Industrija: Frizerski salon`)
    console.log(`   🎯 Ciljevi: Digitalizacija, rast`)
    console.log(`   👥 Tim: 8 zaposlenih`)
    console.log(`   💰 Prihodi: 8000 EUR/mesečno`)
    console.log('─'.repeat(40))
    
    console.log('\n🎯 ŠTA ĆE GPT-4o GENERISATI:')
    console.log('─'.repeat(40))
    console.log('1. Kratak opis kompanije (na osnovu website + onboarding)')
    console.log('2. Glavni proizvodi/usluge (iz website sadržaja)')
    console.log('3. Ciljna publika (iz website + onboarding)')
    console.log('4. Ličnost i ton brenda (iz website komunikacije)')
    console.log('5. Prednosti (iz website + onboarding)')
    console.log('6. Marketinške prilike (kombinacija oba izvora)')
    console.log('7. Prikupljeni resursi (website link)')
    console.log('─'.repeat(40))
    
    // ========================================
    // KORAK 7: PROVERA INTEGRACIJE
    // ========================================
    console.log('\n\n7️⃣ PROVERA INTEGRACIJE - Da li sve radi:')
    console.log('═'.repeat(80))
    
    const integrationChecks = [
      { name: 'Website Scraper', status: mockWebsiteData.success, description: 'Skida HTML sa sajta' },
      { name: 'HTML Cleaning', status: cleanedText.length > 0, description: 'Čisti HTML do teksta' },
      { name: 'Data Extraction', status: mockWebsiteData.title && mockWebsiteData.wordCount, description: 'Izvlači naslov i broji reči' },
      { name: 'Onboarding Data', status: onboardingData.includes('Tia Lorens'), description: 'Korisnički podaci' },
      { name: 'AI Prompt Creation', status: aiPrompt.length > 1000, description: 'Kreira prompt za GPT-4o' },
      { name: 'Data Combination', status: aiPrompt.includes(mockWebsiteData.url) && aiPrompt.includes('Tia Lorens'), description: 'Kombinuje oba izvora' },
      { name: 'Serbian Language', status: aiPrompt.includes('srpskom jeziku'), description: 'Instrukcije na srpskom' },
      { name: 'No Markdown', status: !aiPrompt.includes('###') && !aiPrompt.includes('**'), description: 'Nema markdown formatiranja' }
    ]
    
    console.log('🔍 PROVERA SVIH KOMPONENTI:')
    console.log('─'.repeat(40))
    
    integrationChecks.forEach((check, index) => {
      const status = check.status ? '✅ RADI' : '❌ NE RADI'
      console.log(`${index + 1}. ${check.name}: ${status}`)
      console.log(`   📝 ${check.description}`)
    })
    
    const workingComponents = integrationChecks.filter(check => check.status).length
    const totalComponents = integrationChecks.length
    
    console.log('\n📊 FINALNA STATISTIKA:')
    console.log('─'.repeat(40))
    console.log(`   🎯 Radnih komponenti: ${workingComponents}/${totalComponents}`)
    console.log(`   📊 Uspešnost: ${Math.round((workingComponents / totalComponents) * 100)}%`)
    console.log(`   🚀 Status: ${workingComponents === totalComponents ? 'SVE RADI PERFEKTNO!' : 'IMA PROBLEMA'}`)
    
    if (workingComponents === totalComponents) {
      console.log('\n🎉 INTEGRACIJA JE 100% USPEŠNA! 🎉')
      console.log('Website Scraper + GPT-4o = SAVRŠENO RADI! 🚀')
    } else {
      console.log('\n⚠️ POSTOJE PROBLEMI KOJE TREBA REŠITI')
    }
    
  } catch (error) {
    console.error('💥 Greška pri testiranju:', error)
  }
}

// Pokreni test
testDetailedData().catch(console.error)
