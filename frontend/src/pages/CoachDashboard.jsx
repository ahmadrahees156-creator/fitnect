
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CoachProfile from './CoachProfile'

const athletes = [
  {
    id: 1,
    name: 'Aarav Sharma',
    initials: 'AS',
    sport: 'Football',
    age: 21,
    risk: 'High',
    recovery: 62,
    trainingLoad: 88,
    sleep: 5.4,
    hydration: 58,
    injury: 'Knee discomfort',
    color: 'bg-[#FDC381]',
    note: 'Reduce training intensity and monitor knee discomfort.',
  },
  {
    id: 2,
    name: 'Priya Verma',
    initials: 'PV',
    sport: 'Athletics',
    age: 20,
    risk: 'Medium',
    recovery: 78,
    trainingLoad: 67,
    sleep: 7.1,
    hydration: 76,
    injury: 'Muscle fatigue',
    color: 'bg-[#E4DBF4]',
    note: 'Monitor recovery and maintain a consistent sleep schedule.',
  },
  {
    id: 3,
    name: 'Kabir Singh',
    initials: 'KS',
    sport: 'Basketball',
    age: 22,
    risk: 'Low',
    recovery: 91,
    trainingLoad: 54,
    sleep: 8.2,
    hydration: 89,
    injury: 'No concerns reported',
    color: 'bg-[#CAECD6]',
    note: 'Maintain current training and recovery routine.',
  },
  {
    id: 4,
    name: 'Ananya Gupta',
    initials: 'AG',
    sport: 'Badminton',
    age: 19,
    risk: 'Medium',
    recovery: 72,
    trainingLoad: 73,
    sleep: 6.5,
    hydration: 68,
    injury: 'Shoulder soreness',
    color: 'bg-[#F9D6EE]',
    note: 'Check shoulder soreness before the next training session.',
  },
]

const navigation = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'athletes', label: 'My Athletes', icon: '♧' },
  { id: 'alerts', label: 'Risk Alerts', icon: '⚠' },
  { id: 'notes', label: 'Coach Notes', icon: '▤' },
  { id: 'profile', label: 'Coach Profile', icon: '◉' },
]

const NOTES_STORAGE_KEY = 'fitnect-coach-notes'

function loadNotes() {
  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function loadCoachUser() {
  try {
    return JSON.parse(localStorage.getItem('fitnect_user') || '{}')
  } catch {
    return {}
  }
}

function getRiskStyle(risk) {
  if (risk === 'High') return 'bg-[#FCE4E4] text-[#B42318]'
  if (risk === 'Medium') return 'bg-[#FFF0D9] text-[#A35B08]'
  return 'bg-[#DDF5E5] text-[#237747]'
}

function StatCard({ label, value, detail, icon, color }) {
  return (
    <div className="group rounded-3xl border border-[#ECE7F1] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D8CBE9]/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#7E7E82]">{label}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#151517]">
            {value}
          </h3>
          <p className="mt-2 text-xs text-[#7E7E82]">{detail}</p>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, color = 'bg-[#CAECD6]' }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#7E7E82]">{label}</span>
        <span className="text-xs font-bold text-[#151517]">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#F0EDF4]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

function AthleteCard({ athlete, onView }) {
  return (
    <div className="group rounded-3xl border border-[#ECE7F1] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D8C6EB] hover:shadow-lg hover:shadow-[#D8CBE9]/25">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-[#302442] ${athlete.color}`}>
            {athlete.initials}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-bold text-[#151517]">
              {athlete.name}
            </h3>
            <p className="mt-1 text-xs text-[#7E7E82]">
              {athlete.sport} · {athlete.age} years
            </p>
          </div>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${getRiskStyle(athlete.risk)}`}>
          {athlete.risk} Risk
        </span>
      </div>

      <div className="mt-6">
        <ProgressBar
          label="Recovery score"
          value={athlete.recovery}
          color={
            athlete.recovery >= 85
              ? 'bg-[#8ED6A7]'
              : athlete.recovery >= 70
                ? 'bg-[#FDC381]'
                : 'bg-[#F373D4]'
          }
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0EDF4] pt-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#7E7E82]">
            Current status
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#302442]">
            {athlete.injury}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onView(athlete)}
          className="shrink-0 rounded-xl bg-[#F4F0F9] px-3 py-2 text-xs font-bold text-[#63477F] transition-all hover:scale-105 hover:bg-[#E4DBF4] active:scale-95"
        >
          View details →
        </button>
      </div>
    </div>
  )
}

function AthleteModal({ athlete, onClose }) {
  useEffect(() => {
    if (!athlete) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [athlete, onClose])

  if (!athlete) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151517]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="athlete-modal-title"
        className="my-auto w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-[#302442] ${athlete.color}`}>
              {athlete.initials}
            </div>

            <div>
              <h2 id="athlete-modal-title" className="text-xl font-bold">
                {athlete.name}
              </h2>
              <p className="mt-1 text-sm text-[#7E7E82]">
                {athlete.sport} · {athlete.age} years
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close athlete details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F0F9] text-[#63477F] transition hover:rotate-90 hover:bg-[#E4DBF4]"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#FAF8FC] p-4">
          <span className="text-sm font-medium text-[#7E7E82]">
            Injury risk
          </span>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getRiskStyle(athlete.risk)}`}>
            {athlete.risk} Risk
          </span>
        </div>

        <div className="mt-6 space-y-5">
          <ProgressBar label="Recovery" value={athlete.recovery} />
          <ProgressBar
            label="Training load"
            value={athlete.trainingLoad}
            color="bg-[#FDC381]"
          />
          <ProgressBar
            label="Hydration"
            value={athlete.hydration}
            color="bg-[#A9CDFA]"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F8F5FC] p-4">
            <p className="text-xs text-[#7E7E82]">Average sleep</p>
            <p className="mt-2 text-xl font-bold">{athlete.sleep}h</p>
          </div>

          <div className="rounded-2xl bg-[#F8F5FC] p-4">
            <p className="text-xs text-[#7E7E82]">Current concern</p>
            <p className="mt-2 text-sm font-bold">{athlete.injury}</p>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-[#7E7E82]">
          These are illustrative monitoring indicators, not a medical
          assessment or diagnosis.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-[#151517] py-3.5 text-sm font-semibold text-white transition hover:bg-[#63477F] active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default function CoachDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [notes, setNotes] = useState(loadNotes)
  const [notesSaved, setNotesSaved] = useState(true)
  const [storageError, setStorageError] = useState(false)

  const [coachUser, setCoachUser] = useState(() => {
    const user = loadCoachUser()

    return {
      name: user.name || user.fullName || 'Coach Workspace',
      email: user.email || '',
    }
  })

  const highRiskCount = athletes.filter(
    (athlete) => athlete.risk === 'High'
  ).length

  const mediumRiskCount = athletes.filter(
    (athlete) => athlete.risk === 'Medium'
  ).length

  const averageRecovery = Math.round(
    athletes.reduce((sum, athlete) => sum + athlete.recovery, 0) /
      athletes.length
  )

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
      setStorageError(false)
      setNotesSaved(true)
    } catch {
      setStorageError(true)
      setNotesSaved(false)
    }
  }, [notes])

  useEffect(() => {
    const user = loadCoachUser()

    setCoachUser({
      name: user.name || user.fullName || 'Coach Workspace',
      email: user.email || '',
    })
  }, [])

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      const matchesSearch =
        athlete.name.toLowerCase().includes(search.toLowerCase()) ||
        athlete.sport.toLowerCase().includes(search.toLowerCase())

      const matchesRisk =
        riskFilter === 'All' || athlete.risk === riskFilter

      const matchesTab =
        activeTab !== 'alerts' || athlete.risk !== 'Low'

      return matchesSearch && matchesRisk && matchesTab
    })
  }, [search, riskFilter, activeTab])

  const pageTitles = {
    overview: {
      title: 'Coach Overview',
      subtitle: 'Your team at a glance. Let’s make progress today.',
    },
    athletes: {
      title: 'My Athletes',
      subtitle: 'Track athlete wellness, training and recovery.',
    },
    alerts: {
      title: 'Risk Alerts',
      subtitle: 'Review athletes who may need additional attention.',
    },
    notes: {
      title: 'Coach Notes',
      subtitle: 'Keep track of your observations and follow-ups.',
    },
    profile: {
      title: 'Coach Profile',
      subtitle: 'Manage your coaching identity and professional details.',
    },
  }

  const currentPage = pageTitles[activeTab] || pageTitles.overview
  const coachInitial = coachUser.name.trim().charAt(0).toUpperCase() || 'C'

  function changeTab(tab) {
    setActiveTab(tab)
    setSearch('')
    setRiskFilter('All')
    setSelectedAthlete(null)
  }

  function updateNote(athleteId, value) {
    setNotes((previous) => ({
      ...previous,
      [athleteId]: value,
    }))
    setNotesSaved(false)
  }

  function handleLogout() {
    localStorage.removeItem('fitnect_user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.clear()

    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-[#151517]">
      <style>{`
        @keyframes contentEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-enter {
          animation: contentEnter 0.35s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-enter { animation: none; }
        }
      `}</style>

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-[#ECE7F1] bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:border-b-0 lg:border-r lg:p-6">
          <Link to="/coach" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4DBF4] text-xl font-black text-[#63477F]">
              F
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                FitNect
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E7E82]">
                Coach workspace
              </p>
            </div>
          </Link>

          <div className="mb-3 mt-8 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#A4A0AA] lg:block">
            Workspace
          </div>

          <nav
            aria-label="Coach dashboard navigation"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1"
          >
            {navigation.map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => changeTab(item.id)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'scale-[1.02] bg-[#E4DBF4] text-[#63477F] shadow-md shadow-[#DCCCEF]/50 ring-1 ring-[#D2C1E8]'
                      : 'text-[#7E7E82] hover:translate-x-1 hover:bg-[#F8F6FC] hover:text-[#302442]'
                  }`}
                >
                  <span
                    className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#A17BC8] transition-all ${
                      isActive
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-2 opacity-0'
                    }`}
                  />

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                      isActive
                        ? 'scale-110 bg-white shadow-sm'
                        : 'group-hover:scale-110 group-hover:bg-white'
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1">{item.label}</span>

                  {item.id === 'alerts' && highRiskCount > 0 && (
                    <span className="rounded-full bg-[#FCE4E4] px-2 py-0.5 text-[10px] font-bold text-[#B42318]">
                      {highRiskCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 hidden rounded-3xl bg-[#F8F5FC] p-4 lg:mt-auto lg:block">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CAECD6] text-lg">
              ♡
            </div>
            <h3 className="mt-3 text-sm font-bold">
              Athlete-first coaching
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#7E7E82]">
              Use wellness and recovery signals to guide thoughtful training
              decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#B42318] transition-all duration-300 hover:bg-[#FCE4E4] active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCE4E4] text-lg">
              ↪
            </span>
            <span>Logout</span>
          </button>

          <div className="mt-4 flex items-center gap-3 border-t border-[#ECE7F1] pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDC381] font-bold text-[#302442]">
              {coachInitial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{coachUser.name}</p>
              <p className="truncate text-xs text-[#7E7E82]">
                {coachUser.email || 'Team manager'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeTab('profile')}
              aria-label="Open coach profile"
              className="rounded-xl p-2 text-[#8062A2] transition hover:bg-[#F4F0F9]"
            >
              ↗
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A17BC8]">
                FITNECT / COACH
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {currentPage.title}
              </h2>
              <p className="mt-2 text-sm text-[#7E7E82]">
                {currentPage.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#ECE7F1] bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7E82]">
                  Team members
                </p>
                <p className="mt-1 text-lg font-extrabold">{athletes.length}</p>
              </div>

              <button
                type="button"
                onClick={() => changeTab('profile')}
                aria-label="Open coach profile"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E4DBF4] text-lg font-bold text-[#63477F] transition hover:scale-105"
              >
                {coachInitial}
              </button>
            </div>
          </header>

          <div key={activeTab} className="dashboard-enter">
            {activeTab === 'profile' && <CoachProfile />}

            {activeTab === 'overview' && (
              <>
                <section className="relative mb-7 overflow-hidden rounded-[28px] bg-[#E4DBF4] p-6 sm:p-8">
                  <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#63477F]">
                      Your team dashboard
                    </span>

                    <h3 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                      Better insights.
                      <br />
                      Smarter training.
                    </h3>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#635777]">
                      Stay on top of athlete recovery, training loads and
                      wellness indicators in one place.
                    </p>

                    <button
                      type="button"
                      onClick={() => changeTab('athletes')}
                      className="mt-6 rounded-2xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#63477F] active:scale-95"
                    >
                      Explore athletes →
                    </button>
                  </div>

                  <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border-[30px] border-white/30 sm:h-64 sm:w-64" />
                  <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-[#FDC381]/70 blur-sm" />
                  <div className="pointer-events-none absolute right-10 top-10 hidden h-20 w-20 rotate-12 rounded-3xl border border-white/70 sm:block" />
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total athletes"
                    value={athletes.length}
                    detail="Athletes in your team"
                    icon="♧"
                    color="bg-[#E4DBF4]"
                  />
                  <StatCard
                    label="High risk"
                    value={highRiskCount}
                    detail="Require closer attention"
                    icon="⚠"
                    color="bg-[#FCE4E4]"
                  />
                  <StatCard
                    label="Medium risk"
                    value={mediumRiskCount}
                    detail="Keep monitoring"
                    icon="◷"
                    color="bg-[#FFF0D9]"
                  />
                  <StatCard
                    label="Avg. recovery"
                    value={`${averageRecovery}%`}
                    detail="Across sample athletes"
                    icon="♡"
                    color="bg-[#CAECD6]"
                  />
                </section>

                <section className="mt-9">
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <h3 className="text-xl font-extrabold">
                        Athlete overview
                      </h3>
                      <p className="mt-1 text-sm text-[#7E7E82]">
                        A quick look at your team's current status.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeTab('athletes')}
                      className="self-start text-sm font-bold text-[#8062A2] transition hover:translate-x-1"
                    >
                      View all athletes →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {athletes.map((athlete) => (
                      <AthleteCard
                        key={athlete.id}
                        athlete={athlete}
                        onView={setSelectedAthlete}
                      />
                    ))}
                  </div>
                </section>

                <section className="mt-8 rounded-3xl border border-[#ECE7F1] bg-white p-5 sm:p-6">
                  <h3 className="text-lg font-extrabold">Coach's checklist</h3>
                  <p className="mt-1 text-sm text-[#7E7E82]">
                    A few things to review during your next team check-in.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => changeTab('alerts')}
                      className="rounded-2xl bg-[#FFF5E7] p-4 text-left transition hover:-translate-y-1"
                    >
                      <span className="text-xl">⚠</span>
                      <p className="mt-3 text-sm font-bold">Review risk alerts</p>
                      <p className="mt-1 text-xs text-[#7E7E82]">
                        {highRiskCount} high-risk athlete
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeTab('athletes')}
                      className="rounded-2xl bg-[#F1ECFA] p-4 text-left transition hover:-translate-y-1"
                    >
                      <span className="text-xl">♧</span>
                      <p className="mt-3 text-sm font-bold">
                        Check athlete recovery
                      </p>
                      <p className="mt-1 text-xs text-[#7E7E82]">
                        Review individual scores
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeTab('notes')}
                      className="rounded-2xl bg-[#EAF7EE] p-4 text-left transition hover:-translate-y-1"
                    >
                      <span className="text-xl">▤</span>
                      <p className="mt-3 text-sm font-bold">
                        Update coach notes
                      </p>
                      <p className="mt-1 text-xs text-[#7E7E82]">
                        Keep follow-ups organised
                      </p>
                    </button>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'athletes' && (
              <section>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by athlete or sport..."
                    aria-label="Search athletes"
                    className="min-w-0 flex-1 rounded-2xl border border-[#E8E1F0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#A17BC8] focus:ring-4 focus:ring-[#E4DBF4]/60"
                  />

                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value)}
                    aria-label="Filter athletes by risk"
                    className="rounded-2xl border border-[#E8E1F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#A17BC8]"
                  >
                    <option value="All">All risk levels</option>
                    <option value="High">High risk</option>
                    <option value="Medium">Medium risk</option>
                    <option value="Low">Low risk</option>
                  </select>
                </div>

                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">Team roster</h3>
                  <span className="text-xs text-[#7E7E82]">
                    {filteredAthletes.length} athletes
                  </span>
                </div>

                {filteredAthletes.length ? (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredAthletes.map((athlete) => (
                      <AthleteCard
                        key={athlete.id}
                        athlete={athlete}
                        onView={setSelectedAthlete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-[#D8CBE9] bg-white p-10 text-center">
                    <p className="text-lg font-bold">No athletes found</p>
                    <p className="mt-2 text-sm text-[#7E7E82]">
                      Try another search or risk filter.
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'alerts' && (
              <section>
                <div className="mb-6 rounded-3xl border border-[#F5D6D6] bg-[#FFF3F2] p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl">
                      ⚠
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#8E2929]">
                        Athlete risk monitoring
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#9A5656]">
                        Review the sample indicators below and use coaching
                        judgement before adjusting training. These illustrative
                        risk labels are not medical diagnoses.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-col gap-4 sm:flex-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search athletes..."
                    aria-label="Search risk alerts"
                    className="min-w-0 flex-1 rounded-2xl border border-[#E8E1F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#A17BC8] focus:ring-4 focus:ring-[#E4DBF4]/60"
                  />

                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value)}
                    aria-label="Filter risk alerts"
                    className="rounded-2xl border border-[#E8E1F0] bg-white px-4 py-3 text-sm outline-none focus:border-[#A17BC8]"
                  >
                    <option value="All">All alerts</option>
                    <option value="High">High risk</option>
                    <option value="Medium">Medium risk</option>
                  </select>
                </div>

                {filteredAthletes.length ? (
                  <div className="space-y-4">
                    {filteredAthletes.map((athlete) => (
                      <div
                        key={athlete.id}
                        className="rounded-3xl border border-[#ECE7F1] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold ${athlete.color}`}>
                              {athlete.initials}
                            </div>
                            <div>
                              <h3 className="font-bold">{athlete.name}</h3>
                              <p className="mt-1 text-xs text-[#7E7E82]">
                                {athlete.sport} · {athlete.injury}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getRiskStyle(athlete.risk)}`}>
                              {athlete.risk} Risk
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedAthlete(athlete)}
                              className="rounded-xl bg-[#F4F0F9] px-4 py-2.5 text-xs font-bold text-[#63477F] transition hover:bg-[#E4DBF4]"
                            >
                              Review
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <ProgressBar
                            label="Recovery"
                            value={athlete.recovery}
                          />
                          <ProgressBar
                            label="Training load"
                            value={athlete.trainingLoad}
                            color="bg-[#FDC381]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-[#D8CBE9] bg-white p-10 text-center">
                    <p className="text-lg font-bold">No matching alerts</p>
                    <p className="mt-2 text-sm text-[#7E7E82]">
                      Change the filter to see other athletes.
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'notes' && (
              <section>
                <div className="mb-6 rounded-3xl bg-[#E4DBF4] p-6">
                  <h3 className="text-xl font-extrabold">
                    Your coaching journal
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#635777]">
                    Record training observations, follow-ups and recovery
                    reminders for each athlete.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {athletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="rounded-3xl border border-[#ECE7F1] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D8CBE9]/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-bold ${athlete.color}`}>
                          {athlete.initials}
                        </div>
                        <div>
                          <h3 className="font-bold">{athlete.name}</h3>
                          <p className="mt-1 text-xs text-[#7E7E82]">
                            {athlete.sport}
                          </p>
                        </div>
                      </div>

                      <textarea
                        value={notes[athlete.id] ?? athlete.note}
                        onChange={(event) =>
                          updateNote(athlete.id, event.target.value)
                        }
                        rows={4}
                        maxLength={2000}
                        aria-label={`Coach note for ${athlete.name}`}
                        placeholder="Write your observations..."
                        className="mt-5 w-full resize-y rounded-2xl border border-[#E8E1F0] bg-[#FCFAFE] p-4 text-sm leading-6 outline-none transition focus:border-[#A17BC8] focus:ring-4 focus:ring-[#E4DBF4]/50"
                      />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] text-[#7E7E82]">
                          {storageError
                            ? 'Unable to save in this browser'
                            : notesSaved
                              ? 'Saved in this browser'
                              : 'Saving changes...'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem(
                                NOTES_STORAGE_KEY,
                                JSON.stringify(notes)
                              )
                              setStorageError(false)
                              setNotesSaved(true)
                            } catch {
                              setStorageError(true)
                              setNotesSaved(false)
                            }
                          }}
                          className="rounded-xl bg-[#E4DBF4] px-4 py-2 text-xs font-bold text-[#63477F] transition hover:scale-105 hover:bg-[#D8C8EE] active:scale-95"
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs leading-5 text-[#7E7E82]">
                  Notes are stored in this browser only. They are not shared
                  with other coaches or synced to the backend.
                </p>
              </section>
            )}
          </div>

          <footer className="mt-12 border-t border-[#ECE7F1] pt-5 text-center text-xs text-[#A09AA8] sm:text-left">
            FitNect Coach Workspace · Sample dashboard data
          </footer>
        </main>
      </div>

      <AthleteModal
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
      />
    </div>
  )
}
