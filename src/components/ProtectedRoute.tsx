import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireOnboarding?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  redirectTo
}) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#040A3E]/90 to-[#040A3E]/80">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-gradient-to-br from-[#F56E36]/20 to-[#040A3E]/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-white/70">Proveravam pristup...</p>
        </div>
      </div>
    )
  }

  // 1. AUTH CHECK - ako tražimo autentifikaciju
  if (requireAuth && !user) {
    console.log('🔒 Korisnik nije ulogovan, preusmeravam na login')
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // 2. ONBOARDING CHECK - ako tražimo završen onboarding
  if (requireOnboarding && user && profile && !profile.onboarding_completed) {
    console.log('📋 Korisnik nije završio onboarding, preusmeravam na onboarding')
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  // 3. ONBOARDING ACCESS - ako je onboarding završen, ne može na onboarding ekrane
  if (user && profile && profile.onboarding_completed && (
    location.pathname === '/onboarding' || 
    location.pathname === '/ai-analysis' || 
    location.pathname === '/analysis-editor'
  )) {
    console.log('✅ Korisnik je završio onboarding, preusmeravam na dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // 4. CUSTOM REDIRECT
  if (redirectTo && location.pathname !== redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // ✅ SVE PROVERE PROŠLE - prikaži sadržaj
  return <>{children}</>
}

// Specijalizovane komponente za različite tipove ruta
export const AuthOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireOnboarding={false}>
    {children}
  </ProtectedRoute>
)

export const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireOnboarding={false}>
    {children}
  </ProtectedRoute>
)

export const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireOnboarding={true}>
    {children}
  </ProtectedRoute>
)

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false} requireOnboarding={false}>
    {children}
  </ProtectedRoute>
)
