/**
 * Backend Server za Website Scraping
 * Rešava CORS problem - skida sajtove sa servera
 */

require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 4001;

// Node.js 18+ ima built-in fetch
// const fetch = globalThis.fetch || require('node-fetch')

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('dist'));
const upload = multer({ storage: multer.memoryStorage() });

// Website Scraper endpoint
app.post('/api/scrape-website', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ error: 'URL je obavezan' })
    }
    
    console.log(`🌐 Skidam sajt: ${url}`)
    
    // Skini HTML sa sajta
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MasterbotAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8'
      },
      timeout: 15000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Očisti HTML
    const cleanedText = cleanHTML(html)
    
    // Izvuci naslov
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Bez naslova'
    
    // Izvuci meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    const description = descMatch ? descMatch[1].trim() : 'Bez opisa'
    
    const result = {
      success: true,
      url,
      title,
      description,
      text: cleanedText,
      wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
      timestamp: new Date()
    }
    
    console.log(`✅ Sajt uspešno skinut: ${title} (${result.wordCount} reči)`)
    res.json(result)
    
  } catch (error) {
    console.error(`❌ Greška pri skidanju ${req.body.url}:`, error)
    res.status(500).json({
      success: false,
      error: error.message,
      url: req.body.url
    })
  }
})

app.post('/api/generate-ideogram-image', async (req, res) => {
  console.log('--- Primljen zahtev za generisanje slike ---');
  console.log('Telo zahteva:', JSON.stringify(req.body, null, 2));

  const { prompt, aspect_ratio, model } = req.body;
  const apiKey = process.env.VITE_IDEOGRAM_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Ideogram API key not configured on the server.' });
  }

  try {
    // 1. Initiate generation
    const genRes = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({ 
        prompt, 
        aspect_ratio, 
        // model: model, // Uklanjamo model, API ga ne zahteva za v3
        rendering_speed: "TURBO" 
      }),
    });

    if (!genRes.ok) {
      const errorBody = await genRes.json();
      console.error('!!! GREŠKA OD IDEOGRAM API-ja !!!');
      console.error(JSON.stringify(errorBody, null, 2));
      return res.status(genRes.status).json(errorBody);
    }

    // Uspeh! V3 API vraća podatke odmah, nema potrebe za "pollingom".
    const genData = await genRes.json();
    
    // Vraćamo odgovor u formatu koji frontend očekuje
    res.json({ images: [{ url: genData.data[0].url }] });

  } catch (error) {
    console.error('Error in Ideogram proxy:', error);
    res.status(500).json({ error: 'Failed to generate image via proxy.' });
  }
});

app.get('/api/proxy-image', async (req, res) => {
  console.log('--- Primljen zahtev za proxy slike ---');
  try {
    const imageUrl = req.query.url;
    console.log('URL slike za proxy:', imageUrl);
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).send('Image URL is required');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');

    const imageSrc = `data:${contentType};base64,${buffer.toString('base64')}`;
    
    res.json({ imageSrc }); // Send as JSON object

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Failed to proxy image');
  }
});

// Ideogram: Replace background (može i "transparent background" za skidanje pozadine)
app.post('/api/ideogram/replace-background', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.VITE_IDEOGRAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Ideogram API key not configured on the server.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (field name: image)' });
    }
    const prompt = req.body.prompt || 'transparent background, remove background';

    const form = new FormData();
    form.append('image', req.file.buffer, { filename: req.file.originalname || 'upload.png', contentType: req.file.mimetype || 'image/png' });
    form.append('prompt', prompt);

    const resp = await fetch('https://api.ideogram.ai/v1/ideogram-v3/replace-background', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error('Ideogram replace-background error:', resp.status, body);
      return res.status(resp.status).send(body);
    }
    const data = await resp.json();
    const url = data?.data?.[0]?.url;
    if (!url) {
      return res.status(500).json({ error: 'No URL returned from Ideogram' });
    }
    res.json({ url });
  } catch (err) {
    console.error('Server error replace-background:', err);
    res.status(500).json({ error: 'Failed to process replace-background' });
  }
});

/**
 * Funkcija za čišćenje HTML-a
 */
function cleanHTML(html) {
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server radi!' })
})

// Start server
app.listen(port, () => {
  console.log(`🚀 Backend server pokrenut na portu ${port}`);
  console.log(`🌐 Website scraper dostupan na: http://localhost:${port}/api/scrape-website`);
});
