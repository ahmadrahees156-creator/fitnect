
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import { getMyFitnessProfile } from './services/fitnessProfileService'

import { getCurrentUser } from './services/authService'

function ProtectedRoute({ children, allowedRole, requireOnboarding = false }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    const verifyToken = async () => {
      const token = localStorage.getItem('fitnect_token')

      if (!token) {
        if (active) setStatus('unauthorized')
        return
      }

      try {
        const response = await getCurrentUser()
        const currentUser =
          response.user || response.data?.user || response.data || response

        if (!currentUser?.role) {
          throw new Error('User role was not returned by the server.')
        }

        if (currentUser.role !== 'athlete') {
          localStorage.removeItem('fitnect_token')
          localStorage.removeItem('fitnect_user')

          if (active) setStatus('unauthorized')
          return
        }

        let onboardingCompleted = currentUser.onboardingCompleted === true
        if (requireOnboarding) {
          try {
            const fitnessData = await getMyFitnessProfile()
            onboardingCompleted = fitnessData.onboardingCompleted === true
          } catch {
            onboardingCompleted = false
          }
        }

        if (active) {
          localStorage.setItem(
            'fitnect_user',
            JSON.stringify({ ...currentUser, onboardingCompleted })
          )
          setStatus(requireOnboarding && !onboardingCompleted ? 'onboarding' : 'authorized')
        }
      } catch {
        localStorage.removeItem('fitnect_token')
        localStorage.removeItem('fitnect_user')

        if (active) setStatus('unauthorized')
      }
    }

    verifyToken()

    return () => {
      active = false
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6FC] text-[#302442]">
        Verifying your session...
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />
  }

  if (status === 'onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (allowedRole && allowedRole !== 'athlete') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRole="athlete">
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="athlete" requireOnboarding>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="athlete" requireOnboarding>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/coach" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
