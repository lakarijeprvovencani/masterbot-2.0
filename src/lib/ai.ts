// src/lib/ai.ts
import { supabase } from './supabase'
import { UserBrain } from '../contexts/AuthContext'
import { scrapeWebsite, normalizeURL, isValidURL } from './website-scraper'

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export async function processOnboardingAnalysis(userId: string, setStage: (stage: string) => void) {
  setStage('Učitavam vaše podatke...')
  const { data: userBrain, error: fetchError } = await supabase
    .from('user_brain')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !userBrain) {
    console.error('Greška pri učitavanju user_brain:', fetchError)
    throw new Error('Nije moguće učitati korisničke podatke za analizu.')
  }

  let websiteSummary = ''
  
  // Koristimo naš Website Scraper umesto Perplexity-ja
  if (userBrain.website) {
    setStage('Skidam i analiziram vaš web sajt...')
    try {
      // Normalizuj URL
      const normalizedUrl = normalizeURL(userBrain.website)
      
      if (!isValidURL(normalizedUrl)) {
        throw new Error('Nevažeći URL format')
      }
      
      console.log(`🌐 Skidam sajt: ${normalizedUrl}`)
      
      // Skini sajt preko backend-a (rešava CORS problem)
      console.log(`🌐 Skidam sajt preko backend-a: ${normalizedUrl}`)
      
      const backendResponse = await fetch('http://localhost:4001/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: normalizedUrl })
      })
      
      if (!backendResponse.ok) {
        throw new Error(`Backend greška: ${backendResponse.status}`)
      }
      
      const scrapedData = await backendResponse.json()
      
      if (scrapedData.success) {
        console.log('✅ Sajt uspešno skinut:', scrapedData.title)
        console.log(`📊 Broj reči: ${scrapedData.wordCount}`)
        
        // Kreiraj summary od skinutog teksta
        websiteSummary = `Web sajt: ${normalizedUrl}
Naslov: ${scrapedData.title}
Broj reči: ${scrapedData.wordCount}

Sadržaj sajta:
${scrapedData.text.substring(0, 2000)}${scrapedData.text.length > 2000 ? '...' : ''}`
        
        setStage('Sajt uspešno skinut i analiziran!')
      } else {
        throw new Error(scrapedData.error || 'Nepoznata greška pri skidanju')
      }
      
    } catch (err) {
      console.error('Greška pri skidanju sajta:', err)
      setStage('Greška pri skidanju sajta. Nastavljam bez web analize.')
      websiteSummary = `Web sajt: ${userBrain.website} (Greška pri skidanju: ${err instanceof Error ? err.message : String(err)})`
    }
  } else {
    setStage('Nema web sajta za analizu.')
    websiteSummary = 'Nema web sajta za analizu'
  }

  setStage('Analiziram vaše ciljeve i podatke (OpenAI)...')
  const onboardingData = `
    Naziv kompanije: ${userBrain.company_name || 'Nije uneto'}
    Industrija: ${userBrain.industry || 'Nije uneto'}
    Ciljevi: ${userBrain.goals && userBrain.goals.length > 0 ? userBrain.goals.join(', ') : 'Nije uneto'}
    Veličina tima: ${userBrain.data?.team_size || 'Nije uneto'}
    Mesečni prihodi: ${userBrain.data?.monthly_revenue || 'Nije uneto'}
    Kako su čuli za Masterbot: ${userBrain.data?.heard_from || 'Nije uneto'}
  `

  const openAIPrompt = `You are an expert business analyst that analyzes website content and onboarding data to create comprehensive business profiles.

    **ANALIZIRAJ SLEDEĆE PODATKE:**

    1. **WEBSITE PODACI** (skinuti direktno sa sajta):
    ${websiteSummary ? `\n\`\`\`\n${websiteSummary}\n\`\`\`` : 'Nema podataka sa sajta.'}

    2. **ONBOARDING PODACI** (korisnik unet):
    \`\`\`
    ${onboardingData}
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
    Sažet, ali sadržajan pregled poslovanja na osnovu website analize.

    2. Glavni proizvodi/usluge
    Detaljna analiza ponude na osnovu website sadržaja.

    3. Ciljna publika i pozicija na tržištu
    Analiza ciljne publike iz website sadržaja i korisničkih podataka.

    4. Ličnost i ton brenda
    Analiza komunikacije i brend identiteta sa sajta.

    5. Prednosti i jedinstvene karakteristike
    Šta ih izdvaja od konkurencije na osnovu website analize.

    6. Marketinške prilike
    Konkretni predlozi na osnovu analize website sadržaja i korisničkih ciljeva.

    7. Prikupljeni resursi
    Website link i ključni materijali sa sajta.

    **VAŽNE INSTRUKCIJE:**
    - Analiziraj website podatke detaljno i pažljivo
    - Koristi sve dostupne informacije sa sajta
    - Piši na srpskom jeziku u profesionalnom tonu
    - NE koristi markdown formatiranje (###, **, \`, >)
    - Koristi običan tekst sa jasnim naslovima
    - Razdvoji sekcije sa praznim redovima
    - Koristi numerisane liste umesto markdown lista
    - Budi konkretan i detaljan u analizi

    **NA KRAJU DODAJ:**
    Ovo su informacije koje smo do sada prikupili o vašem biznisu. One će biti korišćene za kreiranje prilagođenih marketinških strategija.`

  try {
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
              body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: openAIPrompt }]
        })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API greška:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    const data = await openaiResponse.json()
    const analysis = data.choices[0].message.content
    console.log('✅ OpenAI Analysis:', analysis)
    setStage('Analiza završena!')
    return { websiteSummary, analysis }

  } catch (err) {
    console.error('Greška pri pozivu OpenAI API-ja:', err)
    setStage('Greška pri generisanju analize.')
    throw new Error(`Greška pri generisanju analize: ${err instanceof Error ? err.message : String(err)}`)
  }
}


