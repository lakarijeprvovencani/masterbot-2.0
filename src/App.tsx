import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/AuthForm'
import { OnboardingScreen } from './components/OnboardingScreen'
import { AIAnalysisScreen } from './components/AIAnalysisScreen'
import { AnalysisEditorScreen } from './components/AnalysisEditorScreen'
import { CompletedScreen } from './components/CompletedScreen'
import { Loader2 } from 'lucide-react'

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const { user, profile } = useAuth()

  const handleAuthSuccess = () => {
    // Navigation će se desiti automatski preko useEffect-a u AppContent
  }

  // Ako nema korisnika, sigurno prikaži auth formu
  if (!user) {
    return (
      <AuthForm 
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
    )
  }

  if (user && profile?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />
  }

  if (user && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
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
    <div className="min-h-screen bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80 p-8">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Masterbot AI Dashboard - Uskoro!</h1>
        <p className="text-white/70">Ovde će biti glavna aplikacija sa Masterbot AI marketing tools</p>
      </div>
    </div>
  )
}

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80">
    <div className="text-center text-white">
      <div className="w-20 h-20 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-white/70">Učitava se...</p>
    </div>
  </div>
)

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !user ? (
            <AuthPage />
          ) : profile?.onboarding_completed ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          user ? (
            profile?.onboarding_completed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <OnboardingScreen />
            )
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/ai-analysis" 
        element={
          user ? (
            profile?.onboarding_completed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AIAnalysisScreen />
            )
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/analysis-editor" 
        element={
          user ? (
            profile?.onboarding_completed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AnalysisEditorScreen />
            )
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/completed" 
        element={
          user ? (
            profile?.onboarding_completed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <CompletedScreen />
            )
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          user && profile?.onboarding_completed ? (
            <Dashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App