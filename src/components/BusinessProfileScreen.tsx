import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

const StatCard: React.FC<{label:string; value:string|number}> = ({label, value}) => (
  <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white/80">
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-xs text-white/60">{label}</div>
  </div>
)

const FieldRow: React.FC<{ label: string; value?: string; onChange?: (v: string)=>void }>=({label, value, onChange})=>{
  const [local, setLocal] = useState(value || '')
  useEffect(()=>{ setLocal(value || '') }, [value])
  return (
    <div>
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <input
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50"
        value={local}
        onChange={(e)=>{ setLocal(e.target.value); onChange && onChange(e.target.value) }}
        placeholder={`Unesite ${label.toLowerCase()}`}
      />
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
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80">
      <Sidebar />
      <div className="pl-20 md:pl-72 py-6 md:py-10 pr-4 md:pr-10 text-white">
        <div className="max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">📘 Biznis profil</h1>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F56E36] to-[#F56E36]/80 disabled:opacity-50">{saving ? 'Čuvam...' : 'Sačuvaj'}</button>
          </div>
        </div>

        {/* Header card */}
        <div className="rounded-2xl border border-white/15 bg-white/5 overflow-hidden mb-8">
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <div className="text-sm text-white/60">Naziv</div>
              <div className="text-2xl font-semibold">{companyName || '—'}</div>
              <div className="text-white/60">{website || '—'}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Ciljevi" value={(goals ? goals.split(',').length : 0)} />
              <StatCard label="Sekcije" value={1} />
              <StatCard label="Analiza" value={analysis ? analysis.length : 0} />
            </div>
            <div className="text-right">
              <span className="text-xs text-white/60">Industrija</span>
              <div className="text-lg">{industry || '—'}</div>
            </div>
          </div>
        </div>

        {/* Editor grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-4">
            <FieldRow label="Naziv kompanije" value={companyName} onChange={setCompanyName} />
            <FieldRow label="Industrija" value={industry} onChange={setIndustry} />
            <FieldRow label="Ciljevi (zarezom)" value={goals} onChange={setGoals} />
            <FieldRow label="Website" value={website} onChange={setWebsite} />
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs text-white/60 mb-1">AI analiza (možete ispraviti/obogatiti)</div>
            <textarea
              className="w-full h-72 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/50"
              value={analysis}
              onChange={(e)=>setAnalysis(e.target.value)}
              placeholder="Analiza..."
            />
          </div>
        </div>
        </div>

        {/* Integracije */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Integracije</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Facebook Integracija */}
            <div className="flex-shrink-0 w-64 rounded-2xl border border-white/15 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Facebook</div>
                  <div className="text-xs text-white/60">Nije povezano</div>
                </div>
              </div>
              <p className="text-sm text-white/80">Povežite vaš Facebook nalog za marketing kampanje i analitiku.</p>
            </div>

            {/* Gmail Integracija */}
            <div className="flex-shrink-0 w-64 rounded-2xl border border-white/15 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 18.364V5.457c0-.904.732-1.636 1.636-1.636h20.728c.904 0 1.636.732 1.636 1.636z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Gmail</div>
                  <div className="text-xs text-white/60">Nije povezano</div>
                </div>
              </div>
              <p className="text-sm text-white/80">Povežite vaš Gmail za email marketing i automatske odgovore.</p>
            </div>

            {/* LinkedIn Integracija */}
            <div className="flex-shrink-0 w-64 rounded-2xl border border-white/15 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.032-3.047-1.032 0-1.26 1.317-1.26 3.047v5.569h-3.555V9h3.555v1.561c.881-1.604 2.326-1.96 2.326-1.96s.854-.244 2.326 1.96V9h3.554v11.452zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">LinkedIn</div>
                  <div className="text-xs text-white/60">Nije povezano</div>
                </div>
              </div>
              <p className="text-sm text-white/80">Povežite vaš LinkedIn za B2B marketing i networking kampanje.</p>
            </div>

            {/* Instagram Integracija */}
            <div className="flex-shrink-0 w-64 rounded-2xl border border-white/15 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.323z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Instagram</div>
                  <div className="text-xs text-white/60">Nije povezano</div>
                </div>
              </div>
              <p className="text-sm text-white/80">Povežite vaš Instagram za vizuelni marketing i story kampanje.</p>
            </div>

            {/* Google Analytics Integracija */}
            <div className="flex-shrink-0 w-64 rounded-2xl border border-white/15 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Google Analytics</div>
                  <div className="text-xs text-white/60">Nije povezano</div>
                </div>
              </div>
              <p className="text-sm text-white/80">Povežite vaš Google Analytics za detaljnu analitiku i izveštaje.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessProfileScreen
