// src/lib/ai.ts
import { supabase } from './supabase'
import { UserBrain } from '../contexts/AuthContext'

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
  
  // Pokušavamo Perplexity, ali ako ne radi, preskačemo
  if (userBrain.website && PERPLEXITY_API_KEY) {
    setStage('Analiziram vaš web sajt (Perplexity AI)...')
    try {
      const perplexityPrompt = `You are a research assistant tasked with extracting all relevant business information from a given website. Visit and explore the following website: ${userBrain.website}. Your goal is to produce a comprehensive, structured summary with as much detail as possible. Include the following sections: 1. **Business Overview** – Brief history, mission, and values. 2. **Products / Services** – List all products or services with descriptions, features, benefits, and pricing (if available). 3. **Target Audience** – Who they serve (demographics, industries, niches). 4. **Unique Selling Proposition (USP)** – What makes them stand out from competitors. 5. **Brand Style & Tone** – How they communicate (formal, casual, technical, emotional, luxury, etc.). 6. **Visual Identity** – Colors, logo style, fonts, and general website aesthetics. 7. **Key Team Members** – Names, roles, and bios (if available). 8. **Customer Testimonials / Reviews** – Any quotes, ratings, or case studies. 9. **Marketing Channels** – Social media presence, email newsletters, advertising approaches. 10. **Notable Clients or Partners** – Mention if listed. 11. **Additional Observations** – Anything else relevant to understanding their business. Return all findings in a **clear, well-structured markdown format** so they can be easily parsed and reused for marketing purposes.`

      const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: perplexityPrompt }]
        })
      })

      if (perplexityResponse.ok) {
        const data = await perplexityResponse.json()
        websiteSummary = data.choices[0].message.content
        console.log('✅ Perplexity Summary:', websiteSummary)
      } else {
        console.warn('⚠️ Perplexity API ne radi, preskačem web analizu')
        websiteSummary = `Web sajt: ${userBrain.website} (Perplexity API trenutno nedostupan)`
      }

    } catch (err) {
      console.error('Greška pri pozivu Perplexity API-ja:', err)
      setStage('Perplexity API nedostupan. Nastavljam bez web analize.')
      websiteSummary = `Web sajt: ${userBrain.website} (Greška pri analizi: ${err instanceof Error ? err.message : String(err)})`
    }
  } else {
    setStage('Nema web sajta ili Perplexity API ključa. Preskačem web analizu.')
    websiteSummary = userBrain.website ? `Web sajt: ${userBrain.website} (Nema Perplexity API ključa)` : 'Nema web sajta za analizu'
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

  const openAIPrompt = `You are an assistant that combines two sets of data:
    1. Information gathered from the client's website research (see: ${websiteSummary ? `\n\`\`\`\n${websiteSummary}\n\`\`\`` : 'Nema podataka sa sajta.'})
    2. Information provided during onboarding (see: \n\`\`\`\n${onboardingData}\n\`\`\`)

    Your task:
    - Merge both data sources into a single, clear, and user-friendly business profile.
    - Avoid repeating identical info — consolidate where possible.
    - Keep factual accuracy from the original sources.
    - Organize output into the following sections:

    1. **Kratak opis kompanije** – Sažet, ali sadržajan pregled poslovanja.
    2. **Glavni proizvodi/usluge** – Osnovna ponuda, pojednostavljena radi lakšeg razumevanja.
    3. **Ciljna publika i pozicija na tržištu** – Ko su kupci i gde se brend pozicionira.
    4. **Ličnost i ton brenda** – Način na koji brend komunicira sa publikom.
    5. **Prednosti i jedinstvene karakteristike** – Šta ih izdvaja od konkurencije.
    6. **Marketinške prilike** – Kratki predlozi na osnovu prikupljenih podataka.
    7. **Prikupljeni resursi** – Linkovi, ključni vizuali ili drugi materijali.

    ⚠️ **Važno:** Finalni tekst prikaži u potpunosti na srpskom jeziku, u profesionalnom i jasnom tonu.

    Na kraju dodaj poruku:
    > "Ovo su informacije koje smo do sada prikupili o vašem biznisu. One će biti korišćene za kreiranje prilagođenih marketinških strategija."
  `

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


