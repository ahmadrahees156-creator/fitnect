
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import { getCurrentUser } from './services/authService'

function ProtectedRoute({ children }) {
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
        await getCurrentUser()

        if (active) {
          setStatus('authorized')
        }
      } catch (error) {
        localStorage.removeItem('fitnect_token')

        if (active) {
          setStatus('unauthorized')
        }
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
            <ProtectedRoute>
              <Dashboard />
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
