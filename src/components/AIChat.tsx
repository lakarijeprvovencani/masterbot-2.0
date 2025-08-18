import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../assets/images/logobotprovidan.png'
import { useChat } from '../contexts/ChatContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatProps {
  isControlled?: boolean;
  controlledIsOpen?: boolean;
  onToggle?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isControlled = false, controlledIsOpen = true, onToggle }) => {
  const { profile, userBrain } = useAuth()
  const navigate = useNavigate()
  const { messages, setMessages } = useChat() as { messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>> }
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalIsOpen(prev => !prev);
    }
  };

  const normalizeGreeting = (text: string) => text.replace(/!\s*👋\s*\n+/u, '! 👋 ').replace(/\n+Ja sam Masterbot AI/u, ' Ja sam Masterbot AI')

  const generatePersonalizedMessage = (profile: any, userBrain: any) => {
    const firstName = profile?.full_name?.split(' ')[0] || 'Prijatelju'
    const companyName = userBrain?.company_name || profile?.company_name || 'vaš biznis'
    return `Zdravo ${firstName}! 👋 Ja sam Masterbot AI, vaš lični marketing asistent. Kako mogu da vam pomognem oko ${companyName}?`
  }
  
  useEffect(() => {
    if (profile && userBrain && messages.length === 0) {
      const personalizedMessage = generatePersonalizedMessage(profile, userBrain)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: normalizeGreeting(personalizedMessage),
        timestamp: new Date()
      }])
    } else if (!profile && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: normalizeGreeting(`Zdravo! 👋 Ja sam Masterbot AI, vaš lični marketing asistent. Učitavam vaše podatke...`),
        timestamp: new Date()
      }])
    }
  }, [profile, userBrain, messages.length])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(scrollToBottom, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages((prev: Message[]) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

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
              content: `Ti si Masterbot AI, ekspert za marketing i biznis. Korisnik se zove ${profile?.full_name || 'korisnik'} i ima biznis: ${userBrain?.company_name || profile?.company_name || 'nepoznato'}.
              
              VAŽNO: Kada korisnik traži pomoć za specifične alate (email, social media, SEO), odgovori KRATKO i dodaj navigaciju:
              - Za email: "Naravno! Prebacujem vas na email asistenta... 🔗 NAVIGACIJA: Otvaram email marketing alat..."
              - Za social media: "Super! Vodim vas do social media asistenta... 🔗 NAVIGACIJA: Vodim vas do social media alata..."
              - Za website/SEO: "Odlično! Prebacujem vas na SEO asistenta... 🔗 NAVIGACIJA: Prebacujem vas na SEO alat..."
              
              NE DAVAJ dodatne savete kada prepoznaš potrebu za alat - samo kratko "prebacujem vas" i navigacija!
              Za ostala pitanja, budi konkretan i personalizovan.`
            },
            ...messages.map((msg: Message) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) throw new Error('OpenAI API greška')

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages((prev: Message[]) => [...prev, assistantMessage])

      if (aiResponse.includes('🔗 NAVIGACIJA:')) {
        setTimeout(() => {
          if (aiResponse.includes('email marketing alat')) navigate('/email-marketing')
          else if (aiResponse.includes('social media alat')) navigate('/social-media')
          else if (aiResponse.includes('SEO alat')) navigate('/website-seo')
        }, 1500)
      }
    } catch (error) {
      console.error('Greška pri pozivu OpenAI:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Izvinjavam se, imam tehničke poteškoće. Molim vas pokušajte ponovo.',
        timestamp: new Date()
      }
      setMessages((prev: Message[]) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRestart = () => {
    const confirmed = window.confirm('Da li ste sigurni da želite da restartujete chat?');
    if (!confirmed) return;
    setMessages([]);
    const personalizedMessage = generatePersonalizedMessage(profile as any, userBrain as any)
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: normalizeGreeting(personalizedMessage),
      timestamp: new Date()
    }])
  }
 
  return (
    <div className="bg-[#0D1240]/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-w-3xl mx-auto overflow-hidden font-sans transition-all duration-500">
      <div 
        className="p-5 border-b border-white/10 flex items-center justify-between cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-xl flex items-center justify-center shadow-lg shadow-[#F56E36]/30">
            <img src={logoSrc} alt="Masterbot Logo" className="w-8 h-8"/>
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">Masterbot AI</h3>
            <p className="text-white/60 text-sm">Vaš lični marketing asistent</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-xs text-green-400 font-semibold flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ONLINE</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleRestart(); }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white/90 hover:text-white shadow-md text-xs"
            title="Restartuj chat"
          >
            Restartuj chat
          </button>
          <button className="text-white/70 hover:text-white transition-transform duration-300" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[40rem] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="h-[26rem] overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.map((message: Message) => (
            <div key={message.id} className={`flex items-start gap-4 animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-9 h-9 bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-full flex-shrink-0 flex items-center justify-center shadow-md">
                  <img src={logoSrc} alt="AI" className="w-5 h-5"/>
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#F56E36] to-[#d15a2c] text-white rounded-br-none'
                    : 'bg-[#1E234E]/70 text-white/90 border border-white/10 rounded-bl-none'
                }`}>
                <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-9 h-9 bg-[#1E234E] rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 shadow-md">
                  <span className="text-sm font-bold text-white/70">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4 animate-fade-in-up">
              <div className="w-9 h-9 bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-full flex-shrink-0 flex items-center justify-center shadow-md">
                <img src={logoSrc} alt="AI" className="w-5 h-5"/>
              </div>
              <div className="bg-[#1E234E]/70 text-white/90 border border-white/10 rounded-2xl px-5 py-3.5 shadow-lg rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-white/60">Masterbot kuca...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-5 border-t border-white/10">
          <div className="relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pitajte Masterbota bilo šta..."
              className="w-full bg-[#1E234E]/70 border border-white/15 rounded-xl px-5 py-3.5 pr-28 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50 transition-all duration-300 resize-none scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '150px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChat
