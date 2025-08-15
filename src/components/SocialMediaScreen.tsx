import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import logoSrc from '../assets/images/logobotprovidan.png';
import mascotImage from '../assets/images/logobotprovidan.png';
import SocialPostPanel, { SocialPost } from './SocialPostPanel';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'replace_bg_result' | 'remove_bg_result';
  imageUrl?: string; // preview URL (prefer local savedUrl)
  savedUrl?: string; // persisted URL from server
}

const SocialMediaScreen: React.FC = () => {
  const { profile, userBrain, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialPost, setSocialPost] = useState<SocialPost | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [lastImageFile, setLastImageFile] = useState<File | null>(null);
  const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false);
  const [lastBgIntentText, setLastBgIntentText] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && profile) {
      const firstName = profile.full_name?.split(' ')[0] || 'kolega';
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Social Media Asistent. Spreman sam da ti pomognem da kreiraš objave koje će tvoji pratioci obožavati. Šta danas pravimo?`
        }
      ]);
    }
  }, [authLoading, profile]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const systemPrompt = `
Vi ste Masterbot, AI asistent za društvene mreže. Vaš zadatak je da pomognete korisnicima u kreiranju objava za društvene mreže na srpskom jeziku.

Kada korisnik zatraži da se generiše vizual (slika, baner, post, story), vi treba da generišete i sliku i tekstualni sadržaj.

Vaš odgovor MORA biti u formatu JSON objekta koji sadrži sledeća polja: title, caption, hashtags, cta, notes.

Primer odgovora:
{
  "title": "Inspiracija sa plaže",
  "caption": "Pronađi svoju inspiraciju gde god da se nalaziš. Digitalni nomadizam ti pruža slobodu da radiš sa najlepših mesta na svetu. 💻🌊 #digitalninomad #radodkuce #freelancer",
  "hashtags": ["#digitalninomad", "#radodkuce", "#freelancer", "#posaoodkuce", "#inspiracija"],
  "cta": "Saznaj više",
  "notes": "Slika prikazuje opuštajuću atmosferu i slobodu."
}

Ceo tvoj odgovor mora biti samo JSON objekat i ništa više.
`;

  // Detekcija formata po korisničkom zahtevu
  const detectSizeFromText = (text: string): '1024x1024' | '1024x1792' | '1792x1024' => {
    const t = text.toLowerCase();
    // Story/Reel/vertical
    if (/(story|stori|reel|tiktok|vertical|uspravno|9x16|1080x1920)/.test(t)) return '1024x1792';
    // Wide/banner/cover/hero/horizontal
    if (/(baner|banner|cover|kaver|hero|wide|landscape|horizontal|16x9|1920x1080)/.test(t)) return '1792x1024';
    // Default: square post
    if (/(post|instagram post|kvadrat|square|1x1|1080x1080)/.test(t)) return '1024x1024';
    return '1024x1024';
  };

  // Detekcija da li korisnik traži potpuno novu objavu/vizual
  const isNewPostRequest = (text: string) => {
    const t = (text || '').toLowerCase();
    return /(napravi|generiši|generisi|kreiraj).*(post|vizual|sliku|baner|story|kaver|hero)/.test(t);
  };

  // Detekcija zahteva za promenu/zamenu pozadine – robustno i jezički tolerantno
  const isReplaceBgRequest = (text: string) => {
    const t = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // ukloni dijakritike
    // primeri: "zameni pozadinu za pustinju", "promeni mi pozadinu u svemir"
    return /(promeni|zameni|izmeni)\s+(mi\s+)?pozadin[au]/.test(t);
  };

  // Izvuci sirov opis nove pozadine iza konektora (u/za/na/sa...) – bez prevođenja, to radi backend
  const extractBackgroundPrompt = (text: string): string => {
    if (!text) return '';
    const t = text
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    // Uhvati sve posle "pozadina/pozadinu" i opcionalnog konektora
    const m = t.match(/pozadin[au]\s*(?:u|za|na|sa|with|to|in)?\s*(.+)$/i);
    if (m && m[1]) {
      return m[1].replace(/^[,.;:-]+/, '').trim();
    }
    return t;
  };

  // Ukloni sliku iz određene korisničke poruke (bez brisanja teksta)
  const removeImageFromMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, imageUrl: undefined } : m));
  };

  // Ekstrahuj ključne tematske reči iz konteksta (svemir/pustinja/sneg/šuma/plaža...)
  const extractThemeKeywords = (text: string): string[] => {
    const t = (text || '').toLowerCase();
    const kws: string[] = [];
    if (/(svemir|kosmos|galaks|zvezd)/.test(t)) kws.push('svemir', 'galaksija', 'zvezde');
    if (/(pustin|pesak|dine|desert)/.test(t)) kws.push('pustinja', 'pesak', 'dine');
    if (/(sneg|zima|winter)/.test(t)) kws.push('sneg', 'zimski ambijent');
    if (/(šuma|suma|drve|forest|woods)/.test(t)) kws.push('šuma', 'drveće');
    if (/(more|plaža|plaza|ocean|beach)/.test(t)) kws.push('plaža', 'more', 'talasi');
    if (/(grad|ulica|city|urban)/.test(t)) kws.push('grad', 'urbani ambijent');
    return Array.from(new Set(kws));
  };

  // Vraća few-shot JSON primer na osnovu teme da izbegnemo generičke fraze
  const buildThemeFewShot = (themes: string[]) => {
    if (themes.includes('pustinja')) {
      return {
        user: 'Primer: Pustinja/dine',
        assistant: {
          title: 'Dah pustinje',
          caption: 'Zlatne dine i topao vetar stvaraju minimalizam koji privlači pogled. Kontrasti peska i senki daju moćnu eleganciju.',
          hashtags: ['#pustinja', '#dine', '#pesak', '#minimalizam', '#sunce', '#toplina', '#negativanprostor'],
          cta: 'Saznaj više',
          notes: 'Tema: pustinja, dine, zlatni tonovi'
        }
      };
    }
    if (themes.includes('svemir')) {
      return {
        user: 'Primer: Svemir/galaksija',
        assistant: {
          title: 'Galaktički sjaj',
          caption: 'Zvezdana prašina i spirale galaksije oblikuju futurističku energiju vizuala. Osećaj beskraja daje snažan akcenat brendu.',
          hashtags: ['#svemir', '#galaksija', '#zvezde', '#futurizam', '#mistika', '#noćneneon'],
          cta: 'Saznaj više',
          notes: 'Tema: svemir, galaksije'
        }
      };
    }
    if (themes.includes('sneg')) {
      return {
        user: 'Primer: Sneg/zima',
        assistant: {
          title: 'Zimski mir',
          caption: 'Mraz i meko svetlo prave kristalnu atmosferu. Tišina snega pojačava fokus na proizvod i poruku.',
          hashtags: ['#zima', '#sneg', '#mraz', '#tišina', '#minimalno', '#hladniTonovi'],
          cta: 'Saznaj više',
          notes: 'Tema: sneg, zimski ambijent'
        }
      };
    }
    if (themes.includes('šuma')) {
      return {
        user: 'Primer: Šuma/drveće',
        assistant: {
          title: 'Smaragdna tišina',
          caption: 'Zelene krošnje i difuzno svetlo stvaraju prirodan luksuz. Tekst istaknite na prozračnim tamnim površinama.',
          hashtags: ['#šuma', '#priroda', '#drveće', '#svetlost', '#smaragdno', '#eko'],
          cta: 'Saznaj više',
          notes: 'Tema: šuma, priroda'
        }
      };
    }
    return null;
  };

  // Generiši sadržaj objave analizom slike (GPT-4o, srpski izlaz)
  const generatePostFromImage = async (imageUrl: string, contextText: string = ''): Promise<SocialPost> => {
    const brandTone = userBrain?.brand_tone || 'samouvereno, moderno';
    const brandColors = Array.isArray((userBrain as any)?.brand_colors) ? (userBrain as any).brand_colors : ['#040A3E', '#F56E36'];
    const audience = userBrain?.target_audience || 'opšta publika';
    const sys = 'Ti si ekspert za društvene mreže. Odgovaraj isključivo na srpskom i striktno u JSON formatu.';
    const themes = extractThemeKeywords(contextText);
    const banned = 'NE KORISTI generičke fraze u captionu tipa: "Podeli priču sa pratiocima", "Pogledaj novi vizual", "Uživaj u...". Budi konkretan i tematski.';
    const req = `Analiziraj priloženu sliku i generiši: kratki naslov, caption (1–3 rečenice), 8–12 hashtagova (array) i kratak CTA. Vrati TAČNO JSON: {"title":"...","caption":"...","hashtags":["#..."],"cta":"...","notes":"..."}. Uskladi sadržaj sa korisničkim kontekstom: ${contextText}. Tematske ključne reči: [${themes.join(', ')}]. ${banned} U notes sažmi temu i atmosferu. Stil uskladi sa brendom (tone: ${brandTone}, colors: ${brandColors.join(', ')}, audience: ${audience}).`;

    const few = buildThemeFewShot(themes);

    async function callOnce(instruction: string): Promise<any> {
      const baseMessages: any[] = [ { role: 'system', content: sys } ];
      if (few) {
        baseMessages.push({ role: 'user', content: few.user });
        baseMessages.push({ role: 'assistant', content: JSON.stringify(few.assistant) });
      }
      baseMessages.push({
        role: 'user',
        content: [ { type: 'text', text: instruction }, { type: 'image_url', image_url: { url: imageUrl } } ]
      });

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.8,
          response_format: { type: 'json_object' },
          messages: baseMessages
        })
      });
      const data = await resp.json();
      const txt = data?.choices?.[0]?.message?.content || '{}';
      try { return JSON.parse(txt); } catch { return {}; }
    }

    let parsed = await callOnce(req);
    if (!parsed?.caption || !Array.isArray(parsed?.hashtags) || parsed.hashtags.length === 0) {
      const stronger = req + ' OBAVEZNO popuni SVA polja i koristi ključne reči iz konteksta. JSON i NIŠTA DRUGO.';
      parsed = await callOnce(stronger);
    }

    // Normalizacija potencijalno drugačijih ključeva
    const normalizedCaption = parsed?.caption || parsed?.description || parsed?.text || '';
    let normalizedHashtags: string[] = [];
    if (Array.isArray(parsed?.hashtags)) normalizedHashtags = parsed.hashtags;
    else if (typeof parsed?.hashtags === 'string') normalizedHashtags = parsed.hashtags.split(/[\s,]+/).filter(Boolean);
    else if (typeof parsed?.tags === 'string') normalizedHashtags = parsed.tags.split(/[\s,]+/).filter(Boolean);

    const post: SocialPost = {
      title: parsed?.title || 'Objava',
      caption: normalizedCaption || 'Tematski vizual spreman za objavu.',
      hashtags: normalizedHashtags.length ? normalizedHashtags : ['#marketing', '#objava', '#vizual', '#brend', '#inspiracija'],
      imageUrl,
      size: '1024x1024',
      cta: parsed?.cta || 'Saznaj više',
      notes: parsed?.notes || ''
    };
    return post;
  };

  const handleRemoveBackground = async (file: File, userPrompt: string) => {
    try {
      const form = new FormData();
      form.append('image', file);
      // koristimo replace-background sa opisom pozadine
      // Pošalji kompletan korisnički unos → backend GPT izvlači opis pozadine
      form.append('prompt', userPrompt);
      form.append('save', 'true');

      const resp = await fetch('/api/ideogram/replace-background', {
        method: 'POST',
        body: form,
      });
      if (!resp.ok) {
        throw new Error(`replace-background failed: ${resp.status}`);
      }
      const data = await resp.json();
      const previewUrl = data.savedUrl || data.url;
      const msg: Message = {
        id: `rb_${Date.now()}`,
        role: 'assistant',
        content: 'Nova pozadina je spremna. Možete je preuzeti ili koristiti za post.',
        type: 'replace_bg_result',
        imageUrl: previewUrl,
        savedUrl: previewUrl,
      };
      setMessages(prev => [...prev, msg]);
      setLastImageFile(file);
      setLastBgIntentText(userPrompt);
    } catch (e) {
      console.error('replace background error:', e);
      setMessages(prev => [...prev, { id: `rb_err_${Date.now()}`, role: 'assistant', content: 'Nije uspela promena pozadine. Pokušajte ponovo.' }]);
    } finally {
      setAttachedFile(null);
      setIsLoading(false);
    }
  };

  const handleImageGeneration = async (promptForImage: string, size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024', postData: Omit<SocialPost, 'imageUrl' | 'size'>) => {
    try {
      // Forsiramo generisanje BEZ TEKSTA na slici
      const safePrompt = `${promptForImage}. Bez teksta, bez slova, bez natpisa; no text, no letters; čist vizual; ostavi dovoljno negativnog prostora za kasniji tekst.`;
      const response = await fetch('/api/generate-ideogram-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: safePrompt,
          aspect_ratio: size === '1024x1792' ? '9x16' : (size === '1792x1024' ? '16x9' : '1x1'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server proxy error: ${response.status}`);
      }

      const imageData = await response.json();
      const imageUrl = imageData.images[0].url;

      setSocialPost({
        ...postData,
        imageUrl: imageUrl,
        size: size,
      });
      await saveHistory({ type: 'generated', title: postData.title, caption: postData.caption, hashtags: postData.hashtags, cta: postData.cta, image_url: imageUrl, size });

      const newAssistantMessage: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: 'Vaš vizual (bez teksta) i predlozi za objavu su spremni! Pregledajte ih sa desne strane. Ako želite tekst na slici, kliknite “Uredi Sliku” i dodajte ga kroz editor.'
      };
      setMessages(prev => [...prev, newAssistantMessage]);

    } catch (error) {
      console.error("Error generating social post:", error);
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: 'Došlo je do greške prilikom generisanja objave. Proverite server logove za detalje.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const wantsReplaceBg = isReplaceBgRequest(inputMessage);
    const newPostReq = isNewPostRequest(inputMessage);

    // Ako korisnik započinje novu objavu (a ne zamenu pozadine), očisti kontekst prethodne slike
    if (newPostReq && !wantsReplaceBg) {
      setLastImageFile(null);
      setLastBgIntentText('');
    }

    // Prikaži sliku u poruci samo ako je nova priložena ili ako se eksplicitno menja pozadina
    const fileForThisMessage = attachedFile || (wantsReplaceBg ? lastImageFile : null);
    const userImageUrl = fileForThisMessage ? URL.createObjectURL(fileForThisMessage) : undefined;
    const currentUserMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage, imageUrl: userImageUrl };
    setMessages(prev => [...prev, currentUserMessage]);
    setLastBgIntentText(inputMessage);
    setInputMessage('');
    setIsLoading(true);

    // Ako je zahtev za promenu pozadine → obradi odmah preko Ideogram endpointa
    if (wantsReplaceBg) {
      if (!fileForThisMessage) {
        setMessages(prev => [...prev, { id: `need_img_${Date.now()}`, role: 'assistant', content: 'Dodajte sliku pomoću ikone spajalice ispod, pa ponovo pošaljite: “zameni/promeni pozadinu”.' }]);
        setIsLoading(false);
        return;
      }
      setMessages(prev => [...prev, { id: `rb_wait_${Date.now()}`, role: 'assistant', content: 'U redu, menjam pozadinu na fotografiji. Molimo sačekajte…' }]);
      await handleRemoveBackground(fileForThisMessage, currentUserMessage.content);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `
                        Korisnikov zahtev: "${currentUserMessage.content}"
                        
                        Informacije o biznisu korisnika:
                        - Ime kompanije: ${userBrain?.company_name || 'Nije uneto'}
                        - Industrija: ${userBrain?.industry || 'Nije uneto'}
                        - Ciljevi: ${userBrain?.goals?.join(', ') || 'Nisu uneti'}
                      `
            }
          ]
        })
      });

      const data = await response.json();
      const aiMessageContent = data.choices[0].message.content;
      console.log('Full AI Response:', aiMessageContent);

      try {
        const parsedResponse = JSON.parse(aiMessageContent);

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'U redu, pripremam vašu objavu. Generisanje slike može potrajati 15-20 sekundi...'
        }]);

        const promptForImage = parsedResponse.notes || currentUserMessage.content;
        const detectedSize = detectSizeFromText(currentUserMessage.content);

        await handleImageGeneration(
          promptForImage,
          detectedSize,
          parsedResponse
        );
      } catch (e) {
        console.error('Failed to parse AI response as JSON or generate image:', e);
        const newAssistantMessage: Message = { id: Date.now().toString() + 'a', role: 'assistant', content: 'Došlo je do greške pri obradi odgovora. Molim vas pokušajte ponovo.' };
        setMessages(prev => [...prev, newAssistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: 'Došlo je do greške prilikom komunikacije sa AI asistentom. Proverite konzolu za detalje.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen bg-[#040A3E] items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <img src={logoSrc} alt="Loading..." className="w-24 h-24 animate-pulse" />
          <p className="text-xl">Učitavanje vašeg asistenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#040A3E] text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex pl-20 bg-gradient-to-br from-[#040A3E] via-[#0D1240] to-[#040A3E]">
        {/* Leva strana - Chat */}
        <div className="w-2/5 flex flex-col h-full backdrop-blur-xl bg-black/20 border-r border-white/10">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Social Media Asistent</h1>
            <div className="flex items-center gap-3">
              <button onClick={async () => { if (!isHistoryOpen) await loadHistory(); setIsHistoryOpen(prev => !prev); }} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 text-xs">Istorija (7 dana)</button>
              <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-xs text-green-400 font-semibold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>ONLINE</span>
              </div>
            </div>
        </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Istorija - modal */}
            {isHistoryOpen && (
              <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-editor-gradient w-[720px] max-w-[90vw] max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl p-5 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">Istorija (poslednjih 7 dana)</h3>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-white/70 hover:text-white">Zatvori</button>
                  </div>
                  <div className="overflow-auto pr-1 max-h-[65vh] grid grid-cols-1 gap-3">
                    {historyItems.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/10">
                        <img src={it.image_url} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/90 truncate">{it.title || (it.type === 'bg_replace' ? 'Zamenjena pozadina' : 'Generisana objava')}</div>
                          <div className="text-[11px] text-white/50">{new Date(it.created_at).toLocaleString()}</div>
                        </div>
                        <button onClick={() => { setSocialPost({ title: it.title || 'Objava', caption: it.caption || '', hashtags: it.hashtags || [], imageUrl: it.image_url, size: it.size || '1024x1024', cta: it.cta || 'Saznaj više' }); setIsHistoryOpen(false); }} className="text-xs px-2 py-1 rounded bg-white/10 border border-white/15 text-white/80 hover:text-white">Otvori</button>
                      </div>
                    ))}
                    {historyItems.length === 0 && (
                      <div className="text-white/70 text-sm">Još uvek nema sačuvanih stavki u poslednjih 7 dana.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <img src={logoSrc} alt="AI" className="w-9 h-9 rounded-full shadow-lg" />}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-xl transition-all duration-300 ${msg.role === 'user' ? 'bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none'}`}>
                  {(msg.type === 'replace_bg_result' || msg.type === 'remove_bg_result') && msg.imageUrl ? (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <img src={msg.imageUrl} alt="Nova pozadina" className="w-full max-h-72 object-contain rounded-lg border border-white/10" />
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const r = await fetch(msg.imageUrl!);
                              const b = await r.blob();
                              const url = URL.createObjectURL(b);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `slika_nova_pozadina.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error('download error', e);
                            }
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/15"
                        >
                          Preuzmi PNG
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              // Umesto automatskog captiona: prikaži sliku u desnom panelu i savete za unos
                              setSocialPost({
                                title: 'Objava',
                                caption: 'Napišite opis objave ovde…',
                                hashtags: [],
                                imageUrl: msg.imageUrl!,
                                size: '1024x1024',
                                cta: 'Saznaj više',
                                notes: 'Slika sa izmenjenom pozadinom – dodajte caption i heštegove ručno.'
                              });
                              setMessages(prev => [...prev, { id: `used_${Date.now()}`, role: 'assistant', content: 'Sliku sam ubacio u desni panel. Dodajte caption i heštegove po želji – polja su editabilna.' }]);
                              await saveHistory({ type: 'bg_replace', title: 'Objava', caption: '', hashtags: [], cta: 'Saznaj više', image_url: msg.imageUrl!, size: '1024x1024' });
                            } catch (e) {
                              console.error('generate from image error', e);
                              setMessages(prev => [...prev, { id: `gerr_${Date.now()}`, role: 'assistant', content: 'Nije uspelo pripremanje posta. Pokušajte ponovo.' }]);
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#5a67d8] text-white rounded-lg font-semibold"
                        >
                          Iskoristi za post
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.role === 'user' && msg.imageUrl && (
                        <div className="relative">
                          <img src={msg.imageUrl} alt="Priložena slika" className="w-full max-h-72 object-contain rounded-lg border border-white/10" />
                  <button
                            onClick={() => removeImageFromMessage(msg.id)}
                            className="absolute -top-2 -right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 shadow-lg"
                            title="Ukloni sliku"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.415 1.415L11.415 10l4.95 4.95a1 1 0 01-1.415 1.415L10 11.415l-4.95 4.95a1 1 0 01-1.415-1.415L8.585 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd"/></svg>
                  </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-4">
                <img src={logoSrc} alt="AI" className="w-9 h-9 rounded-full shadow-lg" />
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 shadow-xl rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>

          <div className="p-6 border-t border-white/10 bg-black/30">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Napiši mi objavu za Instagram..."
                className="w-full bg-black/20 border border-white/15 rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-[#F56E36]/80 transition-all focus:shadow-[0_0_15px_rgba(245,110,54,0.5)]"
                rows={2}
              />
              {/* Attach image */}
              {/* Floating add-image button above input */}
              <div className="absolute -top-7 left-1 flex items-center gap-2">
                <label className="cursor-pointer text-white/80 hover:text-white bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs shadow-lg backdrop-blur-sm" title="Dodaj sliku">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setAttachedFile(f);
                      if (f) setLastImageFile(f);
                    }}
                  />
                  + Dodaj sliku
                </label>
                {lastImageFile && (
                  <span className="text-[11px] text-white/70 truncate max-w-[160px]">{lastImageFile.name}</span>
                )}
              </div>
              <button onClick={handleSendMessage} disabled={isLoading} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-2-5l7 7-7 7" /></svg>
              </button>
            </div>
            </div>
          </div>

        {/* Desna strana - Post Editor */}
        <div className="w-3/5 p-8 relative">
          <div className="absolute inset-0 bg-hero-gradient opacity-40 z-0"></div>
           <div className="relative w-full h-full z-10 flex items-center justify-center">
            {socialPost ? (
              <SocialPostPanel post={socialPost} onClose={() => setSocialPost(null)} />
            ) : (
              <img src={mascotImage} alt="Masterbot Mascot" className="max-w-lg w-full animate-fade-in-up" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialMediaScreen;
