
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import CoachDashboard from './pages/CoachDashboard'
import Profile from './pages/Profile'

import { getCurrentUser } from './services/authService'

function ProtectedRoute({ children, allowedRole }) {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

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

        if (active) {
          localStorage.setItem('fitnect_user', JSON.stringify(currentUser))
          setUser(currentUser)
          setStatus('authorized')
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

  if (allowedRole && user?.role !== allowedRole) {
    return (
      <Navigate
        to={user?.role === 'coach' ? '/coach' : '/dashboard'}
        replace
      />
    )
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
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="athlete">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRole="coach">
              <CoachDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
