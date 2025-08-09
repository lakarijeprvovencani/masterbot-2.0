import React, { useState } from 'react'
import { ArrowRight, CheckCircle, Building2, Target, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import masterbotLogo from '../assets/images/logobotprovidan.png'

export const OnboardingScreen: React.FC = () => {
  const { profile, updateProfile, signOut } = useAuth()
  const [formData, setFormData] = useState({
    company_name: profile?.company_name || '',
    industry: profile?.industry || '',
  })
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleLogout = async () => {
    await signOut()
  }

  const industries = [
    'E-commerce',
    'SaaS/Tehnologija', 
    'Usluge',
    'Obrazovanje',
    'Zdravstvo',
    'Nekretnine',
    'Finansije',
    'Restoraterstvo',
    'Moda/Lepota',
    'Fitnes/Wellness',
    'Konsalting',
    'Ostalo'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateProfile({
      ...formData,
      onboarding_completed: true
    })

    if (!result.error) {
      setCompleted(true)
      setTimeout(() => {
        // Ovde ćemo kasnije da dodamo redirect na glavnu aplikaciju
        console.log('Onboarding završen - redirect na dashboard')
      }, 2000)
    }

    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4">
        <div className="text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse backdrop-blur-sm border border-white/20 shadow-2xl">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-20 h-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Dobrodošao/la u budućnost!</h1>
          <p className="text-white/70 text-lg">
            Tvoja Masterbot AI revolucija upravo počinje...
          </p>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F56E36]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4 relative">
      {/* Dugme za odjavu */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 group"
      >
        <span className="text-sm font-medium">Odjavi se</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>

      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-18 h-18 object-contain drop-shadow-lg animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Dobrodošao/la, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Spremamo tvoju personalizovanu Masterbot AI platformu
          </p>
          <p className="text-white/60">
            Samo još nekoliko informacija da možemo da ti pružimo najbolje iskustvo
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-3 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[#F56E36]" />
                Naziv kompanije ili biznisa
              </label>
              <input
                type="text"
                name="company_name"
                placeholder="npr. Digital Marketing Agency"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2 text-[#F56E36]" />
                U kojoj industriji radiš?
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="" className="bg-[#040A3E] text-white">Izaberi industriju...</option>
                {industries.map(industry => (
                  <option key={industry} value={industry} className="bg-[#040A3E] text-white">
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gradient-to-r from-[#F56E36]/20 to-[#040A3E]/20 rounded-xl p-6 border border-[#F56E36]/30">
              <div className="flex items-start">
                <Zap className="w-6 h-6 text-[#F56E36] mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Šta te čeka:</h3>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• AI kreiranje i zakazivanje objava za socijalne mreže</li>
                    <li>• Automatsko generiranje vizuala i kreativa</li>
                    <li>• AI fashion modeli za tvoje proizvode</li>
                    <li>• Personalizovani marketing insights i strategije</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.industry}
              className="w-full bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold py-4 rounded-xl hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center group"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Priprema se revolucija...
                </div>
              ) : (
                <>
                  Počni revoluciju
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}