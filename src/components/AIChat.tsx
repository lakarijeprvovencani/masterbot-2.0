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

const AIChat: React.FC = () => {
  const { profile, userBrain } = useAuth()
  const navigate = useNavigate()
  const { messages, setMessages } = useChat() as { messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>> }
  
  // Inicijalizuj personalizovanu početnu poruku
  useEffect(() => {
    console.log('🎯 AIChat useEffect - profile:', profile, 'userBrain:', userBrain, 'messages.length:', messages.length)
    console.log('🎯 AIChat profile details:', profile ? {
      id: profile.id,
      full_name: profile.full_name,
      company_name: profile.company_name,
      industry: profile.industry,
      onboarding_completed: profile.onboarding_completed
    } : 'null')
    
    console.log('🔍 Checking conditions:', {
      hasProfile: !!profile,
      hasUserBrain: !!userBrain,
      messagesLength: messages.length,
      hasLoadingMessage: messages.length === 1 && messages[0]?.content.includes('Učitavam vaše podatke'),
      hasGenericMessage: messages.length === 1 && messages[0]?.content.includes('Kako mogu da vam pomognem oko vaš biznis'),
      shouldCreatePersonalized: profile && userBrain && (messages.length === 0 || (messages.length === 1 && (messages[0]?.content.includes('Učitavam vaše podatke') || messages[0]?.content.includes('Kako mogu da vam pomognem oko vaš biznis'))))
    })
    
    if (profile && userBrain && messages.length === 0) {
      console.log('🎯 Kreiram personalizovanu poruku...')
      const personalizedMessage = generatePersonalizedMessage(profile, userBrain)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: normalizeGreeting(personalizedMessage),
        timestamp: new Date()
      }])
      console.log('✅ Personalizovana poruka kreirana')
    } else if (!profile && messages.length === 0) {
      // Fallback poruka dok se ne učita profile
      console.log('🎯 Kreiram fallback poruku...')
      setMessages([{
        id: '1',
        role: 'assistant',
        content: normalizeGreeting(`Zdravo! 👋 Ja sam Masterbot AI, vaš lični marketing asistent. Učitavam vaše podatke...\n\nMoment, molim vas!`),
        timestamp: new Date()
      }])
      console.log('✅ Fallback poruka kreirana')
    }
    // Migracija starih poruka: normalizuj prvi assistant pozdrav
    if (messages.length > 0 && messages[0].role === 'assistant') {
      const fixed = normalizeGreeting(messages[0].content)
      if (fixed !== messages[0].content) {
        setMessages((prev: Message[]) => {
          const copy = [...prev]
          copy[0] = { ...copy[0], content: fixed }
          return copy
        })
      }
    }
  }, [profile, userBrain, messages.length])

  const generatePersonalizedMessage = (profile: any, userBrain: any) => {
    console.log('🎨 generatePersonalizedMessage - profile:', profile)
    console.log('🎨 generatePersonalizedMessage - userBrain:', userBrain)
    
    const firstName = profile?.full_name?.split(' ')[0] || 'Prijatelju'
    const companyName = userBrain?.company_name || profile?.company_name || 'vaš biznis'
    const industry = userBrain?.industry || profile?.industry || null
    
    console.log('🎨 Extracted data:', { firstName, companyName, industry })
    
    let message = `Zdravo ${firstName}! 👋 Ja sam Masterbot AI, vaš lični marketing asistent. Kako mogu da vam pomognem oko ${companyName}?`
    
    if (industry && industry !== 'nepoznato' && industry !== 'vašoj industriji') {
      message += `\n\nVidim da radite u ${industry} industriji.`
    }
    
    if (userBrain?.analysis || userBrain?.goals || userBrain?.website) {
      message += `\n\n📊 Imam analizu vašeg biznisa i mogu da vam dam personalizovane savete na osnovu:`
      if (userBrain?.goals && userBrain.goals.length > 0) {
        message += `\n🎯 Vaših ciljeva: ${userBrain.goals.join(', ')}`
      }
      if (userBrain?.website) {
        message += `\n🌐 Vašeg sajta: ${userBrain.website}`
      }
    }
    
    console.log('🎨 Generated message:', message)
    return message
  }
  
  const normalizeGreeting = (text: string) => {
    // Spoji pozdrav i uvod u jednu liniju
    return text
      .replace(/!\s*👋\s*\n+/u, '! 👋 ')
      .replace(/\n+Ja sam Masterbot AI/u, ' Ja sam Masterbot AI')
  }
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      // Poziv OpenAI API-ja
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

INDUSTRIJA: ${userBrain?.industry || profile?.industry || 'nepoznato'}

${userBrain?.goals && userBrain.goals.length > 0 ? `CILJEVI: ${userBrain.goals.join(', ')}` : ''}

${userBrain?.website ? `WEBSITE: ${userBrain.website}` : ''}

${userBrain?.analysis ? `ANALIZA: ${userBrain.analysis.substring(0, 500)}...` : ''}

Tvoja uloga je da:
1. Odgovoriš na pitanja o marketingu SPECIFIČNO za njihov biznis
2. Koristiš informacije iz analize za personalizovane savete
3. Prepoznaš kada korisnik traži specifične alate
4. Budiš prijateljski i profesionalan
5. Referenciraj njihov biznis, ciljeve i industriju

VAŽNO: Kada korisnik traži pomoć za specifične alate, odgovori KRATKO i dodaj navigaciju:
- Za email marketing: "Naravno! Sad ću vas prebaciti na Masterbot asistenta za email. Molimo sačekajte... 🔗 NAVIGACIJA: Otvaram vam email marketing alat..."
- Za social media: "Odličo! Vodim vas do našeg social media asistenta. Molimo sačekajte... 🔗 NAVIGACIJA: Vodim vas do social media alata..."
- Za website/SEO: "Savršeno! Prebacujem vas na SEO asistenta. Molimo sačekajte... 🔗 NAVIGACIJA: Prebacujem vas na SEO alat..."

NE DAVAJ dodatne savete ili objašnjenja kada prepoznaš potrebu za alat - samo kratko "prebacujem vas" i navigacija!

Za ostala pitanja, budi konkretan, koristan i personalizovan za njihov specifičan biznis!`
            },
            ...messages.map((msg: Message) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('OpenAI API greška')
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages((prev: Message[]) => [...prev, assistantMessage])

      // Proveri da li AI traži navigaciju na alat
      if (aiResponse.includes('🔗 NAVIGACIJA:')) {
        // Sačekaj malo da korisnik vidi poruku
        setTimeout(() => {
          if (aiResponse.includes('email marketing alat')) {
            navigateToTool('email marketing')
          } else if (aiResponse.includes('social media alat')) {
            navigateToTool('social media')
          } else if (aiResponse.includes('SEO alat')) {
            navigateToTool('website seo')
          }
        }, 2000) // 2 sekunde čekanja
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

  const navigateToTool = (toolType: string) => {
    switch (toolType.toLowerCase()) {
      case 'email marketing':
      case 'email':
        navigate('/email-marketing')
        break
      case 'social media':
      case 'social':
      case 'drustvene mreze':
        navigate('/social-media')
        break
      case 'website':
      case 'seo':
      case 'website seo':
        navigate('/website-seo')
        break
      default:
        console.log('Nepoznat alat:', toolType)
    }
  }

  return (
    <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl max-w-3xl mx-auto overflow-hidden transform hover:scale-[1.01] transition-all duration-500">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#F56E36]/40"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Enhanced Chat Header */}
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#F56E36] via-[#F56E36]/90 to-[#F56E36]/70 rounded-2xl flex items-center justify-center shadow-xl shadow-[#F56E36]/40 transform group-hover:scale-110 transition-all duration-300">
                <img 
                  src={logoSrc} 
                  alt="Masterbot Logo" 
                  className="w-9 h-9 object-contain filter drop-shadow-lg"
                />
              </div>
              {/* Enhanced animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#F56E36]/60 to-transparent rounded-2xl animate-pulse"></div>
              <div className="absolute -inset-2 bg-gradient-to-br from-[#F56E36]/20 to-transparent rounded-3xl animate-ping"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-white font-bold text-2xl tracking-wide bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Masterbot AI</h3>
                <div className="flex space-x-1">
                  <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse shadow-lg"></div>
                  <div className="w-2.5 h-2.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium bg-gradient-to-r from-white/80 to-white/60 bg-clip-text text-transparent">Vaš lični AI marketing asistent</p>
            </div>
            <div className="text-right">
              <div className="px-3 py-1 bg-gradient-to-r from-[#00FF88]/20 to-[#00FF88]/10 rounded-full border border-[#00FF88]/30">
                <div className="text-xs text-[#00FF88] font-mono font-bold flex items-center space-x-1">
                  <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></div>
                  <span>ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Messages */}
        <div className="h-[24rem] md:h-[22rem] overflow-y-auto px-4 md:p-6 space-y-5 bg-gradient-to-b from-transparent via-white/3 to-white/8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 mr-3 mt-1 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#F56E36] to-[#F56E36]/80 rounded-full flex items-center justify-center shadow-xl shadow-[#F56E36]/30 border border-[#F56E36]/50">
                    <img 
                      src={logoSrc} 
                      alt="AI" 
                      className="w-5 h-5 object-contain filter drop-shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 md:px-6 py-4 md:py-5 relative overflow-hidden transform group-hover:scale-[1.02] transition-all duration-300 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#F56E36] via-[#F56E36]/90 to-[#F56E36]/80 text-white shadow-xl shadow-[#F56E36]/40 border border-[#F56E36]/50'
                    : 'bg-gradient-to-r from-white/15 via-white/20 to-white/15 text-white border border-white/30 shadow-xl backdrop-blur-lg'
                }`}
              >
                {/* Futuristic border glow */}
                <div className={`absolute inset-0 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-[#F56E36]/20 to-transparent' 
                    : 'bg-gradient-to-r from-white/10 to-transparent'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="whitespace-pre-wrap text-[0.9rem] md:text-[0.95rem] leading-relaxed font-medium text-shadow-sm">
                    {message.content}
                  </div>
                  <div className={`text-[10px] md:text-xs mt-4 flex items-center justify-between ${
                    message.role === 'user' ? 'text-white/70' : 'text-white/60'
                  }`}>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded-full">
                      {message.timestamp.toLocaleTimeString('sr-RS', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-1 bg-white/15 px-2 py-1 rounded-full border border-white/20">
                        <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse"></div>
                        <span className="text-white/80 text-xs font-bold">AI</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-9 h-9 md:w-10 md:h-10 ml-2 md:ml-3 mt-1 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/20 rounded-full flex items-center justify-center border border-white/40 shadow-lg shadow-white/20">
                    <span className="text-white text-xs md:text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">U</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 md:w-8 md:h-8 mr-3 mt-1">
                <div className="w-6 h-6 bg-gradient-to-br from-[#F56E36] to-[#F56E36]/80 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <img 
                    src={logoSrc} 
                    alt="AI" 
                    className="w-4 h-4 object-contain"
                  />
                </div>
              </div>
              <div className="bg-gradient-to-r from-white/10 via-white/15 to-white/10 text-white border border-white/20 rounded-2xl px-5 py-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-white/70 font-mono">Masterbot kuca...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input */}
        <div className="p-4 md:p-6 border-t border-white/20 bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-sm">
          <div className="flex space-x-3 md:space-x-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#F56E36]/30 to-white/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#F56E36]/10 to-white/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pitajte me bilo šta o marketingu..."
                className="relative w-full bg-white/15 border border-white/30 rounded-2xl px-4 md:px-6 py-3 md:py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50 focus:border-[#F56E36]/50 transition-all duration-300 font-medium backdrop-blur-lg shadow-lg focus:shadow-xl transform focus:scale-[1.01] text-[0.9rem] md:text-[0.95rem]"
                disabled={isLoading}
              />
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
                  <span className="text-white/40 text-xs font-mono">AI</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="relative px-5 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#F56E36] via-[#F56E36]/90 to-[#F56E36]/80 text-white rounded-2xl hover:from-[#F56E36]/90 hover:via-[#F56E36]/80 hover:to-[#F56E36]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#F56E36]/40 hover:shadow-2xl hover:shadow-[#F56E36]/50 group transform hover:scale-105 active:scale-95"
            >
              {/* Enhanced button glow effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F56E36]/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#F56E36]/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
              
              <div className="relative flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-bold">Slanje...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl filter drop-shadow-lg">🚀</span>
                    <span className="font-bold tracking-wide">Pošalji</span>
                  </>
                )}
              </div>
            </button>
          </div>
          
          
        </div>
      </div>
    </div>
  )
}

export default AIChat
