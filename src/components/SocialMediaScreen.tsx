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
  const { user, profile, userBrain, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialPost, setSocialPost] = useState<SocialPost | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [lastImageFile, setLastImageFile] = useState<File | null>(null);
  // const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false);
  // const [lastBgIntentText, setLastBgIntentText] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Local cache helpers
  const LOCAL_LAST_KEY = 'sm_last_session_id';
  const sessionCacheKey = (id: string) => `sm_session_${id}`;

  const cacheMessagesLocal = (id: string, msgs: Message[]) => {
    try {
      const payload = { updatedAt: Date.now(), messages: msgs };
      localStorage.setItem(sessionCacheKey(id), JSON.stringify(payload));
      localStorage.setItem(LOCAL_LAST_KEY, id);
    } catch {}
  };

  const readMessagesLocal = (id: string): Message[] | null => {
    try {
      const raw = localStorage.getItem(sessionCacheKey(id));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages)) return parsed.messages as Message[];
      return null;
    } catch {
      return null;
    }
  };

  const getFirstName = (): string => {
    const fromProfile = profile?.full_name?.trim() || '';
    const fromUserMeta = (user as any)?.user_metadata?.full_name?.trim() || '';
    const source = fromProfile || fromUserMeta || profile?.email?.split('@')[0] || '';
    const first = source.split(' ')[0]?.trim();
    return first && first.length > 0 ? first : 'kolega';
  };

  const persistMessageDb = async (msg: Message) => {
    try {
      if (!sessionId || !profile?.id) return;
      if (sessionId.startsWith('local_')) return; // skip DB when using local-only session
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: profile.id,
        role: msg.role,
        content: msg.content ?? null,
        type: msg.type ?? null,
        image_url: msg.imageUrl ?? null,
        saved_url: (msg as any).savedUrl ?? null,
      });
    } catch (e) {
      console.warn('persistMessageDb failed', e);
    }
  };

  const isGreeting = (m: Message) => m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('Masterbot Social Media Asistent');

  const dedupeGreetings = (list: Message[]): Message[] => {
    let seen = false;
    return list.filter(m => {
      if (isGreeting(m)) {
        if (seen) return false;
        seen = true;
      }
      return true;
    });
  };

  const pushMessage = (msg: Message, opts?: { persist?: boolean }) => {
    setMessages(prev => {
      if (isGreeting(msg) && prev.some(isGreeting)) return prev;
      const next = dedupeGreetings([...prev, msg]);
      if (sessionId) cacheMessagesLocal(sessionId, next);
      return next;
    });
    if (opts?.persist !== false) persistMessageDb(msg);
  };

  // Sačuvaj stavku u istoriju (Supabase)
  const saveHistory = async (item: {
    type: 'generated' | 'bg_replace';
    title?: string;
    caption?: string;
    hashtags?: string[];
    cta?: string;
    image_url: string;
    size?: '1024x1024' | '1024x1792' | '1792x1024';
  }) => {
    try {
      if (!profile?.id) return;
      const { error } = await supabase.from('post_history').insert({
        user_id: profile.id,
        type: item.type,
        title: item.title ?? null,
        caption: item.caption ?? null,
        hashtags: item.hashtags ?? [],
        cta: item.cta ?? null,
        image_url: item.image_url,
        size: item.size ?? '1024x1024',
      });
      if (error) console.warn('Supabase saveHistory error:', error.message);
    } catch (e) {
      console.warn('Supabase saveHistory failed', e);
    }
  };

  // Učitaj istoriju poslednjih 7 dana (Supabase)
  const loadHistory = async () => {
    try {
      if (!profile?.id) { setHistoryItems([]); return; }
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Supabase loadHistory failed', e);
      setHistoryItems([]);
    }
  };

  // Restartuj chat: obriši poruke iz tekuće sesije i prikaži novi pozdrav
  const restartChat = async () => {
    try {
      if (!sessionId || !profile?.id) return;
      const confirmed = window.confirm('Da li ste sigurni da želite da restartujete chat? Svi prethodni mesidži biće obrisani.');
      if (!confirmed) return;

      // Obriši poruke iz baze (ako nije lokalna sesija)
      if (!sessionId.startsWith('local_')) {
        await supabase.from('chat_messages').delete().eq('session_id', sessionId);
      }

      // Očisti localStorage keš za ovu sesiju
      localStorage.removeItem(sessionCacheKey(sessionId));

      // Resetuj state i dodaj pozdrav
      setMessages([]);
      const firstName = profile.full_name?.split(' ')[0] || 'kolega';
      const greet: Message = {
        id: `greet_${Date.now()}`,
        role: 'assistant',
        content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Social Media Asistent. Spreman sam da ti pomognem da kreiraš objave koje će tvoji pratioci obožavati. Šta danas pravimo?`
      };
      pushMessage(greet);
    } catch (e) {
      console.warn('restartChat failed', e);
    }
  };

  // Initialize or restore session + messages
  useEffect(() => {
    const init = async () => {
      if (authLoading || !profile?.id) return;
      try {
        // Try last session from localStorage
        const last = localStorage.getItem(LOCAL_LAST_KEY);
        if (last) {
          setSessionId(last);
          const cached = readMessagesLocal(last);
          if (cached && cached.length) setMessages(cached.filter((m, i, arr) => {
            // drop duplicate greetings and duplicate ids (like legacy 'initial')
            const firstIndexSameId = arr.findIndex(x => x.id === m.id);
            const isDupId = firstIndexSameId !== i;
            const isGreet = m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('Masterbot Social Media Asistent');
            if (isDupId) return false;
            if (isGreet) {
              const firstGreetIdx = arr.findIndex(x => x.role === 'assistant' && typeof x.content === 'string' && x.content.includes('Masterbot Social Media Asistent'));
              return firstGreetIdx === i;
            }
            return true;
          }));
          // Load from DB and replace (source of truth)
          const { data: rows, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', last)
            .order('created_at', { ascending: true });
          if (!error && Array.isArray(rows)) {
            const loaded: Message[] = rows.map((r: any) => ({
              id: r.id,
              role: r.role,
              content: r.content || '',
              type: r.type || undefined,
              imageUrl: r.image_url || undefined,
              savedUrl: r.saved_url || undefined,
            }));
            if (loaded.length) {
              const deduped = loaded.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
              setMessages(deduped);
              cacheMessagesLocal(last, loaded);
              return;
            }
          }
          // If no DB messages, show greeting
          if (!cached || !cached.length) {
            const firstName = getFirstName();
            const greet: Message = {
              id: `greet_${Date.now()}`,
              role: 'assistant',
              content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Social Media Asistent. Spreman sam da ti pomognem da kreiraš objave koje će tvoji pratioci obožavati. Šta danas pravimo?`
            };
            pushMessage(greet);
          }
          return;
        }

        // Try last session from DB (cross-device continuity)
        const { data: lastSess, error: sessErr } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', profile.id)
          .order('last_message_at', { ascending: false })
          .limit(1);
        if (!sessErr && Array.isArray(lastSess) && lastSess[0]?.id) {
          const sid = lastSess[0].id as string;
          setSessionId(sid);
          localStorage.setItem(LOCAL_LAST_KEY, sid);
          const { data: rows2 } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sid)
            .order('created_at', { ascending: true });
          const loaded2: Message[] = (rows2 || []).map((r: any) => ({
            id: r.id,
            role: r.role,
            content: r.content || '',
            type: r.type || undefined,
            imageUrl: r.image_url || undefined,
            savedUrl: r.saved_url || undefined,
          }));
          if (loaded2.length) {
            const deduped2 = loaded2.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
            setMessages(deduped2);
            cacheMessagesLocal(sid, loaded2);
            return;
          }
        }

        // Create new session
        const { data: created, error: createErr } = await supabase
          .from('chat_sessions')
          .insert({ user_id: profile.id, title: 'Social Media', status: 'active' })
          .select('id')
          .single();
        if (createErr) throw createErr;
        const newId = created.id as string;
        setSessionId(newId);
        localStorage.setItem(LOCAL_LAST_KEY, newId);
        const firstName = getFirstName();
        const greet: Message = {
          id: `greet_${Date.now()}`,
          role: 'assistant',
          content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Social Media Asistent. Spreman sam da ti pomognem da kreiraš objave koje će tvoji pratioci obožavati. Šta danas pravimo?`
        };
        pushMessage(greet);
      } catch (e) {
        console.warn('init session failed', e);
        // Fallback: local-only session
        const localId = `local_${profile.id}_${Date.now()}`;
        setSessionId(localId);
        localStorage.setItem(LOCAL_LAST_KEY, localId);
        const cached = readMessagesLocal(localId);
        if (cached && cached.length) {
          const dedupLocal = cached.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
          setMessages(dedupLocal);
        } else {
          const firstName = getFirstName();
          const greet: Message = {
            id: `greet_${Date.now()}`,
            role: 'assistant',
            content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Social Media Asistent. Spreman sam da ti pomognem da kreiraš objave koje će tvoji pratioci obožavati. Šta danas pravimo?`
          };
          pushMessage(greet, { persist: false });
        }
      }
    };
    init();
  }, [authLoading, profile?.id]);

  // Keep local cache fresh
  useEffect(() => {
    if (sessionId) cacheMessagesLocal(sessionId, messages);
  }, [messages, sessionId]);

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
  /*
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
  */

  // Ukloni sliku iz određene korisničke poruke (bez brisanja teksta)
  const removeImageFromMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, imageUrl: undefined } : m));
  };

  // Ekstrahuj ključne tematske reči iz konteksta (svemir/pustinja/sneg/šuma/plaža...)
  // const extractThemeKeywords = (text: string): string[] => {
  //   const t = (text || '').toLowerCase();
  //   const kws: string[] = [];
  //   if (/(svemir|kosmos|galaks|zvezd)/.test(t)) kws.push('svemir', 'galaksija', 'zvezde');
  //   if (/(pustin|pesak|dine|desert)/.test(t)) kws.push('pustinja', 'pesak', 'dine');
  //   if (/(sneg|zima|winter)/.test(t)) kws.push('sneg', 'zimski ambijent');
  //   if (/(šuma|suma|drve|forest|woods)/.test(t)) kws.push('šuma', 'drveće');
  //   if (/(more|plaža|plaza|ocean|beach)/.test(t)) kws.push('plaža', 'more', 'talasi');
  //   if (/(grad|ulica|city|urban)/.test(t)) kws.push('grad', 'urbani ambijent');
  //   return Array.from(new Set(kws));
  // };

  // Vraća few-shot JSON primer na osnovu teme da izbegnemo generičke fraze
  // const buildThemeFewShot = (themes: string[]) => {
  //   if (themes.includes('pustinja')) {
  //     return { user: 'Primer: Pustinja/dine', assistant: { title: 'Dah pustinje', caption: '...', hashtags: ['#pustinja'], cta: 'Saznaj više', notes: 'Tema: pustinja' } };
  //   }
  //   if (themes.includes('svemir')) {
  //     return { user: 'Primer: Svemir/galaksija', assistant: { title: 'Galaktički sjaj', caption: '...', hashtags: ['#svemir'], cta: 'Saznaj više', notes: 'Tema: svemir' } };
  //   }
  //   return null;
  // };

  // Generiši sadržaj objave analizom slike (GPT-4o, srpski izlaz)
  /*
  const generatePostFromImage = async (imageUrl: string, contextText: string = ''): Promise<SocialPost> => {
    const brandTone = (userBrain as any)?.brand_tone || 'samouvereno, moderno';
    const brandColors = Array.isArray((userBrain as any)?.brand_colors) ? (userBrain as any).brand_colors : ['#040A3E', '#F56E36'];
    const audience = (userBrain as any)?.target_audience || 'opšta publika';
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
  */

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
      pushMessage(msg);
      setLastImageFile(file);
      // context text preserved implicitly in messages
    } catch (e) {
      console.error('replace background error:', e);
      pushMessage({ id: `rb_err_${Date.now()}`, role: 'assistant', content: 'Nije uspela promena pozadine. Pokušajte ponovo.' });
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
      pushMessage(newAssistantMessage);

    } catch (error) {
      console.error("Error generating social post:", error);
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: 'Došlo je do greške prilikom generisanja objave. Proverite server logove za detalje.'
      };
      pushMessage(errorMessage);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const wantsReplaceBg = isReplaceBgRequest(inputMessage);
    const newPostReq = isNewPostRequest(inputMessage);

    // Ako korisnik započinje novu objavu (a ne zamenu pozadine), očisti kontekst prethodne slike
    if (newPostReq && !wantsReplaceBg) {
      setLastImageFile(null);
      // reset implicit context
    }

    // Prikaži sliku u poruci samo ako je nova priložena ili ako se eksplicitno menja pozadina
    const fileForThisMessage = attachedFile || (wantsReplaceBg ? lastImageFile : null);
    const userImageUrl = fileForThisMessage ? URL.createObjectURL(fileForThisMessage) : undefined;
    const currentUserMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage, imageUrl: userImageUrl };
    pushMessage(currentUserMessage);
    // store intent in chat content
    setInputMessage('');
    setIsLoading(true);

    // Ako je zahtev za promenu pozadine → obradi odmah preko Ideogram endpointa
    if (wantsReplaceBg) {
      if (!fileForThisMessage) {
        pushMessage({ id: `need_img_${Date.now()}`, role: 'assistant', content: 'Dodajte sliku pomoću ikone spajalice ispod, pa ponovo pošaljite: “zameni/promeni pozadinu”.' });
        setIsLoading(false);
        return;
      }
      pushMessage({ id: `rb_wait_${Date.now()}`, role: 'assistant', content: 'U redu, menjam pozadinu na fotografiji. Molimo sačekajte…' });
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

        pushMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'U redu, pripremam vašu objavu. Generisanje slike može potrajati 15-20 sekundi...'
        });

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
        pushMessage(newAssistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: 'Došlo je do greške prilikom komunikacije sa AI asistentom. Proverite konzolu za detalje.'
      };
      pushMessage(errorMessage);
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
              <a
                href="/tools/feedback/index.html"
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 text-xs"
              >
                Predlozi i komentari
              </a>
              <button
                onClick={restartChat}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white/90 hover:text-white shadow-md text-xs"
                title="Restartuj chat"
              >
                Restartuj chat
              </button>
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
              <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm">
                <div className="w-full h-full bg-editor-gradient border border-white/10 shadow-2xl p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Istorija (poslednjih 7 dana)</h3>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-white/70 hover:text-white">Zatvori</button>
                  </div>
                  <div className="overflow-auto pr-1 h-[calc(100vh-96px)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {historyItems.map((it) => (
                      <div key={it.id} className="self-start p-3 rounded-xl hover:bg-black/20 transition-colors">
                        <div className="rounded-xl overflow-hidden border border-white/10 mb-2">
                          <img src={it.image_url} className="w-full aspect-square object-cover" />
                        </div>
                        <div className="text-white/90 text-sm truncate mb-1">{it.title || (it.type === 'bg_replace' ? 'Zamenjena pozadina' : 'Generisana objava')}</div>
                        <div className="text-[11px] text-white/50 mb-2">{new Date(it.created_at).toLocaleString()}</div>
                        <div className="flex">
                          <button onClick={() => { setSocialPost({ title: it.title || 'Objava', caption: it.caption || '', hashtags: it.hashtags || [], imageUrl: it.image_url, size: it.size || '1024x1024', cta: it.cta || 'Saznaj više' }); setIsHistoryOpen(false); }} className="w-full text-xs px-2 py-1 rounded bg-white/10 border border-white/15 text-white/80 hover:text-white">Otvori</button>
                        </div>
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
              <SocialPostPanel
                post={socialPost}
                onClose={() => setSocialPost(null)}
                onAutosave={async (patch) => {
                  try {
                    setSocialPost(prev => prev ? { ...prev, ...patch } : prev);
                    if (!profile?.id) return;
                    // Ako imamo historyId (u budućnosti), možemo update; za sada probaj da pronađe poslednji unos sa istim image_url
                    const { data } = await supabase
                      .from('post_history')
                      .select('id')
                      .eq('user_id', profile.id)
                      .eq('image_url', socialPost?.imageUrl || '')
                      .order('created_at', { ascending: false })
                      .limit(1);
                    const recId = data && data[0]?.id;
                    if (recId) {
                      await supabase.from('post_history').update({
                        caption: patch.caption ?? undefined,
                        hashtags: patch.hashtags ?? undefined,
                        cta: patch.cta ?? undefined,
                        title: patch.title ?? undefined,
                      }).eq('id', recId);
                    }
                  } catch (e) {
                    console.warn('autosave history failed', e);
                  }
                }}
              />
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
