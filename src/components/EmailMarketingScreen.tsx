import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logoSrc from '../assets/images/logobotprovidan.png';
import mascotImage from '../assets/images/logobotprovidan.png'; // Vraćamo logo
import Sidebar from './Sidebar';
import EmailEditorPanel from './EmailEditorPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface EmailContent {
  subject: string;
  body: string;
}

const EmailMarketingScreen: React.FC = () => {
  const { profile, userBrain, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [activeIdea, setActiveIdea] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && profile) {
      const firstName = profile.full_name?.split(' ')[0] || 'kolega';
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: `Zdravo ${firstName}! 👋 Ja sam tvoj Masterbot Email Asistent. Spreman sam da ti pomognem da kreiraš email kampanje koje donose rezultate. Šta danas pravimo?`
        }
      ]);
    } else if (!authLoading && !profile) {
      // Handle case where user is not logged in or profile is not found
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: 'Zdravo! 👋 Izgleda da niste prijavljeni. Molimo vas da se prijavite kako biste koristili Email Asistenta.'
        }
      ]);
    }
  }, [profile, authLoading]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
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
          messages: [
            {
              role: 'system',
              content: `Ti si Masterbot Email Asistent, ekspert za email marketing. Korisnik se zove ${profile?.full_name} i vodi biznis "${userBrain?.company_name}".
              
              Informacije o biznisu:
              - Industrija: ${userBrain?.industry}
              - Ciljevi: ${userBrain?.goals?.join(', ')}
              - Website: ${userBrain?.website}
              - Analiza: ${userBrain?.analysis?.substring(0, 300)}...
              ${activeIdea ? `\nFokus trenutne kampanje: ${activeIdea}` : ''}

              Tvoj zadatak je da pomogneš korisniku da kreira EFEKTNE email kampanje. Budi kreativan, profesionalan i uvek koristi informacije o biznisu da daš personalizovane savete. Piši naslove (subject), telo emaila, pozive na akciju (CTA), i deli savete o A/B testiranju, segmentaciji i analitici. 
              
              Kada korisnik zatraži da mu se napiše email, UVEK formatiraj odgovor koristeći sledeće tagove:
              [SUBJECT]
              Tvoj naslov ovde
              [/SUBJECT]
              [BODY]
              Tvoje telo emaila ovde
              [/BODY]
              
              Uvek piši na srpskom jeziku.`
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 1000,
        })
      });

      if (!response.ok) throw new Error('OpenAI API greška');

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Parse email content
      const subjectMatch = aiResponse.match(/\[SUBJECT\]\s*([\s\S]*?)\s*\[\/SUBJECT\]/);
      const bodyMatch = aiResponse.match(/\[BODY\]\s*([\s\S]*?)\[\/BODY\]/);

      if (subjectMatch && bodyMatch) {
        setEmailContent({
          subject: subjectMatch[1].trim(),
          body: bodyMatch[1].trim(),
        });

        // Add a confirmation message instead of the full email
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Email je spreman! Možete ga pregledati i izmeniti u editoru sa desne strane. Ako želite nešto drugo, samo mi recite!',
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // If not a structured email, just add the response to the chat
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Greška:', error);
      const errorMessage: Message = { id: 'error', role: 'assistant', content: 'Izvinjavam se, došlo je do greške. Pokušajte ponovo.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = async () => {
    setIsSuggestionLoading(true);
    setSuggestion(null);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert email marketing assistant. Based on the following business profile, please provide a creative and effective email campaign idea, in Serbian.
              
              Business Profile:
              - Name: ${userBrain?.company_name}
              - Industry: ${userBrain?.industry}
              - Goals: ${userBrain?.goals?.join(', ')}
              - Website: ${userBrain?.website}
              
              Please provide a single, actionable email idea that would be compelling to their target audience.`
            }
          ],
          max_tokens: 150,
        })
      });

      if (!response.ok) throw new Error('OpenAI API error');

      const data = await response.json();
      const idea = data.choices[0].message.content;
      setSuggestion(idea);
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      setSuggestion('Žao mi je, trenutno ne mogu da smislim ideju. Molim vas, pokušajte ponovo.');
    } finally {
      setIsSuggestionLoading(false);
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#F56E36] to-[#d15a2c] bg-clip-text text-transparent">Masterbot Email Asistent</h1>
            <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-xs text-green-400 font-semibold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>ONLINE</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <img src={logoSrc} alt="AI" className="w-9 h-9 rounded-full shadow-lg" />}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-xl transition-all duration-300 hover:scale-[1.02] ${msg.role === 'user' ? 'bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                <img src={logoSrc} alt="AI" className="w-9 h-9 rounded-full shadow-lg" />
                <div className="bg-gray-700/50 border border-white/10 rounded-2xl px-5 py-3.5 shadow-xl rounded-bl-none">
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

          <div className="p-6 border-t border-white/10 bg-black/30 relative">
            {suggestion && !activeIdea && (
              <div className="absolute bottom-full left-6 mb-3 w-auto max-w-md bg-gradient-to-br from-[#1E234E] to-[#0D1240] border border-white/10 rounded-2xl shadow-2xl p-5 animate-fade-in-up z-20">
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <h3 className="font-bold text-lg text-white mb-2">💡 Vaša AI-generisana ideja</h3>
                    <p className="text-white/80">{suggestion}</p>
                  </div>
                  <button onClick={() => setSuggestion(null)} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => { setActiveIdea(suggestion); setSuggestion(null); }}
                    className="px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center space-x-2"
                  >
                    <span>Iskoristi ovu ideju</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                </div>
              </div>
            )}
            
            {activeIdea && (
              <div className="absolute bottom-full left-6 right-6 mb-3 bg-[#0D1240]/80 border border-white/10 rounded-xl p-3 flex justify-between items-center z-10 animate-fade-in-up">
                <p className="text-sm text-white/80 truncate pr-4">
                  <span className="font-semibold text-white">Fokus:</span> {activeIdea}
                </p>
                <button onClick={() => setActiveIdea(null)} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Napiši mi promotivni email za..."
                className="w-full bg-white/5 border border-white/15 rounded-xl p-4 pr-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50 transition-all focus:shadow-[0_0_15px_rgba(245,110,54,0.5)]"
                rows={2}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                <button 
                  onClick={handleSuggestion}
                  disabled={isSuggestionLoading}
                  className="text-white/70 hover:text-white transition-all group disabled:opacity-50"
                >
                  {isSuggestionLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/80"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>
                  )}
                </button>
                <button 
                  onClick={handleSendMessage} 
                  disabled={isLoading} 
                  className="text-white/70 hover:text-white disabled:opacity-50 transition-all group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                >
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                    <div className="absolute -inset-2 bg-[#F56E36] rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desna strana - Vizuelni identitet / Editor */}
        <div className="w-3/5 p-8 relative">
          <div className="absolute inset-0 bg-hero-gradient opacity-40 z-0"></div>
          <div className="relative w-full h-full z-10">
            {emailContent ? (
              <EmailEditorPanel
                initialSubject={emailContent.subject}
                initialBody={emailContent.body}
                onClose={() => setEmailContent(null)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img src={mascotImage} alt="Masterbot Mascot" className="max-w-lg w-full animate-fade-in-up transform transition-transform duration-500 hover:scale-105" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmailMarketingScreen;
