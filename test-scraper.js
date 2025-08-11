/**
 * Test fajl za Website Scraper modul
 * Pokreni sa: node test-scraper.js
 */

// Simuliram browser environment
global.fetch = require('node-fetch')

// Importujemo modul
const { scrapeWebsite, testScraper, isValidURL, normalizeURL } = require('./src/lib/website-scraper.ts')

async function main() {
  console.log('🚀 Testiram Website Scraper modul...\n')
  
  // Test URL validacije
  console.log('1️⃣ Test URL validacije:')
  console.log('tialorens.rs ->', isValidURL('tialorens.rs'))
  console.log('https://tialorens.rs ->', isValidURL('https://tialorens.rs'))
  console.log('invalid-url ->', isValidURL('invalid-url'))
  console.log()
  
  // Test URL normalizacije
  console.log('2️⃣ Test URL normalizacije:')
  console.log('tialorens.rs ->', normalizeURL('tialorens.rs'))
  console.log('https://tialorens.rs ->', normalizeURL('https://tialorens.rs'))
  console.log()
  
  // Test skidanja sajta
  console.log('3️⃣ Test skidanja sajta:')
  try {
    const result = await scrapeWebsite('https://tialorens.rs', { 
      timeout: 15000,
      maxRetries: 2
    })
    
    if (result.success) {
      console.log('✅ Sajt uspešno skinut!')
      console.log(`📄 Naslov: ${result.title}`)
      console.log(`🌐 URL: ${result.url}`)
      console.log(`📊 Broj reči: ${result.wordCount}`)
      console.log(`⏰ Timestamp: ${result.timestamp}`)
      console.log('\n📝 Tekst (prvih 500 karaktera):')
      console.log('─'.repeat(50))
      console.log(result.text.substring(0, 500) + '...')
      console.log('─'.repeat(50))
    } else {
      console.log('❌ Greška pri skidanju:', result.error)
    }
  } catch (error) {
    console.error('💥 Neočekivana greška:', error)
  }
}

// Pokreni test
main().catch(console.error)
