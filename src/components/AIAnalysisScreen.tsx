import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { processOnboardingAnalysis } from '../lib/ai'
import masterbotLogo from '../assets/images/logobotprovidan.png'

export const AIAnalysisScreen: React.FC = () => {
  const { user, saveUserBrain, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [analysisStage, setAnalysisStage] = useState<string>('Pripremam podatke...')
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/onboarding', { replace: true })
      return
    }

    // Pokreni AI analizu
    startAIAnalysis()
  }, [user, navigate])

  const startAIAnalysis = async () => {
    try {
      setLoading(true)
      setAnalysisStage('Masterbot analizira vaš posao...')

      // Pozovi AI pipeline
      const { websiteSummary, analysis: aiAnalysis } = await processOnboardingAnalysis(
        user.id, 
        (stage: string) => {
          // Prevedi tehničke poruke u korisničke
          const userFriendlyStage = translateStage(stage)
          setAnalysisStage(userFriendlyStage)
        }
      )

      if (aiAnalysis) {
        setAnalysis(aiAnalysis)
        console.log('✅ AI analiza uspešno generisana, dužina:', aiAnalysis.length)
        
        // Sačuvaj analizu u bazu
        const res = await saveUserBrain({ analysis: aiAnalysis })
        if (res.error) {
          console.error('❌ Greška pri čuvanju analysis polja:', res.error)
        } else {
          console.log('✅ AI analiza uspešno sačuvana u bazu')
        }
        
        // AI analiza završena, ali onboarding nije još završen
        console.log('✅ AI analiza završena, prelazim na editor')
        
        // Pređi na editor nakon 2 sekunde
        setTimeout(() => {
          navigate('/analysis-editor', { replace: true })
        }, 2000)
      } else {
        console.error('❌ AI analiza nije generisana')
        setAnalysisStage('Greška pri generisanju analize')
      }
    } catch (err) {
      console.error('❌ Greška tokom AI analize:', err)
      setAnalysisStage('Greška pri AI analizi')
    } finally {
      setLoading(false)
    }
  }

  const translateStage = (stage: string): string => {
    // Prevedi tehničke poruke u korisničke
    if (stage.includes('Perplexity')) return 'Analiziram vaš web sajt...'
    if (stage.includes('OpenAI')) return 'Generišem personalizovane preporuke...'
    if (stage.includes('Analiza završena')) return 'Analiza završena!'
    return stage
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4">
      <div className="w-full max-w-md mx-auto text-center p-8 rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
        {/* Logo sa animacijom - NE SE VRTI */}
        <div className="w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 border border-white/20 animate-pulse">
          <img 
            src={masterbotLogo} 
            alt="Masterbot AI" 
            className="w-24 h-24 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300" 
          />
        </div>

        {/* Naslov */}
        <h2 className="text-3xl font-bold text-white mb-4">
          Masterbot analizira vaš posao
        </h2>

        {/* Status poruka */}
        <div className="mb-6">
          <p className="text-white/80 text-lg mb-2">
            {analysisStage}
          </p>
          {/* Status indicator */}
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-[#F56E36] rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Progress bar - wow efekti */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6 relative">
          <div className="h-3 bg-gradient-to-r from-[#F56E36] to-[#040A3E] rounded-full transition-all duration-1000 animate-pulse relative">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
          {/* Progress dots */}
          <div className="absolute -top-1 left-0 w-2 h-5 bg-[#F56E36] rounded-full animate-ping"></div>
        </div>

        {/* Opis - wow efekti */}
        <div className="space-y-3">
          <p className="text-white/60 text-sm">
            Masterbot AI analizira vaš posao
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[#F56E36] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Loading animacija - wow efekti */}
        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F56E36]/30 border-t-[#F56E36]"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F56E36] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
