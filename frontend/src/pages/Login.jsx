
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import api from '../services/api'
import { loginUser, getCurrentUser } from '../services/authService'

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const saveSession = async (data) => {
    const token = data.token || data.data?.token

    if (!token) {
      throw new Error('Login response did not contain an authentication token.')
    }

    localStorage.setItem('fitnect_token', token)

    const response = await getCurrentUser()
    const user = response.user || response.data?.user || response.data || response

    if (!user?.role) {
      throw new Error('Could not determine your account role.')
    }

    localStorage.setItem('fitnect_user', JSON.stringify(user))

    navigate(user.role === 'coach' ? '/coach' : '/dashboard', {
      replace: true,
    })
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)

      const data = await loginUser(
        form.email.trim().toLowerCase(),
        form.password
      )

      await saveSession(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Please check your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google did not provide an ID token.')
      return
    }

    try {
      setError('')
      setGoogleLoading(true)

      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
      })

      await saveSession(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Google login failed. Please try again.'
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#E4DBF4] px-3 py-5 sm:px-5 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[26px] bg-white shadow-xl lg:grid-cols-2">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#E4DBF4] p-6 sm:p-9 lg:p-10">
          <div className="absolute -left-12 top-36 h-48 w-48 rounded-full bg-[#FDC381]/60 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#A9CDFA]/70 blur-3xl" />

          <Link to="/" className="relative z-10 w-fit text-2xl font-extrabold tracking-tight text-[#151517]">
            Fit<span className="text-[#8B73D9]">Nect</span>
          </Link>

          <div className="relative z-10 mt-8">
            <span className="inline-block rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#8059B7]">
              Welcome back
            </span>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-[#151517] sm:text-4xl">
              Your journey.
              <br />
              <span className="text-[#8B73D9]">Your progress.</span>
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-700">
              Sign in to keep track of your wellness and continue building
              healthier training habits.
            </p>

            <div className="mt-6 overflow-hidden rounded-[22px] border-[5px] border-[#FDC381]">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85"
                alt="Modern fitness training space"
                className="h-56 w-full object-cover sm:h-64 lg:h-[300px]"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white/75 p-3.5">
              <p className="text-sm font-bold text-[#151517]">Every day counts.</p>
              <p className="mt-1 text-xs text-gray-600">Train smart. Recover well.</p>
            </div>
          </div>

          <p className="relative z-10 mt-6 text-xs text-gray-600">
            Made for progress. Built around your wellness.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B73D9]">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151517]">
              Log in to FitNect
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter your account details to continue.
            </p>

            {error && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#151517]">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-3.5 py-3.5 text-sm outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#151517]">
                  Password
                </label>

                <div className="flex overflow-hidden rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] focus-within:border-[#A58AD2] focus-within:ring-2 focus-within:ring-[#E4DBF4]">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-xs font-semibold text-[#8059B7] hover:text-[#5E3D91]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full rounded-xl bg-[#FDC381] px-4 py-3.5 text-sm font-bold text-[#151517] shadow-sm transition hover:bg-[#F8B466] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Log in →'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E8E1F1]" />
              <span className="text-xs text-gray-400">OR CONTINUE WITH</span>
              <div className="h-px flex-1 bg-[#E8E1F1]" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed. Please try again.')}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="350"
              />
            </div>

            {googleLoading && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Signing in with Google...
              </p>
            )}

            <p className="mt-7 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#8059B7] hover:underline">
                Create account
              </Link>
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <span className="h-1.5 w-7 rounded-full bg-[#FDC381]" />
              <span className="h-1.5 w-7 rounded-full bg-[#A9CDFA]" />
              <span className="h-1.5 w-7 rounded-full bg-[#CAECD6]" />
              <span className="h-1.5 w-7 rounded-full bg-[#F373D4]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
