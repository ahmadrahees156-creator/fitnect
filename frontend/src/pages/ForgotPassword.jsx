import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await forgotPassword(email.trim().toLowerCase())
      setSuccess(response.message || 'If an eligible account exists for that email, password reset instructions will be sent shortly.')
    } catch (err) {
      setError(err.response?.data?.message || 'We could not process that request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E4DBF4] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl sm:p-9">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-[#151517]">
          Fit<span className="text-[#8B73D9]">Nect</span>
        </Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDC381]/50 text-2xl" aria-hidden="true">↗</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8059B7]">Account recovery</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151517]">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Enter the email address associated with your FitNect account. If it is eligible, we’ll send you a secure reset link.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="mt-5 rounded-xl border border-[#CAECD6] bg-[#F0FBF4] p-3 text-sm leading-6 text-[#245D3A]">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#151517]">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-4 py-3.5 text-sm outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#FDC381] px-4 py-3.5 text-sm font-bold text-[#151517] transition hover:bg-[#F8B466] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Sending request...' : 'Send reset link →'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600"><Link to="/login" className="font-bold text-[#8059B7] hover:underline">← Back to login</Link></p>
      </section>
    </main>
  )
}

export default ForgotPassword
