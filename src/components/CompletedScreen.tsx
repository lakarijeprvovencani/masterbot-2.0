import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import masterbotLogo from '../assets/images/logobotprovidan.png'

export const CompletedScreen: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Greška pri odjavi:', error)
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4">
      <div className="text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse backdrop-blur-sm border border-white/20 shadow-2xl">
          <img src={masterbotLogo} alt="Masterbot AI" className="w-24 h-24 object-contain drop-shadow-lg" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-6">
          Dobrodošao/la u budućnost! 🚀
        </h1>
        
        <p className="text-white/70 text-xl mb-8 max-w-2xl mx-auto">
          Tvoja Masterbot AI revolucija upravo počinje! 
          <br />
          Analizirali smo tvoj posao i pripremili personalizovane preporuke.
        </p>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h3 className="text-white font-semibold mb-3">Šta je sledeće?</h3>
          <ul className="text-white/80 text-left space-y-2">
            <li>• 📊 Pregledaj svoju AI analizu</li>
            <li>• 🎯 Prilagodi preporuke</li>
            <li>• 🚀 Implementiraj strategije</li>
            <li>• 📈 Prati rezultate</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/analysis-editor', { replace: true })}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 transition-all"
          >
            Pregledaj analizu
          </button>
          
          <button
            onClick={handleLogout}
            className="px-8 py-4 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            Odjavi se
          </button>
        </div>
      </div>
    </div>
  )
}
