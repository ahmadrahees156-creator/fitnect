import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import Brand from '../components/Brand'
import TrainingActivity from '../components/TrainingActivity'

const navItems = [
  'Overview',
  'Injury Risk',
  'Wellness Check-in',
  'Training & Activity',
  'AI Insights',
  'Recovery',
  'Nutrition',
  'Profile & Settings',
]

const stats = [
  { label: 'Recovery score', value: '86', unit: '/100', change: '+8%', note: 'Looking good today', color: '#C6EAD5', icon: '↗' },
  { label: 'Training load', value: '72', unit: '%', change: 'Balanced', note: 'Within your target zone', color: '#BBD6FA', icon: '⌁' },
  { label: 'Sleep quality', value: '7.8', unit: 'hrs', change: '+12%', note: 'Better than yesterday', color: '#E3D5F5', icon: '☾' },
  { label: 'Wellness score', value: '91', unit: '/100', change: 'Excellent', note: 'Keep up the routine', color: '#F8D7A9', icon: '✳' },
]

const weeklyActivity = [
  { day: 'Mon', value: 48 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 88 },
  { day: 'Fri', value: 63 },
  { day: 'Sat', value: 95 },
  { day: 'Sun', value: 42 },
]

const workouts = [
  { title: 'Upper body strength', detail: '35 min · Moderate', category: 'STRENGTH', color: '#E7DDF7', type: 'strength' },
  { title: 'Mobility & stretching', detail: '15 min · Easy', category: 'RECOVERY', color: '#D9F0E2', type: 'recovery' },
  { title: 'Light cardio session', detail: '20 min · Low impact', category: 'CARDIO', color: '#DCE9FC', type: 'cardio' },
]

function SectionHeading({ eyebrow, title, detail, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-bold tracking-[-0.7px] text-[#302442] sm:text-2xl">
          {title}
        </h2>

        {detail && <p className="mt-1 text-sm text-[#92879F]">{detail}</p>}
      </div>

      {action}
    </div>
  )
}

function WorkoutIllustration({ type }) {
  if (type === 'strength') {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
        <circle cx="50" cy="50" r="37" fill="#D7C8F0" opacity=".55" />
        <path d="M29 37v26m-7-19v12m7-6h42m0-13v26m7-19v12" stroke="#73549B" strokeWidth="5" strokeLinecap="round" />
        <path d="M43 34l7-8 7 8m-7-8v48m-7-8l7 8 7-8" stroke="#A17BC8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'recovery') {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
        <circle cx="50" cy="50" r="37" fill="#BFE8D0" opacity=".55" />
        <circle cx="50" cy="25" r="7" fill="#4D9976" />
        <path d="M48 36l-9 18 17 6 10 17M43 43l-16 9m29 8L42 75" stroke="#4D9976" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 27c4-5 9-7 15-6m35 8c-2-5-6-9-12-11" stroke="#78B998" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
      <circle cx="50" cy="50" r="37" fill="#C9DDF9" opacity=".6" />
      <circle cx="53" cy="25" r="7" fill="#567EBD" />
      <path d="M49 36l-8 18 14 8 7 14M45 43l-15 7m25 12L39 76m18-38l13 8" stroke="#567EBD" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 30l4-5m53 2l4 5M19 68l6 2" stroke="#7FA4DC" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Dashboard() {
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('Overview')
  const [checkedIn, setCheckedIn] = useState(false)
  const [mood, setMood] = useState('Good')

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitnect_user')) || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      try {
        const response = await getCurrentUser()
        const currentUser = response.user || response.data || response

        if (active) {
          setUser(currentUser)
          localStorage.setItem('fitnect_user', JSON.stringify(currentUser))
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('fitnect_token')
    localStorage.removeItem('fitnect_user')
    navigate('/login')
  }

  const handleNavigation = (item) => {
    setActiveItem(item)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F6FB] text-[#302442]">
      <style>{`
        @keyframes fitnectFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fitnectFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes fitnectGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        .fitnect-enter { animation: fitnectFadeUp .55s ease-out both; }
        .fitnect-float { animation: fitnectFloat 5s ease-in-out infinite; }
        .fitnect-bar { transform-origin: bottom; animation: fitnectGrow .75s cubic-bezier(.2,.8,.2,1) both; }
        .fitnect-nav { transition: background .2s ease, color .2s ease, transform .2s ease; }
        .fitnect-nav:hover { transform: translateX(3px); }
        .fitnect-surface { border: 1px solid #ECE6F2; background: rgba(255,255,255,.88); }

        @media (prefers-reduced-motion: reduce) {
          .fitnect-enter, .fitnect-float, .fitnect-bar { animation: none !important; }
          .fitnect-nav { transition: none; }
        }
      `}</style>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[#21172D]/35 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[258px] flex-col overflow-y-auto border-r border-[#E5D9EF] bg-[#F0E8F8] px-5 py-7 text-[#302442] transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10">
          <Brand />
          <p className="mt-2 pl-1 text-[11px] tracking-wide text-[#887795]">
            Train smart. Recover better.
          </p>
        </div>

        <p className="mb-3 pl-3 text-[10px] font-bold uppercase tracking-[2px] text-[#A18DAD]">
          Workspace
        </p>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleNavigation(item)}
              className={`fitnect-nav flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[13px] ${
                activeItem === item
                  ? 'bg-white font-bold text-[#67468A] shadow-[0_4px_16px_rgba(74,46,97,0.06)]'
                  : 'font-medium text-[#756681] hover:bg-white/75 hover:text-[#49335D]'
              }`}
            >
              <span>{item}</span>

              {activeItem === item && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#D96CC5]" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <div className="rounded-2xl border border-[#DFD0EA] bg-white/65 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold">Weekly milestone</p>
              <span className="rounded-full bg-[#F7E6F4] px-2 py-1 text-[10px] font-bold text-[#A64D96]">
                72%
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#8A7A98]">
              Stay consistent and keep moving toward your weekly goal.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E6DCEB]">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#BB8EE4] to-[#E47ACB]" />
            </div>

            <p className="mt-2 text-[10px] font-medium text-[#8A7A98]">
              5 of 7 sessions complete
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-[#796687] transition hover:bg-white hover:text-[#9B467F]"
          >
            Log out <span className="float-right">↗</span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[258px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#EDE7F2]/90 bg-[#F8F6FB]/90 px-4 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle sidebar"
              className="rounded-xl border border-[#E8DFEF] bg-white px-3 py-2 text-sm text-[#654A7D] lg:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="text-[11px] text-[#9A8AA5]">Your workspace</p>
              <h1 className="truncate text-lg font-bold tracking-[-.5px] sm:text-xl">
                {activeItem}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">
                {user?.name || user?.fullName || 'Athlete'}
              </p>

              <p className="mt-0.5 text-[11px] text-[#998BA4]">
                {user?.email || 'Athlete workspace'}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#E4D5F4] to-[#F8D9EF] text-xs font-extrabold text-[#654A7D] shadow-sm">
              {(user?.name || user?.fullName || 'A')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          {activeItem === 'Overview' ? (
            <>
              <section className="fitnect-enter relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#29243F] via-[#393052] to-[#59406B] p-6 text-white shadow-[0_20px_55px_rgba(57,40,75,.12)] sm:p-9 lg:p-10">
                <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#F3A6E4]/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-60 w-60 rounded-full bg-[#B9A2F5]/20 blur-3xl" />

                <div className="relative z-10 max-w-[58%] max-sm:max-w-full">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#F3C5E9]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ECA5DF]" />
                    Your fitness overview
                  </div>

                  <h2 className="mt-5 text-3xl font-bold leading-[1.15] tracking-[-1.4px] sm:text-4xl lg:text-5xl">
                    Build consistency.
                    <br />
                    <span className="bg-gradient-to-r from-[#E7D5FF] to-[#F4BDE7] bg-clip-text text-transparent">
                      Become stronger.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#D4CADD] sm:text-[15px]">
                    Your training, recovery and wellness insights in one place.
                    Small improvements every day lead to lasting progress.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveItem('Training & Activity')}
                    className="mt-7 rounded-xl bg-[#F0B3E5] px-5 py-3 text-sm font-bold text-[#35223E] shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#F7C8EE] active:translate-y-0"
                  >
                    Explore your training <span className="ml-2">↗</span>
                  </button>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-[46%] items-end justify-center sm:flex">
                  <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-[#DCA7F4]/20 blur-3xl" />
                  <img
                    src="/Dashboard-3D.png"
                    alt="3D fitness athlete"
                    className="fitnect-float relative z-10 h-[95%] max-h-[460px] w-full object-contain object-bottom drop-shadow-[0_12px_30px_rgba(20,10,35,0.25)]"
                  />
                </div>
              </section>

              <section className="fitnect-enter mt-9" style={{ animationDelay: '80ms' }}>
                <SectionHeading
                  eyebrow="Performance"
                  title="Today at a glance"
                  detail="A snapshot of your recent activity"
                  action={
                    <span className="rounded-full border border-[#E9E0F0] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#92829E]">
                      SAMPLE DATA
                    </span>
                  }
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => (
                    <article
                      key={stat.label}
                      className="group relative overflow-hidden rounded-2xl border border-[#ECE6F2] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#D9C6E9] hover:shadow-[0_15px_35px_rgba(72,46,94,.07)]"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl transition duration-300 group-hover:opacity-70"
                        style={{ backgroundColor: stat.color }}
                      />

                      <div className="relative flex items-start justify-between gap-3">
                        <p className="text-xs font-medium text-[#91849D]">{stat.label}</p>
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-[#5F4B74]"
                          style={{ backgroundColor: stat.color }}
                        >
                          {stat.icon}
                        </span>
                      </div>

                      <div className="relative mt-5 flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-[-1px] text-[#302442]">
                          {stat.value}
                        </span>
                        <span className="text-xs font-medium text-[#9D91A7]">{stat.unit}</span>
                      </div>

                      <div className="relative mt-4 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#F1EAF7] px-2.5 py-1 text-[10px] font-bold text-[#775B91]">
                          {stat.change}
                        </span>
                        <span className="text-right text-[10px] text-[#9B90A5]">{stat.note}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="fitnect-enter mt-9 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]" style={{ animationDelay: '150ms' }}>
                <article className="fitnect-surface rounded-[24px] p-5 sm:p-7">
                  <SectionHeading
                    eyebrow="Activity"
                    title="Your weekly movement"
                    detail="Training activity throughout the week"
                    action={
                      <span className="rounded-xl bg-[#F3EDF9] px-3 py-2 text-[10px] font-bold text-[#806991]">
                        THIS WEEK
                      </span>
                    }
                  />

                  <div className="relative mt-8">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-7">
                      {[100, 75, 50, 25].map((line) => (
                        <div key={line} className="border-t border-dashed border-[#EEE8F3]" />
                      ))}
                    </div>

                    <div className="relative flex h-48 items-end justify-between gap-2 sm:gap-4">
                      {weeklyActivity.map((day, index) => (
                        <div key={day.day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3">
                          <div className="relative flex h-full w-full items-end justify-center">
                            <div
                              className={`fitnect-bar w-full max-w-[38px] rounded-t-[10px] rounded-b-[4px] transition duration-300 group-hover:brightness-95 ${
                                index === 5
                                  ? 'bg-gradient-to-t from-[#BD86DE] to-[#EAA8E0] shadow-[0_5px_15px_rgba(191,132,220,.25)]'
                                  : 'bg-gradient-to-t from-[#E6D9F1] to-[#F0E8F8]'
                              }`}
                              style={{ height: `${day.value}%`, animationDelay: `${index * 65}ms` }}
                            />

                            <span className="absolute -top-6 hidden rounded-md bg-[#332544] px-2 py-1 text-[9px] text-white group-hover:block">
                              {day.value}%
                            </span>
                          </div>

                          <span className={`text-[10px] ${index === 5 ? 'font-bold text-[#A65DA7]' : 'text-[#A095AA]'}`}>
                            {day.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EAF4] pt-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#DCA0DD]" />
                      <p className="text-xs text-[#92869D]">Saturday was your most active day.</p>
                    </div>
                    <span className="text-xs font-bold text-[#70517F]">Peak: 95%</span>
                  </div>
                </article>

                <article className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#EDE3F7] to-[#F7EAF5] p-5 sm:p-7">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/70 blur-2xl" />

                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#9B7CB0]">Weekly target</p>
                    <h2 className="mt-2 text-xl font-bold tracking-[-.7px] text-[#382749]">Consistency matters</h2>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#8D7C9C]">
                      You're building a routine. Keep showing up and progress will follow.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-5">
                      <div
                        className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'conic-gradient(#C17CD3 0% 72%, #E3D8EB 72% 100%)' }}
                      >
                        <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-[#F5EDF9]">
                          <span className="text-2xl font-bold tracking-tight text-[#483256]">72%</span>
                          <span className="text-[9px] text-[#9987A6]">Complete</span>
                        </div>
                      </div>

                      <div className="min-w-[120px] flex-1">
                        <p className="text-sm font-bold text-[#493456]">5 of 7 sessions</p>
                        <p className="mt-2 text-xs leading-5 text-[#93819F]">
                          Two more sessions to reach your weekly goal.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveItem('Training & Activity')}
                      className="mt-7 w-full rounded-xl border border-[#DCCAE8] bg-white/65 px-4 py-3 text-sm font-bold text-[#6C4A81] transition hover:border-[#C08BD5] hover:bg-white"
                    >
                      View training plan <span className="ml-1">→</span>
                    </button>
                  </div>
                </article>
              </section>

              <section className="fitnect-enter mt-9 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]" style={{ animationDelay: '220ms' }}>
                <article className="fitnect-surface rounded-[24px] p-5 sm:p-7">
                  <SectionHeading
                    eyebrow="Recommendations"
                    title="Made for your routine"
                    detail="A few ideas for your next session"
                    action={
                      <button
                        type="button"
                        onClick={() => setActiveItem('AI Insights')}
                        className="text-xs font-bold text-[#A456A2] transition hover:text-[#7F3D80]"
                      >
                        View insights ↗
                      </button>
                    }
                  />

                  <div className="divide-y divide-[#F0EAF4]">
                    {workouts.map((workout) => (
                      <div key={workout.title} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div
                          className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl transition duration-300 group-hover:scale-[1.03]"
                          style={{ backgroundColor: workout.color }}
                        >
                          <WorkoutIllustration type={workout.type} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold tracking-[1.2px] text-[#A18EAF]">{workout.category}</span>
                          <h3 className="mt-1 text-sm font-bold text-[#40304F]">{workout.title}</h3>
                          <p className="mt-1 text-xs text-[#9B8DA5]">{workout.detail}</p>
                        </div>

                        <span className="text-lg text-[#B39AC3] transition group-hover:translate-x-1 group-hover:text-[#925AA9]">→</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="fitnect-surface rounded-[24px] p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E3F3] text-xl text-[#A65AA1]">✳</div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#A88AAB]">Daily wellness</p>
                      <h2 className="mt-1 text-xl font-bold tracking-[-.6px] text-[#302442]">How are you feeling?</h2>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#978AA1]">
                    A quick check-in helps you reflect on your day.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {['Great', 'Good', 'Okay', 'Tired'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setMood(option)
                          setCheckedIn(false)
                        }}
                        className={`rounded-xl border px-3 py-3 text-sm transition duration-200 ${
                          mood === option
                            ? 'border-[#D8B6E8] bg-[#F5EBFA] font-bold text-[#77508F] shadow-sm'
                            : 'border-[#EDE6F2] bg-white text-[#8B7B98] hover:border-[#DCC7E8] hover:bg-[#FCF9FD]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckedIn(true)}
                    className="mt-4 w-full rounded-xl bg-[#332743] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#48345B] active:translate-y-0"
                  >
                    {checkedIn ? 'Check-in saved ✓' : 'Save check-in'}
                  </button>

                  {checkedIn && (
                    <p role="status" className="mt-3 rounded-xl bg-[#EAF6EE] px-3 py-2 text-xs font-medium text-[#4F8966]">
                      Demo check-in: feeling {mood.toLowerCase()}.
                    </p>
                  )}

                  <p className="mt-3 text-[10px] leading-4 text-[#AA9DB3]">
                    Demo interaction · Check-ins are not saved to your account.
                  </p>
                </article>
              </section>

              <footer className="mt-10 border-t border-[#EDE6F2] py-6 text-center text-[11px] text-[#A194AC]">
                FitNect <span className="mx-1">·</span> Train smart. Recover better.
              </footer>
            </>
          ) : activeItem === 'Training & Activity' ? (
            <TrainingActivity />
          ) : (
            <section className="fitnect-enter relative overflow-hidden rounded-[28px] border border-[#EAE1F1] bg-white p-6 sm:p-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#EADBF7] opacity-60 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E5F8] text-2xl text-[#9469B2]">⚡</div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-[2px] text-[#A66BA7]">FitNect workspace</p>

                <h2 className="mt-2 text-3xl font-bold tracking-[-1px] text-[#302442]">{activeItem}</h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#92849D]">
                  This section is ready for its dedicated features. The current dashboard uses sample data; connect the relevant backend API before using it for real training or health decisions.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveItem('Overview')}
                  className="mt-7 rounded-xl bg-[#332743] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4A365D]"
                >
                  ← Back to overview
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard