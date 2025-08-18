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
import WelcomeMascot from './components/WelcomeMascot' // Importuj novu komponentu
import OnboardingPointer from './components/OnboardingPointer' // Importuj novu komponentu
import { ChatProvider } from './contexts/ChatContext'
import { 
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
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Korisnik';
  
  const [tourStep, setTourStep] = useState(localStorage.getItem('onboardingTourCompleted') ? 0 : 1);
  const [isChatOpenForTour, setIsChatOpenForTour] = useState(false);

  const startTour = () => setTourStep(2);
  const nextTourStep = () => setTourStep(prev => prev + 1);
  const endTour = () => {
    setTourStep(4); // Završni korak sa maskotom
    setTimeout(() => {
      setTourStep(0);
      localStorage.setItem('onboardingTourCompleted', 'true');
    }, 4000); // Maskota ostaje 4 sekunde
  };
  const skipTour = () => {
    setTourStep(0);
    localStorage.setItem('onboardingTourCompleted', 'true');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#0D1240] to-[#040A3E]">
      {tourStep >= 1 && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"></div>}
      
      <div className={tourStep >= 2 && tourStep < 4 ? 'relative z-50' : ''}>
        <Sidebar />
      </div>

      <div className="pl-20 md:pl-72 py-10 pr-4 md:pr-10 text-white font-sans">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-2 animate-fade-in-down">
              Masterbot AI Dashboard
            </h1>
            <p className="text-white/60 text-lg animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
              Dobrodošli u vašu AI marketing platformu!
            </p>
          </header>
          <div className={`animate-fade-in-up ${tourStep >= 2 ? 'relative z-50' : ''}`} style={{ animationDelay: '0.4s' }}>
            <AIChat 
              isControlled={tourStep > 1} 
              controlledIsOpen={isChatOpenForTour} 
              onToggle={() => {
                if(tourStep === 2) {
                  setIsChatOpenForTour(true);
                  nextTourStep();
                }
              }} 
            />
          </div>
        </div>
      </div>
      
      {tourStep === 1 && <WelcomeMascot firstName={firstName} onStartTour={startTour} mode="welcome" />}

      {tourStep === 2 && (
        <OnboardingPointer
          text="Ovde otvaraš i zatvaraš AI chat. Hajde, klikni da ga otvoriš!"
          onNext={() => { setIsChatOpenForTour(true); nextTourStep(); }}
          onDismiss={skipTour}
          position={{ top: 'calc(50% - 150px)', left: 'calc(50% + 230px)' }}
          arrowPosition="left"
        />
      )}

      {tourStep === 3 && (
        <OnboardingPointer
          text="Odlično! Ovde možeš da me pitaš bilo šta. Probaj da ukucaš 'Kako da unapredim svoj marketing?'"
          onNext={endTour}
          onDismiss={skipTour}
          nextButtonText="Završi vodič"
          position={{ bottom: '180px', left: 'calc(50% - 150px)' }}
          arrowPosition="bottom"
        />
      )}

      {tourStep === 4 && <WelcomeMascot firstName={firstName} mode="goodbye" />}
    </div>
  )
}

const SettingsScreen: React.FC = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleResetMascot = () => {
    localStorage.removeItem('onboardingTourCompleted');
    alert('Vodič dobrodošlice će se ponovo pojaviti pri sledećoj poseti dashboardu.');
  };

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (e) {
      console.warn('signOut error', e)
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#0D1240] to-[#040A3E]">
      <Sidebar />
      <div className="pl-20 md:pl-72 py-10 pr-4 md:pr-10 text-white font-sans">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Podešavanja</h1>
            <p className="text-white/50 mt-1">Upravljajte vašim nalogom i podešavanjima aplikacije.</p>
          </header>
          
          <div className="bg-[#0D1240]/60 border border-white/10 rounded-2xl p-6 space-y-8">
            <h2 className="text-xl font-semibold mb-4">Pomoćnik Dobrodošlice</h2>
            <p className="text-white/70 mb-4">Ako želite da ponovo vidite poruku dobrodošlice od našeg AI pomoćnika, kliknite na dugme ispod.</p>
            <button 
              onClick={handleResetMascot}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#F56E36]/80 to-[#d15a2c]/80 text-white font-semibold hover:opacity-90 transition-opacity duration-300"
            >
              Prikaži Vodič Ponovo
            </button>

            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4">Nalog</h2>
              <p className="text-white/70 mb-4">Odjavite se sa naloga i vratite na prijavu.</p>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white font-semibold hover:opacity-90 transition-opacity duration-300 shadow-lg"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

      {/* Feedback tool now mounted as native route using our auth and DB */}
      <Route 
        path="/feedback" 
        element={
          <DashboardRoute>
            {/* Direktno renderujemo feedback modul kao React komponentu */}
            <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#0D1240] to-[#040A3E]">
              <Sidebar />
              <div className="pl-20 md:pl-72 py-8 pr-4 md:pr-10">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-[#0D1240]/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Mount point */}
                    <div className="p-0">
                      {/** @ts-expect-error: local module import **/}
                      {require('./modules/feedback/feedback-bolt-hub-main/src/pages/Dashboard').default()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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