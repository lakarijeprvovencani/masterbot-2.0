import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import masterbotLogo from '../assets/images/logobotprovidan.png'

const WebsiteSEOScreen: React.FC = () => {
  const navigate = useNavigate()
  const [seoType, setSeoType] = useState<'keywords' | 'meta-tags' | 'content' | 'technical'>('keywords')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [seoContent, setSeoContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyzeSEO = async () => {
    if (!websiteUrl) return
    setLoading(true)
    // TODO: Implementirati AI SEO analizu
    setTimeout(() => {
      setSeoContent('AI će ovde analizirati SEO i dati preporuke...')
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
            <img src={masterbotLogo} alt="Masterbot AI" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-4">🌐 Website SEO & Optimizacija</h1>
          <p className="text-white/70 text-lg">Optimizujte vaš website za bolje Google rangiranje sa AI pomoći</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Website URL Input */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🔗 Website URL</h3>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#F56E36]"
              />
            </div>

            {/* SEO Type Selection */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🎯 SEO Analiza</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'keywords', label: 'Keywords', icon: '🔍' },
                  { value: 'meta-tags', label: 'Meta Tags', icon: '🏷️' },
                  { value: 'content', label: 'Content', icon: '📝' },
                  { value: 'technical', label: 'Technical', icon: '⚙️' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSeoType(type.value as any)}
                    className={`p-4 rounded-xl border transition-all ${
                      seoType === type.value
                        ? 'border-[#F56E36] bg-[#F56E36]/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <button
                onClick={handleAnalyzeSEO}
                disabled={loading || !websiteUrl}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#F56E36] to-[#F56E36]/80 text-white font-semibold rounded-xl hover:from-[#F56E36]/90 hover:to-[#F56E36]/70 transition-all disabled:opacity-50"
              >
                {loading ? '🤖 AI analizira...' : '🚀 Analiziraj SEO sa AI'}
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Nazad na Dashboard
              </button>
            </div>
          </div>

          {/* Right Column - SEO Analysis Results */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">📊 SEO Analiza Rezultati</h3>
            <div className="bg-white/10 rounded-xl p-4 min-h-[400px]">
              {seoContent ? (
                <div className="text-white whitespace-pre-wrap">{seoContent}</div>
              ) : (
                <div className="text-white/50 text-center py-20">
                  <div className="text-4xl mb-4">🌐</div>
                  <p>Unesite website URL i izaberite tip SEO analize</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebsiteSEOScreen
