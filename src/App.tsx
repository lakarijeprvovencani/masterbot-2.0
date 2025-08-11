import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthForm } from './components/AuthForm'
import { OnboardingScreen } from './components/OnboardingScreen'
import { AIAnalysisScreen } from './components/AIAnalysisScreen'
import { AnalysisEditorScreen } from './components/AnalysisEditorScreen'
import { CompletedScreen } from './components/CompletedScreen'
import { 
  ProtectedRoute, 
  AuthOnlyRoute, 
  OnboardingRoute, 
  DashboardRoute, 
  PublicRoute 
} from './components/ProtectedRoute'

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')

  const handleAuthSuccess = () => {
    // Navigation će se desiti automatski preko ProtectedRoute
    console.log('✅ Auth uspešan, preusmeravam...')
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
        <h1 className="text-4xl font-bold mb-4">🎯 Masterbot AI Dashboard</h1>
        <p className="text-white/70 mb-8">Dobrodošli u vašu AI marketing platformu!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-xl font-semibold mb-3">📊 Analiza Biznisa</h3>
            <p className="text-white/70">Pregled vaših analiza i insights-a</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-xl font-semibold mb-3">🚀 Marketing Strategije</h3>
            <p className="text-white/70">AI-generisane strategije za vaš brend</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
            <h3 className="text-xl font-semibold mb-3">📈 Performance Tracking</h3>
            <p className="text-white/70">Praćenje rezultata vaših kampanja</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      
      {/* Protected Route - AI Analysis (zahtevan auth + onboarding) */}
      <Route 
        path="/ai-analysis" 
        element={
          <DashboardRoute>
            <AIAnalysisScreen />
          </DashboardRoute>
        } 
      />
      
      {/* Protected Route - Analysis Editor (zahtevan auth + onboarding) */}
      <Route 
        path="/analysis-editor" 
        element={
          <DashboardRoute>
            <AnalysisEditorScreen />
          </DashboardRoute>
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
      
      {/* Catch-all route */}
      <Route path="*" element={<PublicRoute><AuthPage /></PublicRoute>} />
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