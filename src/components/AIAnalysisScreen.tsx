import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { processOnboardingAnalysis } from '../lib/ai'
import masterbotLogo from '../assets/images/logobotprovidan.png'

export const AIAnalysisScreen: React.FC = () => {
  const { user, saveUserBrain } = useAuth()
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
        {/* Logo sa animacijom */}
        <div className="w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 border border-white/20 animate-pulse">
          <img 
            src={masterbotLogo} 
            alt="Masterbot AI" 
            className="w-24 h-24 object-contain drop-shadow-lg animate-spin-slow" 
          />
        </div>

        {/* Naslov */}
        <h2 className="text-3xl font-bold text-white mb-4">
          Masterbot analizira vaš posao
        </h2>

        {/* Status poruka */}
        <p className="text-white/80 text-lg mb-6">
          {analysisStage}
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
          <div className="h-3 bg-gradient-to-r from-[#F56E36] to-[#040A3E] rounded-full transition-all duration-1000 animate-pulse" />
        </div>

        {/* Opis */}
        <p className="text-white/60 text-sm">
          Čitanje sajta i analiza ciljeva uz pomoć AI
        </p>

        {/* Loading animacija */}
        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F56E36]"></div>
          </div>
        )}
      </div>
    </div>
  )
}
