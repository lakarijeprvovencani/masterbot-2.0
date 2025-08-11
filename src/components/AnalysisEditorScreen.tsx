import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight } from 'lucide-react'
import masterbotLogo from '../assets/images/logobotprovidan.png'
import { supabase } from '../lib/supabase'

export const AnalysisEditorScreen: React.FC = () => {
  const { user, profile, updateProfile, saveUserBrain } = useAuth()
  const navigate = useNavigate()
  const [analysisText, setAnalysisText] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/onboarding', { replace: true })
      return
    }

    // Učitaj postojeću analizu iz baze
    loadExistingAnalysis()
  }, [user, navigate])



  const loadExistingAnalysis = async () => {
    if (!user?.id) return
    
    try {
      console.log('🔍 Učitavam postojeću analizu iz baze...')
      
      // Učitaj postojeću analizu iz user_brain tabele
      const { data: userBrain, error } = await supabase
        .from('user_brain')
        .select('analysis')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        console.error('❌ Greška pri učitavanju analize:', error)
        setAnalysisText('Greška pri učitavanju analize')
        return
      }
      
      if (userBrain?.analysis) {
        console.log('✅ Analiza učitana iz baze, dužina:', userBrain.analysis.length)
        const cleanedText = cleanMarkdownText(userBrain.analysis)
        setAnalysisText(cleanedText)
      } else {
        console.log('⚠️ Nema analize u bazi')
        setAnalysisText('Nema analize za prikaz')
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju analize:', error)
      setAnalysisText('Greška pri učitavanju analize')
    }
  }

  const cleanMarkdownText = (text: string): string => {
    return text
      .replace(/^###\s*/gm, '') // Ukloni ### na početku redova
      .replace(/\*\*(.*?)\*\*/g, '$1') // Ukloni ** bold markdown
      .replace(/`(.*?)`/g, '$1') // Ukloni ` code markdown
      .replace(/>\s*(.*)/g, '→ $1') // Zameni > sa →
      .trim()
  }

  const formatTextForDisplay = (text: string): string => {
    return text
      .split('\n')
      .map((line, index) => {
        if (line.trim() === '') return ''
        
        // Ako je linija kratka i sadrži samo tekst, dodaj emoji ili stil
        if (line.length < 50 && !line.includes(':')) {
          return `✨ ${line}`
        }
        
        // Ako linija sadrži brojeve na početku, formatiraj kao naslov
        if (/^\d+\./.test(line)) {
          return `🚀 ${line}`
        }
        
        // Ako linija sadrži ključne reči, dodaj odgovarajuće emoji-je
        if (line.toLowerCase().includes('kompanij') || line.toLowerCase().includes('biznis')) {
          return `🏢 ${line}`
        }
        if (line.toLowerCase().includes('proizvod') || line.toLowerCase().includes('uslug')) {
          return `🛍️ ${line}`
        }
        if (line.toLowerCase().includes('publika') || line.toLowerCase().includes('kupc')) {
          return `👥 ${line}`
        }
        if (line.toLowerCase().includes('brend') || line.toLowerCase().includes('pozicij')) {
          return `🎯 ${line}`
        }
        if (line.toLowerCase().includes('prednost') || line.toLowerCase().includes('jedinstven')) {
          return `⭐ ${line}`
        }
        if (line.toLowerCase().includes('marketin') || line.toLowerCase().includes('prilik')) {
          return `📈 ${line}`
        }
        if (line.toLowerCase().includes('resurs') || line.toLowerCase().includes('link')) {
          return `🔗 ${line}`
        }
        if (line.toLowerCase().includes('informacij') || line.toLowerCase().includes('prikupljen')) {
          return `📋 ${line}`
        }
        
        return line
      })
      .filter(line => line !== '')
      .join('\n\n')
  }



  const handleSaveAnalysis = async () => {
    if (!user?.id) return

    console.log('💾 Čuvam korisničke izmene analize...', { 
      analysis_length: analysisText.length,
      user_id: user.id,
      analysis_sample: analysisText.substring(0, 100) + '...'
    })

    setLoading(true)
    try {
      console.log('🚀 Pozivam saveUserBrain...')
      
      // Sačuvaj analizu u bazu
      const result = await saveUserBrain({ analysis: analysisText })
      console.log('📥 saveUserBrain rezultat:', result)
      
      if (result.error) {
        console.error('❌ Greška pri čuvanju analize:', result.error)
        setLoading(false)
        return
      }

      console.log('✅ Analiza uspešno sačuvana u bazi')

      console.log('🚀 Pozivam updateProfile...')
      
      // Označi onboarding završen
      const prof = await updateProfile({ onboarding_completed: true })
      console.log('📥 updateProfile rezultat:', prof)
      
      if (prof.error) {
        console.error('❌ Greška pri ažuriranju profila:', prof.error)
        setLoading(false)
        return
      }

      console.log('✅ Profil označen kao završen')
      console.log('🎉 Onboarding završen - analiza sačuvana i profil kompletiran')
      
      // Pređi na completed ekran
      console.log('🚀 Navigiram na /completed...')
      navigate('/completed', { replace: true })
    } catch (error) {
      console.error('❌ Greška pri čuvanju:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#F56E36]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#F56E36]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#F56E36]/10 to-[#040A3E]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl relative group animate-float">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F56E36] to-[#040A3E] opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <img src={masterbotLogo} alt="Masterbot AI" className="w-20 h-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-[#F56E36] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-[#F56E36] rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-[#F56E36] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 relative cyberpunk-text">
            Sažetak o vašem biznisu
          </h1>
          <p className="text-white/70 text-lg animate-float" style={{ animationDelay: '0.5s' }}>
            Možete menjati i prilagoditi AI generisanu analizu
          </p>
          {/* Decorative elements */}
          <div className="flex justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>

        {/* Editor Container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden glass-dark hover-neon neon-border-focus transition-all duration-300 group">
          {/* Neon border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#F56E36]/20 via-transparent to-[#F56E36]/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"></div>
          
          {/* Editor Header */}
          <div className="mb-6">
            <label className="block text-white font-medium text-lg neon-orange mb-3">
              Vaša AI analiza (možete menjati):
            </label>
          </div>

          {/* Content Area */}
          <div className="relative">
            <textarea
              value={analysisText}
              onChange={(e) => {
                console.log('📝 Text changed, new length:', e.target.value.length)
                setAnalysisText(e.target.value)
              }}
              className="w-full h-96 bg-white/10 border border-white/20 rounded-xl p-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#F56E36] text-lg leading-relaxed resize-none transition-all duration-300 glass futuristic-scrollbar"
              placeholder="Učitavam vašu AI analizu..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/onboarding', { replace: true })}
              className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 hover-neon relative group"
            >
              {/* Neon glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <span className="relative z-10">Nazad</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAnalysis}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group disabled:opacity-60 flex items-center gap-2 hover:scale-105 duration-300 relative overflow-hidden hover-neon"
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F56E36] to-[#040A3E] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              {/* Neon border glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#040A3E] opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-lg"></div>
              <span className="relative z-10">
                {loading ? 'Čuvam...' : 'Sačuvaj i završi'}
              </span>
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
