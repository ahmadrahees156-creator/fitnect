import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'

function Dashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E4DBF4] p-5">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-3xl font-extrabold text-[#151517]">
          Welcome to Fit<span className="text-[#8B73D9]">Nect</span>
        </h1>
        <p className="mt-3 text-gray-600">
          Your dashboard page will be built next.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('fitnect_token')
            window.location.href = '/login'
          }}
          className="mt-6 rounded-xl bg-[#FDC381] px-6 py-3 font-bold text-[#151517] hover:bg-[#F8B466]"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App