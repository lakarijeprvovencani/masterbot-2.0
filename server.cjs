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
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 4001;
const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

// Node.js 18+ ima built-in fetch
// const fetch = globalThis.fetch || require('node-fetch')

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('dist'));
app.use(express.static('public'));
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/api/uploads', express.static(uploadsDir));
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
    let imageUrl = req.query.url;
    console.log('URL slike za proxy:', imageUrl);
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).send('Image URL is required');
    }

    // If local upload path, read from disk
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/api/uploads/')) {
      const fileName = imageUrl.replace('/api/uploads/', '');
      const filePath = require('path').join(uploadsDir, fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Local image not found');
      }
      const buffer = fs.readFileSync(filePath);
      const ext = require('path').extname(filePath).toLowerCase();
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
      const imageSrc = `data:${contentType};base64,${buffer.toString('base64')}`;
      return res.json({ imageSrc });
    }

    // Otherwise fetch remote absolute URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');

    const imageSrc = `data:${contentType};base64,${buffer.toString('base64')}`;
    
    res.json({ imageSrc });

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Failed to proxy image');
  }
});

// Save external image URL to local uploads and return persistent URL
app.post('/api/save-image-by-url', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url is required' });
    const r = await fetch(url);
    if (!r.ok) return res.status(500).json({ error: 'failed to fetch remote image' });
    const contentType = r.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : 'png';
    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `img_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return res.json({ savedUrl: `/api/uploads/${fileName}` });
  } catch (e) {
    console.error('save-image-by-url error:', e);
    res.status(500).json({ error: 'failed to save image' });
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
    // Normalize + translate prompts to English for Ideogram reliability
    const rawPrompt = (req.body.prompt || '').toString();
    let prompt = '';
    try {
      const translated = await translateBackgroundDescription(rawPrompt);
      const normalized = normalizeBgPrompt(translated || rawPrompt);
      prompt = normalized || translated;
    } catch {}
    if (!prompt) {
      prompt = 'Replace the image background only. Keep the subject/foreground unchanged with clean edges. Background: pure white seamless studio background (#FFFFFF). No text.';
    }
    const save = req.body.save === 'true' || req.body.save === true;

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
    if (!save) {
      return res.json({ url });
    }
    // Save to local uploads
    const r = await fetch(url);
    if (!r.ok) return res.status(500).json({ error: 'Failed to fetch ideogram image for saving' });
    const contentType = r.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : 'png';
    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `rb_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return res.json({ url, savedUrl: `/api/uploads/${fileName}` });
  } catch (err) {
    console.error('Server error replace-background:', err);
    res.status(500).json({ error: 'Failed to process replace-background' });
  }
});

// Ideogram: Remove background → vraća PNG sa transparentnom pozadinom
// NOTE: remove-background endpoint uklanjamo (Ideogram nema stabilnu podršku), vraćamo se na replace-background

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

// Normalize Serbian → English for background descriptions
function normalizeBgPrompt(input) {
  try {
    if (!input) return '';
    const norm = (s) => s
      .toLowerCase()
      .replace(/č/g, 'c').replace(/ć/g, 'c')
      .replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj');
    const t = norm(String(input));
    const afterKeyword = (t.match(/pozadin[au]?\s*(.*)$/i) || [,''])[1] || t;
    let raw = afterKeyword
      .replace(/^(neka|neka\s*bude|da\s*bude|bude|stavi|postavi|napravi|na\s*ovoj\s*(slici|fotki|fotografiji)|sa\s*ove\s*(slike|fotke))\s*/i, '')
      .replace(/^(promeni|zameni|izmeni|replace)\s*/i, '')
      .replace(/^(u|za|na|sa|with|to|in)\s*/i, '')
      .replace(/\s*na\s*ovoj\s*(slici|fotki|fotografiji).*$/i, '')
      .trim();

    let englishDesc = '';
    if (/cisto\s*bela|bela|white/.test(raw)) englishDesc = 'pure white seamless studio background (#FFFFFF)';
    else if (/crna|black/.test(raw)) englishDesc = 'pure black seamless studio background (#000000)';
    else if (/zelena|green/.test(raw)) englishDesc = 'solid chroma green background (#00FF00)';
    else if (/plava|blue/.test(raw)) englishDesc = 'solid blue studio background';
    else if (/siva|sivo|grey|gray/.test(raw)) englishDesc = 'solid neutral grey studio background';
    else if (/suma|sume|sumu|šuma|sumi|šumi|drvece|drveca|drvecu|drveća|drvecima|forest|woods/.test(raw)) englishDesc = 'dense forest background with many trees';
    else if (/pustinja|pustinju|pustinjski|pesak|dine|dunes|desert/.test(raw)) englishDesc = 'desert sand dunes under clear sky';
    else if (/sneg|snijeg|snow|winter/.test(raw)) englishDesc = 'snowy winter landscape';
    else if (/svemir|kosmos|galaksija|galaksije|zvezde|zvijezde|nebula|cosmos|galaxy|space/.test(raw)) englishDesc = 'outer space background with stars and galaxies (deep navy/black)';
    else if (/gradijent|gradient/.test(raw)) englishDesc = `soft gradient background (${raw})`;
    else if (raw.length > 0) englishDesc = raw;
    if (!englishDesc) englishDesc = 'pure white seamless studio background (#FFFFFF)';

    const isPlain = /pure\s+white|pure\s+black|solid|gradient|plain|seamless/.test(englishDesc);
    const parts = [
      'Replace the image background only. Keep the subject/foreground unchanged with clean edges.',
      `Background: ${englishDesc}.`,
    ];
    if (isPlain) {
      parts.push('No scenery, no objects, no logos, no text. Plain, uniform background only.');
    } else {
      parts.push('No logos, no text.');
    }
    return parts.join(' ');
  } catch (e) {
    return '';
  }
}

// Translate arbitrary user text to short English background description
async function translateBackgroundDescription(text) {
  try {
    if (!text || !OPENAI_KEY) return '';
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: [
              'You extract ONLY the desired BACKGROUND description from a casual user sentence (often Serbian).',
              'Return a concise English noun-phrase (3-10 words).',
              'Describe only the new background (environment/color/style).',
              'Do NOT mention the subject/person. Do NOT add actions. Do NOT add logos or text.',
              'Output the phrase only, no punctuation, no extra words.'
            ].join(' ')
          },
          { role: 'user', content: 'zameni pozadinu u sneg' },
          { role: 'assistant', content: 'snowy winter landscape' },
          { role: 'user', content: 'promeni pozadinu za pustinju' },
          { role: 'assistant', content: 'desert sand dunes' },
          { role: 'user', content: 'zameni pozadinu neka bude cisto bela' },
          { role: 'assistant', content: 'pure white seamless studio background' },
          { role: 'user', content: 'promeni pozadinu u svemir sa zvezdama i galaksijama' },
          { role: 'assistant', content: 'outer space with stars and galaxies' },
          { role: 'user', content: 'promeni pozadinu u livadu sa travom' },
          { role: 'assistant', content: 'green meadow grass field' },
          { role: 'user', content: String(text) }
        ]
      })
    });
    const data = await resp.json();
    const out = data?.choices?.[0]?.message?.content || '';
    return out.trim();
  } catch (e) {
    return '';
  }
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
