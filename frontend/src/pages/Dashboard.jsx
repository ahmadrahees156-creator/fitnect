
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import { getDashboardSummary } from '../services/dashboardService'
import { getTodayWellness } from '../services/wellnessService'

import Brand from '../components/Brand'
import TrainingActivity from '../components/TrainingActivity'
import WellnessCheckIn from '../components/WellnessCheckIn'
import Recovery from '../components/Recovery'
import Nutrition from '../components/Nutrition'
import InjuryRisk from '../components/InjuryRisk'
import Footsteps from '../components/Footsteps'
import Profile from './Profile'

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'wellness', label: 'Wellness Check-in' },
  { id: 'training', label: 'Training & Activity' },
  { id: 'footsteps', label: 'Footsteps' },
  { id: 'injury', label: 'Injury Risk' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
]

function getWellnessRecord(response) {
  return (
    response?.wellness ??
    response?.data?.wellness ??
    response?.data?.data?.wellness ??
    response?.today?.wellness ??
    response?.data?.today?.wellness ??
    null
  )
}

function Dashboard() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [todayWellness, setTodayWellness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const refreshDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    setError('')

    try {
      const [summaryResult, userResult, wellnessResult] =
        await Promise.allSettled([
          getDashboardSummary(),
          getCurrentUser(),
          getTodayWellness(),
        ])

      if (summaryResult.status === 'fulfilled') {
        setDashboardSummary(summaryResult.value)
      } else {
        console.error(
          'Dashboard summary fetch failed:',
          summaryResult.reason
        )
      }

      if (userResult.status === 'fulfilled') {
        const userResponse = userResult.value

        setUser(
          userResponse?.user ??
            userResponse?.data?.user ??
            userResponse?.data ??
            userResponse ??
            null
        )
      } else {
        console.error('User fetch failed:', userResult.reason)
      }

      if (wellnessResult.status === 'fulfilled') {
        setTodayWellness(getWellnessRecord(wellnessResult.value))
      } else {
        console.error(
          'Today wellness fetch failed:',
          wellnessResult.reason
        )
      }

      if (
        summaryResult.status === 'rejected' &&
        wellnessResult.status === 'rejected'
      ) {
        setError('Unable to load dashboard data. Please try again.')
      }
    } catch (err) {
      console.error('Dashboard refresh failed:', err)
      setError('Unable to refresh dashboard. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refreshDashboard(true)
  }, [refreshDashboard])

  const goToSection = async (section) => {
    setActiveSection(section)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (section === 'overview') {
      await refreshDashboard()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('fitnect_token')
    localStorage.removeItem('fitnect_user')
    navigate('/login')
  }

  const summary = dashboardSummary?.data ?? dashboardSummary

  const wellnessRecord =
    todayWellness ??
    getWellnessRecord(summary) ??
    getWellnessRecord(dashboardSummary)

  const hasCheckedIn = Boolean(
    wellnessRecord ??
      summary?.hasCheckedIn ??
      summary?.checkedIn ??
      summary?.today?.hasCheckedIn ??
      summary?.today?.checkedIn
  )

  const displayName =
    user?.name ??
    user?.fullName ??
    user?.username ??
    user?.firstName ??
    'Athlete'

  const energy = wellnessRecord?.energy
  const sleepHours = wellnessRecord?.sleepHours

  const renderOverview = () => (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#E4DBF4] p-7 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -bottom-16 -right-12 h-64 w-64 rounded-full bg-[#FDC381]/70 blur-2xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 h-48 w-48 rounded-full bg-[#F373D4]/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#7E7E82]">
              Your personal wellness space
            </p>

            <h1 className="text-3xl font-bold leading-tight text-[#151517] sm:text-5xl">
              Welcome back, {displayName}.
              <span className="mt-2 block">
                Let’s check in with your body.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#55545B]">
              Track your wellness, understand your recovery, and build
              healthier training habits one day at a time.
            </p>

            <button
              onClick={() => goToSection('wellness')}
              className="mt-7 rounded-full bg-[#151517] px-6 py-3 font-semibold text-white transition hover:bg-[#34343A]"
            >
              {hasCheckedIn
                ? 'Update wellness check-in'
                : 'Start wellness check-in'}
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <img
              src="/Dashboard-3D.png"
              alt="FitNect wellness dashboard illustration"
              className="relative z-10 mx-auto h-auto w-full object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={() => refreshDashboard()}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#151517]">
            Today at a glance
          </h2>
          <p className="mt-1 text-sm text-[#7E7E82]">
            Your latest wellness information
          </p>
        </div>

        <button
          onClick={() => refreshDashboard()}
          disabled={refreshing}
          className="rounded-full border border-[#E5E1EB] bg-white px-4 py-2 text-sm font-semibold text-[#151517] transition hover:bg-[#F8F5FC] disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl bg-[#F1EDF7]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#EEEAF3] bg-white p-6">
            <p className="text-sm text-[#7E7E82]">Wellness check-in</p>
            <h3 className="mt-4 text-2xl font-bold text-[#151517]">
              {hasCheckedIn ? 'Completed' : 'Not completed'}
            </h3>
            <p className="mt-2 text-sm text-[#7E7E82]">
              {hasCheckedIn
                ? 'Your wellness record is available.'
                : 'Complete your check-in to record today’s status.'}
            </p>
          </div>

          <div className="rounded-3xl border border-[#EEEAF3] bg-white p-6">
            <p className="text-sm text-[#7E7E82]">Energy level</p>
            <h3 className="mt-4 text-3xl font-bold text-[#151517]">
              {energy != null ? `${energy}/10` : '--'}
            </h3>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F1EDF7]">
              <div
                className="h-full rounded-full bg-[#FDC381] transition-all"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (Number(energy) || 0) * 10)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#EEEAF3] bg-white p-6">
            <p className="text-sm text-[#7E7E82]">Sleep duration</p>
            <h3 className="mt-4 text-3xl font-bold text-[#151517]">
              {sleepHours != null ? `${sleepHours} hrs` : '--'}
            </h3>
            <p className="mt-2 text-sm text-[#7E7E82]">
              {wellnessRecord?.sleepQuality
                ? `Sleep quality: ${wellnessRecord.sleepQuality}`
                : 'Record your sleep in your wellness check-in.'}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-[#EEEAF3] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7E7E82]">
              Daily wellness
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#151517]">
              How are you feeling today?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7E7E82]">
              A quick check-in helps you keep track of your mood, energy,
              sleep, stress, and soreness.
            </p>
          </div>

          <div className="rounded-2xl bg-[#CAECD6] px-4 py-3 text-sm font-semibold text-[#24533A]">
            {hasCheckedIn ? 'Check-in saved' : 'Ready when you are'}
          </div>
        </div>

        {wellnessRecord && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Mood', wellnessRecord.mood],
              [
                'Stress',
                wellnessRecord.stress != null
                  ? `${wellnessRecord.stress}/5`
                  : null,
              ],
              [
                'Soreness',
                wellnessRecord.soreness != null
                  ? `${wellnessRecord.soreness}/5`
                  : null,
              ],
              ['Sleep quality', wellnessRecord.sleepQuality],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-[#F8F5FC] p-4"
              >
                <p className="text-sm text-[#7E7E82]">{label}</p>
                <p className="mt-2 font-semibold capitalize text-[#151517]">
                  {value ?? '--'}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => goToSection('wellness')}
          className="mt-6 rounded-full bg-[#FDC381] px-5 py-3 font-semibold text-[#151517] transition hover:bg-[#F8B76C]"
        >
          {hasCheckedIn ? 'Edit today’s check-in' : 'Complete check-in'}
        </button>
      </section>

      <section className="rounded-3xl bg-[#151517] p-6 text-white sm:p-8">
        <p className="text-sm text-white/60">A reminder for you</p>
        <h2 className="mt-3 text-2xl font-bold">
          Progress at your own pace.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          Listen to your body, give yourself time to recover, and build
          consistency without ignoring how you feel.
        </p>
      </section>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview()

      case 'wellness':
        return (
          <WellnessCheckIn
            onSaved={async () => {
              await refreshDashboard()
              setActiveSection('overview')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )

      case 'training':
        return <TrainingActivity />

      case 'footsteps':
        return <Footsteps />

      case 'injury':
        return <InjuryRisk />

      case 'recovery':
        return <Recovery />

      case 'nutrition':
        return <Nutrition />

      case 'profile':
        return <Profile />

      case 'settings':
        return (
          <section className="rounded-3xl border border-[#EEEAF3] bg-white p-8">
            <h1 className="text-2xl font-bold text-[#151517]">Settings</h1>
            <p className="mt-2 text-[#7E7E82]">
              Settings options will be available here soon.
            </p>
          </section>
        )

      default:
        return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#151517]">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#EEEAF3] bg-white p-5 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Brand />

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#7E7E82] hover:bg-[#F8F5FC] lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#7E7E82]">
          Workspace
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goToSection(item.id)}
              className={`w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-medium tracking-wide transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-[#E4DBF4] text-[#151517]'
                  : 'text-[#68676D] hover:bg-[#F8F5FC] hover:text-[#151517]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 border-t border-[#EEEAF3] pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold text-[#B04444] transition hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EEEAF3] bg-white/90 px-4 py-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-xl border border-[#EEEAF3] px-3 py-2 text-sm lg:hidden"
            >
              Menu
            </button>

            <div>
              <p className="text-sm font-semibold text-[#151517]">
                FitNect
              </p>
              <p className="text-xs text-[#7E7E82]">
                {navItems.find((item) => item.id === activeSection)?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="hidden text-xs text-[#7E7E82] sm:inline">
                Syncing...
              </span>
            )}

            <button
              onClick={() => goToSection('profile')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDC381] font-bold text-[#151517]"
              aria-label="Open profile"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
