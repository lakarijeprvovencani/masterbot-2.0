import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/AuthForm'
import { OnboardingScreen } from './components/OnboardingScreen'
import { AIAnalysisScreen } from './components/AIAnalysisScreen'
import { AnalysisEditorScreen } from './components/AnalysisEditorScreen'
import { CompletedScreen } from './components/CompletedScreen'
import EmailMarketingScreen from './components/EmailMarketingScreen'
import SocialMediaScreen from './components/SocialMediaScreen'
import WebsiteSEOScreen from './components/WebsiteSEOScreen'
import AIChat from './components/AIChat'
import Sidebar from './components/Sidebar'
import BusinessProfileScreen from './components/BusinessProfileScreen'
import { ChatProvider } from './contexts/ChatContext'
import { 
  ProtectedRoute, 
  AuthOnlyRoute, 
  OnboardingRoute, 
  DashboardRoute, 
  PublicRoute 
} from './components/ProtectedRoute'

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  // Ako je korisnik već ulogovan, preusmeri ga
  useEffect(() => {
    // Ne navigiraj dok se ne učitaju svi podaci
    if (loading) return
    
    if (user && profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true })
    } else if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true })
    }
  }, [user, profile, loading, navigate])

  const handleAuthSuccess = () => {
    // Optimistički preusmeri odmah; zaštite ruta će korektno preusmeriti ako onboarding nije završen
    console.log('✅ Auth uspešan – optimistički preusmeravam na dashboard')
    navigate('/dashboard', { replace: true })
  }

  // Prikaži loading samo dok traje globalno učitavanje
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-[#F56E36] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Učitavam vaše podatke...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthForm 
      mode={authMode}
      onModeChange={setAuthMode}
      onSuccess={handleAuthSuccess}
    />
  )
}

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80">
      <Sidebar />
      <div className="pl-20 md:pl-72 py-6 md:py-10 pr-4 md:pr-10 text-white">
        <div className="max-w-6xl mx-auto px-2 md:px-0">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🎯 Masterbot AI Dashboard</h1>
            <p className="text-white/70 mb-10">Dobrodošli u vašu AI marketing platformu!</p>
          </div>
          <div className="mt-4 md:mt-6 mb-10">
            <AIChat />
          </div>
        </div>
      </div>
    </div>
  )
}

const SettingsScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80">
    <Sidebar />
    <div className="pl-20 md:pl-72 py-6 md:py-10 pr-4 md:pr-10 text-white">
      <div className="max-w-6xl mx-auto px-2 md:px-0">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Podesavanja</h1>
        <p className="text-white/70">Ovde ćemo dodati opcije uskoro.</p>
      </div>
    </div>
  </div>
)

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Route - Auth Form */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected Route - Onboarding (zahtevan auth, ali ne i onboarding) */}
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <OnboardingScreen />
          </OnboardingRoute>
        } 
      />
      
      {/* Protected Route - Dashboard (zahtevan auth + onboarding) */}
      <Route 
        path="/dashboard" 
        element={
          <DashboardRoute>
            <Dashboard />
          </DashboardRoute>
        } 
      />
      <Route 
        path="/business-profile" 
        element={
          <DashboardRoute>
            <BusinessProfileScreen />
          </DashboardRoute>
        } 
      />
      
                   {/* Protected Route - AI Analysis (zahtevan auth, ali NE i onboarding) */}
             <Route
               path="/ai-analysis"
               element={
                 <OnboardingRoute>
                   <AIAnalysisScreen />
                 </OnboardingRoute>
               }
             />

             {/* Protected Route - Analysis Editor (zahtevan auth, ali NE i onboarding) */}
             <Route
               path="/analysis-editor"
               element={
                 <OnboardingRoute>
                   <AnalysisEditorScreen />
                 </OnboardingRoute>
               }
             />
      
      {/* Protected Route - Completed (zahtevan auth + onboarding) */}
      <Route 
        path="/completed" 
        element={
          <DashboardRoute>
            <CompletedScreen />
          </DashboardRoute>
        } 
      />
      
      {/* Protected Route - Email Marketing (zahtevan auth + onboarding) */}
      <Route 
        path="/email-marketing" 
        element={
          <DashboardRoute>
            <EmailMarketingScreen />
          </DashboardRoute>
        } 
      />
      
      {/* Protected Route - Social Media Marketing (zahtevan auth + onboarding) */}
      <Route 
        path="/social-media" 
        element={
          <DashboardRoute>
            <SocialMediaScreen />
          </DashboardRoute>
        } 
      />
      
      {/* Protected Route - Website SEO (zahtevan auth + onboarding) */}
      <Route 
        path="/website-seo" 
        element={
          <DashboardRoute>
            <WebsiteSEOScreen />
          </DashboardRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <DashboardRoute>
            <SettingsScreen />
          </DashboardRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<PublicRoute><AuthPage /></PublicRoute>} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppContent />
        </Router>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App