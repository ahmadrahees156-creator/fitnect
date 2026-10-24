
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import api from '../services/api'
import { registerUser, getCurrentUser } from '../services/authService'
import { getMyFitnessProfile } from '../services/fitnessProfileService'

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'athlete',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    try {
      setLoading(true)

      await registerUser({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: 'athlete',
      })

      navigate('/verify-email', {
        state: {
          email: form.email.trim().toLowerCase(),
          role: 'athlete',
        },
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
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
        role: 'athlete',
      })

      const data = response.data
      const token = data.token || data.data?.token

      if (!token) {
        throw new Error('No authentication token returned by the server.')
      }

      localStorage.setItem('fitnect_token', token)

      let user = data.user || data.data?.user || null

      if (!user?.role) {
        const profileResponse = await getCurrentUser()
        user =
          profileResponse.user ||
          profileResponse.data?.user ||
          profileResponse.data ||
          profileResponse
      }

      if (!user?.role) {
        throw new Error('Could not determine your account role.')
      }

      if (user.role !== 'athlete') {
        localStorage.removeItem('fitnect_token')
        throw new Error(
          'Only athlete accounts are supported. Please contact support if you need help with your account.'
        )
      }

      localStorage.setItem('fitnect_user', JSON.stringify(user))

      let completed = user.onboardingCompleted === true
      try {
        const fitnessProfile = await getMyFitnessProfile()
        completed = fitnessProfile.onboardingCompleted === true
      } catch {
        completed = false
      }
      localStorage.setItem('fitnect_user', JSON.stringify({ ...user, onboardingCompleted: completed }))
      navigate(completed ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Google sign-in failed. Please try again.'
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#E4DBF4] px-3 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[26px] bg-white shadow-xl lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#E4DBF4] p-6 sm:p-8 lg:p-9">
          <div className="absolute -left-12 top-36 h-48 w-48 rounded-full bg-[#FDC381]/60 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-52 w-52 rounded-full bg-[#A9CDFA]/70 blur-3xl" />

          <Link
            to="/"
            className="relative z-10 w-fit text-2xl font-extrabold tracking-tight text-[#151517]"
          >
            Fit<span className="text-[#8B73D9]">Nect</span>
          </Link>

          <div className="relative z-10 mt-7">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#8059B7]">
              Your journey starts here
            </span>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-[#151517] sm:text-4xl">
              Stronger body.
              <br />
              <span className="text-[#8B73D9]">Healthier you.</span>
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-700">
              Track your wellness, understand your progress, and build better
              training habits with FitNect.
            </p>

            <div className="mt-6 overflow-hidden rounded-[22px] border-[5px] border-[#FDC381] bg-[#FDC381]">
              <img
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85"
                alt="Athlete stretching during a fitness session"
                className="h-56 w-full object-cover sm:h-64 lg:h-[300px]"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white/75 p-3.5">
              <p className="text-sm font-bold text-[#151517]">
                Every day counts
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                Train smart. Recover well.
              </p>
            </div>
          </div>

          <p className="relative z-10 mt-6 text-xs text-gray-600">
            Made for progress. Built around your wellness.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-7 sm:px-9 sm:py-8 lg:px-12">
          <div className="w-full max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B73D9]">
              Get started
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151517]">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Join FitNect and take your training journey to the next level.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold text-[#151517]"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  minLength={2}
                  required
                  className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-3.5 py-3 text-sm text-[#151517] outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-[#151517]"
                >
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
                  className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-3.5 py-3 text-sm text-[#151517] outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#151517]">
                  Account type
                </label>

                <div className="w-full rounded-xl border border-[#9A7BD0] bg-[#EDE5FA] py-3.5 text-center text-sm font-bold text-[#8059B7] ring-2 ring-[#E4DBF4]">
                  Athlete
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-[#151517]"
                >
                  Password
                </label>

                <div className="flex overflow-hidden rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] focus-within:border-[#A58AD2] focus-within:ring-2 focus-within:ring-[#E4DBF4]">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-[#151517] outline-none"
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
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E8E1F1]" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="h-px flex-1 bg-[#E8E1F1]" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError('Google sign-in failed. Please try again.')
                }
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="350"
              />
            </div>

            {googleLoading && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Signing in with Google...
              </p>
            )}

            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#8059B7] hover:underline"
              >
                Log in
              </Link>
            </p>

            <div className="mt-5 flex justify-center gap-2">
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

export default Register
