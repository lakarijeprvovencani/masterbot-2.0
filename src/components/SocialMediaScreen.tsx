import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import logoSrc from '../assets/images/logobotprovidan.png';
import mascotImage from '../assets/images/logobotprovidan.png';
import SocialPostPanel, { SocialPost } from './SocialPostPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SocialMediaScreen: React.FC = () => {
  const { profile, userBrain, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialPost, setSocialPost] = useState<SocialPost | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const currentUserMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage };
    setMessages(prev => [...prev, currentUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                response_format: { type: "json_object" },
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
                ],
            })
        });

        const data = await response.json();
        const aiMessageContent = data.choices[0].message.content;
        console.log("Full AI Response:", aiMessageContent);

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
          console.error("Failed to parse AI response as JSON or generate image:", e);
          const newAssistantMessage: Message = { id: Date.now().toString() + 'a', role: 'assistant', content: "Došlo je do greške pri obradi odgovora. Molim vas pokušajte ponovo." };
          setMessages(prev => [...prev, newAssistantMessage]);
        }
    } catch (error) {
        console.error("Error sending message:", error);
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
            <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-xs text-green-400 font-semibold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>ONLINE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <img src={logoSrc} alt="AI" className="w-9 h-9 rounded-full shadow-lg" />}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-xl transition-all duration-300 ${msg.role === 'user' ? 'bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
