/**
 * Website Scraper Module
 * Skida HTML sa sajtova i čisti ga do čistog teksta
 */

export interface ScrapedWebsite {
  url: string
  title: string
  text: string
  wordCount: number
  timestamp: Date
  success: boolean
  error?: string
}

export interface ScrapingOptions {
  timeout?: number
  userAgent?: string
  maxRetries?: number
}

/**
 * Glavna funkcija za skidanje sajta
 */
export async function scrapeWebsite(
  url: string, 
  options: ScrapingOptions = {}
): Promise<ScrapedWebsite> {
  const {
    timeout = 10000,
    userAgent = 'Mozilla/5.0 (compatible; MasterbotAI/1.0)',
    maxRetries = 3
  } = options

  console.log(`🌐 Skidam sajt: ${url}`)

  try {
    // Pokušaj da skineš HTML
    const html = await fetchWebsiteHTML(url, { timeout, userAgent, maxRetries })
    
    if (!html) {
      throw new Error('Nije moguće skiniti HTML sa sajta')
    }

    // Očisti HTML i izvuci tekst
    const cleanedText = cleanHTML(html)
    
    // Izvuci naslov
    const title = extractTitle(html)
    
    // Prebroj reči
    const wordCount = countWords(cleanedText)

    console.log(`✅ Sajt uspešno skinut: ${title} (${wordCount} reči)`)

    return {
      url,
      title,
      text: cleanedText,
      wordCount,
      timestamp: new Date(),
      success: true
    }

  } catch (error) {
    console.error(`❌ Greška pri skidanju ${url}:`, error)
    
    return {
      url,
      title: '',
      text: '',
      wordCount: 0,
      timestamp: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Nepoznata greška'
    }
  }
}

/**
 * Skida HTML sa sajta
 */
async function fetchWebsiteHTML(
  url: string, 
  options: { timeout: number; userAgent: string; maxRetries: number }
): Promise<string | null> {
  const { timeout, userAgent, maxRetries } = options
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Pokušaj ${attempt}/${maxRetries} za ${url}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      
      if (!html || html.length < 100) {
        throw new Error('HTML je previše kratak ili prazan')
      }

      return html

    } catch (error) {
      console.warn(`⚠️ Pokušaj ${attempt} neuspešan:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Čekaj pre sledećeg pokušaja
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  return null
}

/**
 * Očisti HTML i izvuci čist tekst
 */
function cleanHTML(html: string): string {
  console.log('🧹 Čistim HTML...')
  
  let text = html

  // Ukloni HTML tagove
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Ukloni script tagove
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Ukloni style tagove
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '') // Ukloni noscript
  text = text.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // Ukloni iframe-ove
  
  // Ukloni sve HTML tagove
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Dekoduj HTML entitete
  text = decodeHTMLEntities(text)
  
  // Očisti whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  text = text.trim()
  
  // Ukloni prazne linije
  text = text.split('\n').filter(line => line.trim().length > 0).join('\n')
  
  // Očisti previše razmaka
  text = text.replace(/\s{3,}/g, '  ')
  
  return text
}

/**
 * Dekoduje HTML entitete
 */
function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&euro;': '€',
    '&pound;': '£',
    '&cent;': '¢',
    '&deg;': '°',
    '&plusmn;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾'
  }

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entities[entity] || entity
  })
}

/**
 * Izvuci naslov sajta
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // Pokušaj sa h1 ako nema title
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].trim()
  }
  
  return 'Bez naslova'
}

/**
 * Prebroj reči u tekstu
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Proveri da li je URL validan
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Dodaj http:// ako nema protokol
 */
export function normalizeURL(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

/**
 * Test funkcija za proveru modula
 */
export async function testScraper(url: string): Promise<void> {
  console.log('🧪 Testiram scraper...')
  
  const result = await scrapeWebsite(url, { timeout: 15000 })
  
  if (result.success) {
    console.log('✅ Test uspešan!')
    console.log(`📄 Naslov: ${result.title}`)
    console.log(`📊 Reči: ${result.wordCount}`)
    console.log(`📝 Tekst (prvih 200 karaktera):`)
    console.log(result.text.substring(0, 200) + '...')
  } else {
    console.log('❌ Test neuspešan:', result.error)
  }
}
