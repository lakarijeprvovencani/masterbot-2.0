import React, { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, Building2, Target, TrendingUp, Users, Sparkles, Bot, Globe, DollarSign, Megaphone, User2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import masterbotLogo from '../assets/images/logobotprovidan.png'
import { useNavigate } from 'react-router-dom'
import { processOnboardingAnalysis } from '../lib/ai'

export const OnboardingScreen: React.FC = () => {
  const { profile, updateProfile, signOut, saveUserBrain, user } = useAuth() as any
  const [formData, setFormData] = useState({
    company_name: profile?.company_name || '',
    industry: profile?.industry || '',
  })
  const [goals, setGoals] = useState<string[]>([])
  const [website, setWebsite] = useState<string>('')
  const [teamSize, setTeamSize] = useState<string>('')
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('')
  const [heardFrom, setHeardFrom] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisStage, setAnalysisStage] = useState<string>('')
  const [showEditor, setShowEditor] = useState(false)
  const [analysisText, setAnalysisText] = useState('')
  const navigate = useNavigate()

  // Ako nema korisnika, obavezno vrati na početnu (štiti od direktnog / refresh ulaska)
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // Koraci
  const [step, setStep] = useState<number>(1)
  const totalSteps = 4
  const progressPct = Math.round((step / totalSteps) * 100)

  const handleLogout = async () => {
    try {
      console.log('Klik na Odjavi se')
      await signOut()
      navigate('/', { replace: true })
      // Hard redirect kao finalni fallback
      window.location.replace('/')
    } catch (e) {
      console.error('Greška pri odjavi:', e)
      navigate('/', { replace: true })
      window.location.replace('/')
    }
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

  const possibleGoals: { label: string; Icon: React.ComponentType<any> }[] = [
    { label: 'Povećanje prodaje', Icon: TrendingUp },
    { label: 'Više lead-ova', Icon: Users },
    { label: 'Rast na društvenim mrežama', Icon: Target },
    { label: 'Automatizacija sadržaja', Icon: Bot },
    { label: 'Bolji brend identitet', Icon: Sparkles }
  ]

  const teamSizeOptions = ['1', '2-5', '6-10', '11-20', '21-50', '50+']
  const revenueOptions = ['< 1.000 €', '1.000 - 5.000 €', '5.000 - 20.000 €', '20.000 - 100.000 €', '100.000+ €']
  const heardFromOptions = ['Google', 'Društvene mreže', 'Preporuka', 'YouTube/Podcast', 'Email kampanja', 'Drugo']

  const toggleGoal = (value: string) => {
    setGoals(prev => prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value])
  }

  const nextStep = () => setStep(s => Math.min(totalSteps, s + 1))
  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const finishOnboarding = async () => {
    setLoading(true)
    // prikaži animaciju odmah
    setShowAnalysis(true)
    setAnalysisStage('Pripremam podatke...')

    console.log('🎯 Završavam onboarding sa podacima:', { 
      formData, 
      goals, 
      website, 
      teamSize, 
      monthlyRevenue, 
      heardFrom 
    })

    // Sačuvaj samo website ako nije već sačuvan
    if (website) {
      const websiteResult = await saveUserBrain({ website })
      if (websiteResult.error) {
        console.error('❌ Greška pri čuvanju website-a:', websiteResult.error)
      } else {
        console.log('✅ Website uspešno sačuvan')
      }
    }

    // Pozovi AI pipeline
    try {
      if (user?.id) {
        console.log('🚀 Pokrećem AI analizu za user:', user.id)
        setAnalysisStage('Analiziram vaš web sajt (Perplexity AI)...')
        
        const { websiteSummary, analysis } = await processOnboardingAnalysis(user.id, (s) => setAnalysisStage(s))
        console.log('📝 Rezime sajta (Perplexity):', websiteSummary)
        console.log('🤖 OpenAI analiza:', analysis)
        console.log('🔍 Analysis tip:', typeof analysis, 'dužina:', analysis?.length)
        
        if (analysis) {
          setAnalysisText(analysis)
          console.log('✅ AI analiza uspešno generisana, dužina:', analysis.length)
          
          // Sačuvaj analizu u bazu (user_brain.analysis)
          console.log('💾 Čuvam AI analizu u bazu...', { analysis_length: analysis.length })
          console.log('🔍 Prosleđujem analysis:', { analysis: analysis.substring(0, 100) + '...' })
          const res = await saveUserBrain({ analysis })
          console.log('🔍 saveUserBrain rezultat:', res)
          if (res.error) {
            console.error('❌ Greška pri čuvanju analysis polja:', res.error)
          } else {
            console.log('✅ AI analiza uspešno sačuvana u bazu')
          }
        } else {
          console.error('❌ AI analiza nije generisana')
          setAnalysisText('Greška pri generisanju AI analize. Molimo pokušajte ponovo.')
        }
      } else {
        console.error('❌ Nema user ID-a za AI analizu')
        setAnalysisText('Greška: Nema korisnika za analizu.')
      }
    } catch (err) {
      console.error('❌ Greška tokom AI analize:', err)
      setAnalysisText(`Greška pri AI analizi: ${err instanceof Error ? err.message : String(err)}`)
    }
    
    // Nakon AI analize: otvori editor
    console.log('🎯 Završavam AI analizu, otvaram editor...')
    setShowAnalysis(false)
    setShowEditor(true)
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    console.log('📝 Input change:', { name: e.target.name, value: e.target.value })
    setFormData(prev => {
      const newData = {
        ...prev,
        [e.target.name]: e.target.value
      }
      console.log('🔄 New form data:', newData)
      return newData
    })
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4">
        <div className="text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse backdrop-blur-sm border border-white/20 shadow-2xl">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-20 h-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Dobrodošao/la u budućnost!</h1>
          <p className="text-white/70 text-lg">Tvoja Masterbot AI revolucija upravo počinje...</p>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F56E36]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-4 relative">
      {showAnalysis && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md mx-auto text-center p-8 rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 border border-white/20">
              <Globe className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Pripremamo personalizovane preporuke</h2>
            <p className="text-white/80 mb-4">{analysisStage || 'Pokrećem analizu...'}</p>
            <div className="mt-6 h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-2 bg-[#F56E36] animate-[pulse_1.6s_ease-in-out_infinite]" style={{ width: '66%' }} />
            </div>
            <p className="text-white/60 text-xs mt-3">Čitanje sajta i analiza ciljeva uz pomoć AI</p>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-auto p-6 rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-3">Sažetak o vašem biznisu (možete menjati):</h3>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              className="w-full h-72 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#F56E36]"
              placeholder="Ovo je generisani sažetak..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
              >Zatvori</button>
              <button
                type="button"
                onClick={async () => {
                  if (!user?.id) return
                  // Sačuvaj analizu u user_brain.analysis
                  console.log('💾 Čuvam ručno unetu analizu:', { analysis_length: analysisText.length })
                  const result = await saveUserBrain({ analysis: analysisText })
                  if (result.error) {
                    console.error('❌ Greška pri čuvanju analize:', result.error)
                    return
                  }
                  // Označi onboarding završen i pređi dalje
                  const prof = await updateProfile({ ...formData, onboarding_completed: true })
                  if (prof.error) {
                    console.error('❌ Greška pri ažuriranju profila:', prof.error)
                    return
                  }
                  setShowEditor(false)
                  setCompleted(true)
                  console.log('🎉 Onboarding završen - analiza sačuvana i profil kompletiran')
                  
                  // Automatski preusmeri na dashboard nakon 2 sekunde
                  setTimeout(() => {
                    navigate('/dashboard', { replace: true })
                  }, 2000)
                }}
                className="px-5 py-2 rounded-lg bg-[#F56E36] text-white font-semibold hover:bg-[#F56E36]/90"
              >Sačuvaj i nastavi</button>
            </div>
          </div>
        </div>
      )}
      {/* Dugme za odjavu */}
      <button
        type="button"
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 group"
      >
        <span className="text-sm font-medium">Odjavi se</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>

      {/* Progres indikator */}
      <div className="absolute top-6 left-6 right-40 flex items-center space-x-3">
        <button onClick={prevStep} disabled={step === 1} className="text-white/70 hover:text-white disabled:opacity-40">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-2 bg-[#F56E36] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 text-white/70 text-xs">Korak {step} od {totalSteps}</div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-18 h-18 object-contain drop-shadow-lg animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {step === 1 ? (
              <>Dobrodošao/la{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</>
            ) : step === 2 ? (
              <>Hajde da prilagodimo ciljeve</>
            ) : step === 3 ? (
              <>Imate li web sajt?</>
            ) : (
              <>Još par stvari...</>
            )}
          </h1>
          <p className="text-xl text-white/80 mb-2">
            {step === 1 ? 'Spremamo tvoju personalizovanu Masterbot AI platformu' : step === 2 ? 'Recite nam šta vam je najvažnije u narednom periodu' : step === 3 ? 'Unesi URL ili preskoči ako trenutno nemaš' : 'Recite nam veličinu tima, prihode i kako ste čuli za Masterbot'}
          </p>
          <p className="text-white/60">
            {step === 1 ? 'Samo još nekoliko informacija da možemo da ti pružimo najbolje iskustvo' : step === 2 ? 'Možeš izabrati više opcija, kasnije sve možeš promeniti' : step === 3 ? 'Primer: https://tvoja-kompanija.com' : 'Ovi podaci pomažu da prilagodimo predloge i alate'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          {step === 1 && (
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault()
                console.log('🚀 Step 1 submit - početak...')
                console.log('📋 Form data pre validacije:', formData)
                console.log('🔍 Validacija:', { 
                  company_name: !!formData.company_name, 
                  industry: !!formData.industry,
                  company_name_value: formData.company_name,
                  industry_value: formData.industry
                })
                
                if (!formData.company_name || !formData.industry) {
                  console.log('❌ Validacija neuspešna - vraćam')
                  return
                }
                
                console.log('✅ Validacija uspešna - nastavljam')
                console.log('💾 Čuvam brain (step1)...', { formData, user_id: user?.id })
                
                const result = await saveUserBrain({ company_name: formData.company_name, industry: formData.industry })
                
                if (result.error) {
                  console.error('❌ Greška pri čuvanju brain (step1):', result.error)
                  return
                } else {
                  console.log('✅ Brain uspešno sačuvan (step1)')
                }
                
                console.log('🔄 Pre step promene - trenutni step:', step)
                const newStep = Math.min(totalSteps, step + 1)
                console.log('🔄 Postavljam novi step:', newStep)
                setStep(newStep)
                console.log('🔄 Step promenjen na:', newStep)
              }}
              className="space-y-6"
            >
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
                  required
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!formData.company_name || !formData.industry}
                  className="inline-flex items-center bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold px-6 py-3 rounded-xl hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group disabled:opacity-60"
                >
                  Nastavi
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                console.log('💾 Čuvam brain (step2)...', { 
                  goals, 
                  goals_length: goals.length,
                  user_id: user?.id 
                })
                
                if (goals.length === 0) {
                  console.log('⚠️ Nema izabranih ciljeva, ne mogu da nastavim')
                  return
                }
                
                const result = await saveUserBrain({ goals })
                if (result.error) {
                  console.error('❌ Greška pri čuvanju brain (step2):', result.error)
                } else {
                  console.log('✅ Brain uspešno sačuvan (step2)')
                  setStep(s => Math.min(totalSteps, s + 1))
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-white font-medium mb-3">Koji su ti glavni ciljevi?</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {possibleGoals.map(({ label, Icon }) => (
                    <label key={label} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-all flex items-center space-x-3 ${goals.includes(label) ? 'bg-[#F56E36]/20 border-[#F56E36] text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15'}` }>
                      <input type="checkbox" checked={goals.includes(label)} onChange={() => toggleGoal(label)} className="mr-1 align-middle" />
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={prevStep} className="inline-flex items-center text-white/80 hover:text-white">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Nazad
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold px-6 py-3 rounded-xl hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group"
                >
                  Nastavi
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault()
                console.log('💾 Čuvam brain (step3)...', { 
                  website, 
                  website_length: website.length,
                  user_id: user?.id 
                })
                
                if (website.trim() === '') {
                  console.log('⚠️ Website je prazan, preskačem...')
                  setStep(s => Math.min(totalSteps, s + 1))
                  return
                }
                
                console.log('🌐 Sačuvavam website:', website)
                const result = await saveUserBrain({ website })
                if (result?.error) {
                  console.error('❌ Greška pri čuvanju brain (step3):', result.error)
                } else {
                  console.log('✅ Brain uspešno sačuvan (step3)')
                }
                
                console.log('🔄 Prelazim na sledeći korak...')
                setStep(s => Math.min(totalSteps, s + 1))
                console.log('✅ Korak promenjen!')
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-white font-medium mb-3 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-[#F56E36]" />
                  Koji je tvoj web sajt? (opciono)
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://tvoja-kompanija.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={prevStep} className="inline-flex items-center text-white/80 hover:text-white">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Nazad
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => { nextStep() }}
                    className="text-white/80 hover:text-white underline"
                  >
                    Preskoči
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold px-6 py-3 rounded-xl hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group"
                  >
                    Nastavi
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={async (e) => { 
              e.preventDefault()
              console.log('💾 Čuvam brain (step4)...', { 
                teamSize, 
                monthlyRevenue, 
                heardFrom, 
                user_id: user?.id 
              })
              
              console.log('👥 Sačuvavam demografske podatke...')
              // Sačuvaj demografske podatke pre nego što pokreneš AI
              const result = await saveUserBrain({ 
                data: { 
                  team_size: teamSize, 
                  monthly_revenue: monthlyRevenue, 
                  heard_from: heardFrom 
                } 
              })
              
              if (result.error) {
                console.error('❌ Greška pri čuvanju brain (step4):', result.error)
                return // Ne nastavljaj ako ima greške
              } else {
                console.log('✅ Brain uspešno sačuvan (step4)')
              }
              
              console.log('🚀 Pokrećem AI analizu...')
              // Pređi na AI analizu stranicu
              navigate('/ai-analysis', { replace: true })
            }} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-3 flex items-center">
                    <User2 className="w-5 h-5 mr-2 text-[#F56E36]" />
                    Koliko imate zaposlenih?
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all"
                    required
                  >
                    <option value="" className="bg-[#040A3E] text-white">Izaberi...</option>
                    {teamSizeOptions.map(o => (
                      <option key={o} value={o} className="bg-[#040A3E] text-white">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-[#F56E36]" />
                    Koliki su mesečni prihodi?
                  </label>
                  <select
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F56E36] focus:border-transparent transition-all"
                    required
                  >
                    <option value="" className="bg-[#040A3E] text-white">Izaberi...</option>
                    {revenueOptions.map(o => (
                      <option key={o} value={o} className="bg-[#040A3E] text-white">{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-3 flex items-center">
                  <Megaphone className="w-5 h-5 mr-2 text-[#F56E36]" />
                  Kako ste čuli za Masterbot?
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {heardFromOptions.map(opt => (
                    <label key={opt} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-all ${heardFrom === opt ? 'bg-[#F56E36]/20 border-[#F56E36] text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15'}` }>
                      <input type="radio" name="heard_from" className="mr-2" checked={heardFrom === opt} onChange={() => setHeardFrom(opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={prevStep} className="inline-flex items-center text-white/80 hover:text-white">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Nazad
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamSize || !monthlyRevenue || !heardFrom}
                  className="inline-flex items-center bg-gradient-to-r from-[#F56E36] to-[#040A3E] text-white font-semibold px-6 py-3 rounded-xl hover:from-[#F56E36]/90 hover:to-[#040A3E]/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36] transition-all group disabled:opacity-60"
                >
                  {loading ? 'Završavam...' : 'Završi'}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}