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
        setAnalysisText(userBrain.analysis)
      } else {
        console.log('⚠️ Nema analize u bazi')
        setAnalysisText('Nema analize za prikaz')
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju analize:', error)
      setAnalysisText('Greška pri učitavanju analize')
    }
  }

  const handleSaveAnalysis = async () => {
    if (!user?.id) return

    console.log('💾 Čuvam korisničke izmene analize...', { 
      analysis_length: analysisText.length,
      user_id: user.id 
    })

    setLoading(true)
    try {
      // Sačuvaj analizu u bazu
      const result = await saveUserBrain({ analysis: analysisText })
      if (result.error) {
        console.error('❌ Greška pri čuvanju analize:', result.error)
        return
      }

      console.log('✅ Analiza uspešno sačuvana u bazu')

      // Označi onboarding završen
      const prof = await updateProfile({ onboarding_completed: true })
      if (prof.error) {
        console.error('❌ Greška pri ažuriranju profila:', prof.error)
        return
      }

      console.log('✅ Profil označen kao završen')
      console.log('🎉 Onboarding završen - analiza sačuvana i profil kompletiran')
      
      // Pređi na completed ekran
      navigate('/completed', { replace: true })
    } catch (error) {
      console.error('❌ Greška pri čuvanju:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-16 h-16 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Sažetak o vašem biznisu
          </h1>
          <p className="text-white/70 text-lg">
            Možete menjati i prilagoditi AI generisanu analizu
          </p>
        </div>

        {/* Editor */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Vaša AI analiza (možete menjati):
            </label>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              className="w-full h-96 bg-white/10 border border-white/20 rounded-xl p-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#F56E36] text-lg leading-relaxed"
              placeholder="Učitavam vašu AI analizu..."
            />
          </div>

          {/* Dugmad */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/onboarding', { replace: true })}
              className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              Nazad
            </button>
            <button
              type="button"
              onClick={handleSaveAnalysis}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? 'Čuvam...' : 'Sačuvaj i završi'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
