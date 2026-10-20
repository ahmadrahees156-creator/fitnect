
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resendOtp, verifyEmail } from '../services/authService'

function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !/^\d{6}$/.test(otp)) {
      setError('Enter a valid email and six-digit verification code.')
      return
    }

    try {
      setLoading(true)

      const response = await verifyEmail(
        email.trim().toLowerCase(),
        otp
      )

      const token = response.token || response.data?.token
      const user = response.user || response.data?.user || null

      if (!token) {
        setError(
          'Verification response did not include a token. Please check the backend response format.'
        )
        return
      }

      if (!user?.role) {
        setError(
          'Verification succeeded, but the server did not return your account role. Please log in to continue.'
        )
        return
      }

      if (user.role !== 'athlete') {
        setError('Only athlete accounts are supported.')
        return
      }

      localStorage.setItem('fitnect_token', token)
      localStorage.setItem('fitnect_user', JSON.stringify(user))

      setMessage('Email verified successfully.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Verification failed. Check the code and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Enter your registration email first.')
      return
    }

    try {
      setResending(true)

      const response = await resendOtp(
        email.trim().toLowerCase()
      )

      setMessage(
        response.message ||
          'If eligible, a new verification code will be sent.'
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not resend the code. Please try again later.'
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E4DBF4] px-4 py-10 text-[#151517]">
      <section className="w-full max-w-md rounded-3xl border border-[#D8C9F0] bg-white p-6 shadow-xl shadow-purple-200/40 sm:p-9">
        <Link to="/" className="text-2xl font-black tracking-tight">
          FitNect<span className="text-[#8B73D9]">.</span>
        </Link>

        <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4DBF4]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8B73D9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>

        <p className="mt-6 text-sm font-bold tracking-[0.18em] text-[#8B73D9]">
          EMAIL VERIFICATION
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Verify your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Enter the six-digit code sent to your email after registration.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {message}
          </p>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#D8C9F0] bg-white px-4 py-3 text-[#151517] outline-none transition focus:border-[#8B73D9] focus:ring-4 focus:ring-[#E4DBF4]"
            />
          </div>

          <div>
            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Six-digit code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
              placeholder="000000"
              className="w-full rounded-xl border border-[#D8C9F0] bg-white px-4 py-3 text-center text-xl tracking-[0.4em] text-[#151517] outline-none transition focus:border-[#8B73D9] focus:ring-4 focus:ring-[#E4DBF4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FDC381] px-4 py-3 font-bold text-[#151517] transition hover:bg-[#F8B466] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-5 w-full text-sm font-semibold text-[#8B73D9] transition hover:text-[#7156C1] hover:underline disabled:opacity-60"
        >
          {resending ? 'Requesting code...' : 'Resend verification code'}
        </button>

        <div className="my-6 border-t border-[#EDE6F7]" />

        <p className="text-center text-sm text-gray-500">
          Already verified?{' '}
          <Link
            to="/login"
            className="font-bold text-[#8B73D9] hover:underline"
          >
            Log in
          </Link>
        </p>

        <p className="mt-5 text-center text-xs text-gray-400">
          Your fitness journey starts with FitNect.
        </p>
      </section>
    </main>
  )
}

export default VerifyEmail
