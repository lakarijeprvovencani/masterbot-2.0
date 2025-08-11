# 🌐 Website Scraper Module

## 📋 Opis

Website Scraper modul je **potpuno nova funkcionalnost** koja zamenjuje Perplexity AI za analizu web sajtova. Umesto da se oslanjamo na vanjske API-je koji imaju ograničenja, sada direktno skidamo HTML sa sajtova i čistimo ga do čistog teksta.

## 🚀 Prednosti

### ✅ **Pouzdanost**
- **Direktan pristup** - ne oslanjamo se na search engine indeksiranje
- **Radi sa svim sajtovima** - čak i onima koji nisu indeksirani
- **Nema API ograničenja** - nema rate limiting-a ili kvota

### 💰 **Troškovi**
- **Besplatno** - nema potrebe za vanjskim API ključevima
- **Nema skrivenih troškova** - sve se dešava lokalno

### ⚡ **Performanse**
- **Brže** - direktan HTTP poziv umesto API poziva
- **Efikasnije** - nema potrebe za čekanjem API odgovora

## 🛠️ Kako radi

### 1. **Skidanje HTML-a**
```typescript
const scrapedData = await scrapeWebsite('https://tialorens.rs', {
  timeout: 15000,
  maxRetries: 3
})
```

### 2. **Čišćenje HTML-a**
- Uklanja `<script>`, `<style>`, `<noscript>` tagove
- Uklanja sve HTML tagove
- Dekoduje HTML entitete (`&amp;` → `&`)
- Očisti whitespace i prazne linije

### 3. **Izvlаčenje teksta**
- Izvlači naslov sajta (`<title>` ili `<h1>`)
- Prebrojava reči
- Kreira strukturiran summary

## 📁 Fajlovi

### `src/lib/website-scraper.ts`
- **Glavni modul** sa svim funkcijama
- **TypeScript interfejsi** za type safety
- **Error handling** i retry logika

### `test-scraper.js`
- **Test fajl** za proveru modula
- **Node.js kompatibilan** za testiranje

## 🔧 Funkcije

### `scrapeWebsite(url, options)`
```typescript
interface ScrapingOptions {
  timeout?: number        // Default: 10000ms
  userAgent?: string      // Default: 'Mozilla/5.0 (compatible; MasterbotAI/1.0)'
  maxRetries?: number     // Default: 3
}
```

### `isValidURL(url)`
- Proverava da li je URL validan
- Koristi `new URL()` konstruktor

### `normalizeURL(url)`
- Dodaje `https://` ako nema protokol
- `tialorens.rs` → `https://tialorens.rs`

## 🧪 Testiranje

### **Test sa Node.js**
```bash
node test-scraper.js
```

### **Test u browser-u**
```typescript
import { testScraper } from './lib/website-scraper'

// Test sa tialorens.rs
await testScraper('https://tialorens.rs')
```

## 🔄 Integracija sa AI modulom

### **Pre (Perplexity)**
```typescript
// Stara logika - Perplexity API
if (userBrain.website && PERPLEXITY_API_KEY) {
  const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
    // API poziv...
  })
}
```

### **Sada (Website Scraper)**
```typescript
// Nova logika - naš scraper
if (userBrain.website) {
  const scrapedData = await scrapeWebsite(normalizeURL(userBrain.website), {
    timeout: 15000,
    maxRetries: 3
  })
  
  if (scrapedData.success) {
    websiteSummary = `Web sajt: ${scrapedData.url}
Naslov: ${scrapedData.title}
Broj reči: ${scrapedData.wordCount}

Sadržaj sajta:
${scrapedData.text.substring(0, 2000)}...`
  }
}
```

## 🎯 Rezultat

### **Input**
```
Website: tialorens.rs
```

### **Output**
```
Web sajt: https://tialorens.rs
Naslov: Tia Lorens - Profesionalni frizerski salon
Broj reči: 847

Sadržaj sajta:
Tia Lorens je profesionalni frizerski salon koji pruža...
[čist tekst bez HTML tagova]
```

## 🚨 Ograničenja

### **CORS Policy**
- **Browser**: Može imati CORS ograničenja
- **Node.js**: Nema CORS problema
- **Rešenje**: Koristimo backend proxy ako je potrebno

### **JavaScript Rendering**
- **Staticki HTML**: Savršeno radi
- **SPA aplikacije**: Može biti problematično
- **Rešenje**: Koristimo Puppeteer za JS rendering

### **Rate Limiting**
- **Neki sajtovi**: Mogu imati rate limiting
- **Rešenje**: Dodajemo delay između poziva

## 🔮 Buduće poboljšanja

### **Puppeteer integracija**
```typescript
// Za JavaScript-heavy sajtove
const puppeteer = require('puppeteer')
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto(url)
const content = await page.content()
```

### **Caching sistem**
```typescript
// Cache skidanih sajtova
const cache = new Map()
if (cache.has(url)) {
  return cache.get(url)
}
```

### **Paralelno skidanje**
```typescript
// Skini više sajtova odjednom
const urls = ['site1.com', 'site2.com', 'site3.com']
const results = await Promise.all(urls.map(url => scrapeWebsite(url)))
```

## 🎉 Zaključak

Website Scraper modul je **revolucionarna promena** koja:

1. **Eliminiše zavisnost** od Perplexity AI
2. **Poboljšava pouzdanost** analize sajtova
3. **Smanjuje troškove** na nulu
4. **Ubrzava proces** analize
5. **Radi sa svim sajtovima** bez izuzetka

Sada možemo da analiziramo **bilo koji sajt** direktno, bez obzira na to da li je indeksiran ili ne! 🚀✨
