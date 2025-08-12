import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

const StatCard: React.FC<{label:string; value:string|number; icon: React.ReactNode}> = ({label, value, icon}) => (
  <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 shadow-lg overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F56E36]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="text-[#F56E36] mb-2">{icon}</div>
      <div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/60">{label}</div>
      </div>
    </div>
  </div>
)

const FieldRow: React.FC<{ label: string; value?: string; onChange?: (v: string)=>void; as?: 'input' | 'textarea' }>=({label, value, onChange, as = 'input'})=>{
  const [local, setLocal] = useState(value || '')
  useEffect(()=>{ setLocal(value || '') }, [value])
  
  const commonProps = {
    className: "w-full bg-[#0D1240]/60 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50 transition-all duration-300 focus:shadow-[0_0_15px_rgba(245,110,54,0.5)]",
    value: local,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ setLocal(e.target.value); onChange && onChange(e.target.value) },
    placeholder: `Unesite ${label.toLowerCase()}`
  }

  return (
    <div>
      <label className="text-sm font-medium text-white/70 mb-2 block">{label}</label>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={8} />
      ) : (
        <input {...commonProps} />
      )}
    </div>
  )
}

const BusinessProfileScreen: React.FC = () => {
  const { profile, userBrain, saveUserBrain, updateProfile } = useAuth() as any
  const [companyName, setCompanyName] = useState<string>('')
  const [industry, setIndustry] = useState<string>('')
  const [goals, setGoals] = useState<string>('')
  const [website, setWebsite] = useState<string>('')
  const [analysis, setAnalysis] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCompanyName(userBrain?.company_name || profile?.company_name || '')
    setIndustry(userBrain?.industry || profile?.industry || '')
    setGoals(Array.isArray(userBrain?.goals) ? userBrain.goals.join(', ') : (userBrain?.goals || ''))
    setWebsite(userBrain?.website || '')
    setAnalysis(userBrain?.analysis || '')
  }, [profile, userBrain])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserBrain({
        company_name: companyName || undefined,
        industry: industry || undefined,
        goals: goals ? goals.split(',').map((s)=>s.trim()).filter(Boolean) : undefined,
        website: website || undefined,
        analysis: analysis || undefined,
      })
      if (industry && industry !== profile?.industry) {
        await updateProfile({ industry })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#0D1240] to-[#040A3E]">
      <Sidebar />
      <div className="pl-20 md:pl-72 py-10 pr-4 md:pr-10 text-white font-sans">
        <div className="max-w-7xl mx-auto px-2 md:px-0">
        
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Biznis profil</h1>
            <p className="text-white/50 mt-1">Pregledajte i upravljajte podacima o vašem biznisu.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white font-semibold shadow-lg shadow-[#F56E36]/20 hover:opacity-90 transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(245,110,54,0.5)] focus:shadow-[0_0_15px_rgba(245,110,54,0.5)] focus:outline-none"
          >
            {saving ? 'Čuvam...' : 'Sačuvaj izmene'}
          </button>
        </header>

        {/* Header card */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#1E234E]/70 to-transparent p-8 mb-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="col-span-1">
              <div className="text-sm text-white/60">Naziv kompanije</div>
              <div className="text-3xl font-bold">{companyName || '—'}</div>
              <a href={website} target="_blank" rel="noreferrer" className="text-white/60 hover:text-[#F56E36] transition-colors">{website || 'Nema sajta'}</a>
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <StatCard label="Ciljevi" value={(goals ? goals.split(',').length : 0)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
              <StatCard label="Industrija" value={industry || '—'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4" /></svg>} />
              <StatCard label="Analiza" value={analysis ? 'Kreirana' : 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
            </div>
          </div>
        </div>

        {/* Editor grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 bg-[#0D1240]/60 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
            <FieldRow label="Naziv kompanije" value={companyName} onChange={setCompanyName} />
            <FieldRow label="Industrija" value={industry} onChange={setIndustry} />
            <FieldRow label="Ciljevi (odvojeni zarezom)" value={goals} onChange={setGoals} />
            <FieldRow label="Website" value={website} onChange={setWebsite} />
          </div>
          <div className="lg:col-span-3 bg-[#0D1240]/60 border border-white/10 rounded-2xl p-6 shadow-xl">
            <FieldRow label="AI analiza (možete ispraviti/obogatiti)" value={analysis} onChange={setAnalysis} as="textarea" />
          </div>
        </div>
        
        {/* Integrations - Unchanged */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Integracije</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Facebook */}
            <IntegrationCard icon={<svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>} title="Facebook" description="Povežite za marketing kampanje i analitiku." color="bg-blue-600" />
            {/* Gmail */}
            <IntegrationCard icon={<svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 18.364V5.457c0-.904.732-1.636 1.636-1.636h20.728c.904 0 1.636.732 1.636 1.636z"/></svg>} title="Gmail" description="Povežite za email marketing i automatske odgovore." color="bg-red-500" />
            {/* LinkedIn */}
            <IntegrationCard icon={<svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.032-3.047-1.032 0-1.26 1.317-1.26 3.047v5.569h-3.555V9h3.555v1.561c.881-1.604 2.326-1.96 2.326-1.96s.854-.244 2.326 1.96V9h3.554v11.452zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>} title="LinkedIn" description="Povežite za B2B marketing i networking." color="bg-blue-700" />
            {/* Instagram */}
            <IntegrationCard icon={<svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16a4 4 0 100-8 4 4 0 000 8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 16V8a5 5 0 015-5h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 6.5h.01" /></svg>} title="Instagram" description="Povežite za vizuelni marketing i story kampanje." color="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
            {/* Google Analytics */}
            <IntegrationCard icon={<svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>} title="Google Analytics" description="Povežite za detaljnu analitiku i izveštaje." color="bg-orange-500" />
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

const IntegrationCard: React.FC<{icon: React.ReactNode; title: string; description: string; color: string}> = ({icon, title, description, color}) => (
  <div className="relative rounded-2xl border border-white/10 bg-[#0D1240]/60 p-6 group hover:border-[#F56E36]/50 transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className="font-semibold text-lg">{title}</div>
        <div className="text-xs text-white/60">Nije povezano</div>
      </div>
    </div>
    <p className="text-sm text-white/80">{description}</p>
  </div>
)

export default BusinessProfileScreen
