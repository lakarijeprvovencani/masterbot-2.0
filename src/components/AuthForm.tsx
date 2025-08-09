import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Chrome, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import masterbotLogo from '../assets/images/logobotprovidan.png'

interface AuthFormProps {
  mode: 'signup' | 'login'
  onModeChange: (mode: 'signup' | 'login') => void
  onSuccess: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange, onSuccess }) => {
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (mode === 'signup') {
        result = await signUp(formData.email, formData.password, formData.fullName)
      } else {
        result = await signIn(formData.email, formData.password)
      }

      if ((result as any)?.error) {
        setError((result as any).error)
      } else {
        onSuccess()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    const result = await signInWithGoogle()
    if ((result as any)?.error) {
      setError((result as any).error)
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Leva strana - Hero sekcija (vidljiva na svim uređajima, centrirana) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#040A3E] to-[#040A3E]/80">
        {/* Dekorativni glowovi – sakriveni na malim ekranima radi performansi */}
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 md:w-96 md:h-96 bg-[#F56E36]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-80 md:h-80 bg-[#F56E36]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex min-h-[45vh] md:min-h-[55vh] lg:min-h-screen w-full items-center justify-center px-6 sm:px-10 md:px-12 text-white">
          <div className="w-full max-w-[720px] flex flex-col items-center text-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-6 sm:mb-8">
              <img
                src={masterbotLogo}
                alt="Masterbot AI"
                className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 ease-in-out hover:scale-105"
                loading="eager"
              />
            </div>

            <h1 className="font-bold leading-tight mb-4 sm:mb-5 text-4xl sm:text-5xl lg:text-6xl">
              <span className="text-[#F56E36]">Masterbot</span>{' '}
              <span className="text-white">AI</span>
            </h1>

            <p className="text-white/80 font-light italic text-lg sm:text-xl mb-3">
              Više ne moraš sve sam.
            </p>

            <p className="text-white/90 font-medium text-base sm:text-lg md:text-xl max-w-[48ch]">
              Tvoj lični marketing asistent uvek dostupan.
            </p>
          </div>
        </div>
      </div>

      {/* Desna strana - Auth forma */}
      <div className="w-full flex items-center justify-center bg-white p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Logo na mobilu iznad naslova */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F56E36]/10 to-[#040A3E]/10 border border-gray-200 shadow">
              <img src={masterbotLogo} alt="Masterbot AI" className="w-full h-full object-contain p-2" />
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#040A3E] mb-2">
              {mode === 'signup' ? 'Kreiraj nalog' : 'Dobrodošao/la nazad'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {mode === 'signup'
                ? 'Počni svoju Masterbot AI revoluciju danas'
                : 'Nastavi sa Masterbot AI tamo gde si stao/la'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#040A3E] mb-2">
                  Puno ime
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Unesite vaše puno ime"
                    required={mode === 'signup'}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#040A3E] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#040A3E] mb-2">
                Email adresa
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  placeholder="vas@email.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#040A3E] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#040A3E] mb-2">
                Lozinka
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Unesite lozinku"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-[#040A3E] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#040A3E] transition-colors"
                  aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F56E36] to-[#F56E36]/90 text-white font-semibold py-3 rounded-xl hover:from-[#F56E36]/90 hover:to-[#F56E36]/80 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:ring-offset-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {mode === 'signup' ? 'Kreiram nalog...' : 'Prijavljujem...'}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center">
                  {mode === 'signup' ? 'Kreiraj nalog' : 'Prijavi se'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ili</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full bg-white border-2 border-gray-200 text-[#040A3E] font-medium py-3 rounded-xl hover:border-[#F56E36] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:ring-offset-2 transition-all"
            >
              <span className="flex items-center justify-center">
                <Chrome className="w-5 h-5 mr-2" />
                Nastavi sa Google
              </span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              {mode === 'signup' ? 'Već imaš nalog?' : 'Nemaš nalog?'}{' '}
              <button
                onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}
                className="text-[#F56E36] font-medium hover:text-[#F56E36]/80 transition-colors focus:outline-none underline-offset-2 hover:underline"
              >
                {mode === 'signup' ? 'Prijavi se' : 'Kreiraj nalog'}
              </button>
            </p>
          </div>

          {mode === 'signup' && (
            <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
              Kreiranjem naloga prihvataš naše{' '}
              <a href="#" className="text-[#F56E36] hover:underline">Uslove korišćenja</a>
              {' '}i{' '}
              <a href="#" className="text-[#F56E36] hover:underline">Politiku privatnosti</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}