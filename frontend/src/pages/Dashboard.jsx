
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'

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
  {
    label: 'Recovery score',
    value: '86',
    unit: '/100',
    change: '+8%',
    color: '#CAECD6',
    description: 'Looking good today',
  },
  {
    label: 'Training load',
    value: '72',
    unit: '%',
    change: 'Balanced',
    color: '#A9CDFA',
    description: 'Within your target zone',
  },
  {
    label: 'Sleep quality',
    value: '7.8',
    unit: 'hrs',
    change: '+12%',
    color: '#E4DBF4',
    description: 'Better than yesterday',
  },
  {
    label: 'Wellness score',
    value: '91',
    unit: '/100',
    change: 'Excellent',
    color: '#FDC381',
    description: 'Keep up the routine',
  },
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
  {
    title: 'Upper body strength',
    detail: '35 min · Moderate',
    category: 'STRENGTH',
    color: '#E4DBF4',
  },
  {
    title: 'Mobility & stretching',
    detail: '15 min · Easy',
    category: 'RECOVERY',
    color: '#CAECD6',
  },
  {
    title: 'Light cardio session',
    detail: '20 min · Low impact',
    category: 'CARDIO',
    color: '#A9CDFA',
  },
]

function Dashboard() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('Overview')
  const [checkedIn, setCheckedIn] = useState(false)
  const [mood, setMood] = useState('Good')

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
    <div className="min-h-screen bg-[#F7F6FA] text-[#242333]">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[250px] flex-col overflow-y-auto border-r border-[#DED3EB] bg-[#EDE5F7] px-5 py-7 text-[#302442] transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10">
          <Brand />
          <p className="mt-2 pl-1 text-[11px] tracking-wide text-[#756781]">
            Train smart. Recover better.
          </p>
        </div>

        <p className="mb-4 pl-2 text-[10px] font-bold uppercase tracking-[2px] text-[#756781]">
          Workspace
        </p>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleNavigation(item)}
              className={`w-full rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                activeItem === item
                  ? 'bg-white font-semibold text-[#302442] shadow-sm'
                  : 'text-[#554663] hover:bg-white/70 hover:text-[#302442]'
              }`}
            >
              <span>{item}</span>

              {activeItem === item && (
                <span className="float-right mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D94DBB]" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <div className="rounded-2xl border border-[#DCD0E9] bg-white/70 p-4">
            <p className="text-xs font-bold text-[#302442]">
              Your next milestone
            </p>

            <p className="mt-2 text-xs leading-5 text-[#756781]">
              Stay consistent and complete your weekly training target.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#DED6E8]">
              <div className="h-full w-[72%] rounded-full bg-[#D94DBB]" />
            </div>

            <p className="mt-2 text-[11px] font-medium text-[#756781]">
              5 of 7 sessions
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-5 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#554663] transition hover:bg-white/70 hover:text-[#302442]"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#EAE8F0] bg-[#F7F6FA]/95 px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle sidebar"
              className="rounded-xl border border-[#E6E2ED] bg-white px-3 py-2 text-sm text-[#302442] lg:hidden"
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-[#89879B]">Your workspace</p>
              <h1 className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                {activeItem}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#302442]">
                Rahees Ahmad
              </p>
              <p className="text-xs text-[#89879B]">Athlete</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4DBF4] text-sm font-bold text-[#5F4C7D] ring-4 ring-white">
              RA
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          {activeItem === 'Overview' ? (
            <>
              <section className="relative overflow-hidden rounded-[28px] bg-[#202139] p-6 text-white sm:p-9">
                <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#F373D4]/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-[#A9CDFA]/15 blur-3xl" />

                <div className="relative z-10 max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[2px] text-[#F3A8E2]">
                    Your fitness overview
                  </p>

                  <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    Build consistency.
                    <br />
                    <span className="text-[#D8C6F6]">
                      Become stronger.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
                    Your training, recovery and wellness insights in one place.
                    Small improvements every day lead to lasting progress.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveItem('Training & Activity')}
                    className="mt-7 rounded-xl bg-[#F373D4] px-5 py-3 text-sm font-bold text-[#27152B] transition hover:-translate-y-0.5 hover:bg-[#F58DDF]"
                  >
                    Explore your training <span className="ml-2">↗</span>
                  </button>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-8 hidden h-48 w-48 items-center justify-center rounded-full border border-white/10 sm:flex lg:right-20 lg:h-60 lg:w-60">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#F373D4]/40 bg-white/[0.03] lg:h-44 lg:w-44">
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#F373D4]/10 lg:h-28 lg:w-28">
                      <span className="text-3xl font-bold text-[#F9D4F1]">
                        86
                      </span>
                      <span className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">
                        Recovery
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9995A8]">
                      Performance
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">
                      Today at a glance
                    </h2>
                  </div>

                  <span className="text-xs text-[#89879B]">
                    Demo metrics
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => (
                    <article
                      key={stat.label}
                      className="rounded-2xl border border-[#ECE9F2] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#242333]/5"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#777488]">
                          {stat.label}
                        </p>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: stat.color }}
                        />
                      </div>

                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight">
                          {stat.value}
                        </span>
                        <span className="text-sm text-[#89879B]">
                          {stat.unit}
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-semibold text-[#6B8D79]">
                        {stat.change}
                      </p>
                      <p className="mt-1 text-xs text-[#9895A7]">
                        {stat.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
                <article className="rounded-2xl border border-[#ECE9F2] bg-white p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9995A8]">
                        Activity
                      </p>
                      <h2 className="mt-1 text-lg font-bold">
                        Your weekly movement
                      </h2>
                      <p className="mt-1 text-xs text-[#89879B]">
                        Training activity throughout the week
                      </p>
                    </div>

                    <span className="rounded-lg bg-[#F1ECFA] px-3 py-2 text-xs font-semibold text-[#716087]">
                      This week
                    </span>
                  </div>

                  <div className="mt-8 flex h-48 items-end justify-between gap-3 sm:gap-5">
                    {weeklyActivity.map((day, index) => (
                      <div
                        key={day.day}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                      >
                        <div className="flex h-full w-full items-end justify-center">
                          <div
                            className="w-full max-w-[38px] rounded-t-xl rounded-b-md transition-all duration-300 hover:opacity-75"
                            style={{
                              height: `${day.value}%`,
                              backgroundColor:
                                index === 5 ? '#F373D4' : '#E4DBF4',
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-[#89879B]">
                          {day.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-[#F0EDF4] pt-4">
                    <span className="h-2 w-2 rounded-full bg-[#F373D4]" />
                    <p className="text-xs text-[#89879B]">
                      Saturday was your most active day.
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-[#ECE9F2] bg-white p-5 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9995A8]">
                    Weekly target
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    Consistency matters
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#89879B]">
                    You're building a routine. Keep showing up and progress
                    will follow.
                  </p>

                  <div className="mt-7 flex items-center gap-5">
                    <div
                      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background:
                          'conic-gradient(#F373D4 0% 72%, #F0EDF5 72% 100%)',
                      }}
                    >
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-2xl font-bold">72%</span>
                        <span className="text-[10px] text-[#89879B]">
                          Complete
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        5 of 7 sessions
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#89879B]">
                        Two more sessions to reach your weekly goal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveItem('Training & Activity')}
                    className="mt-7 w-full rounded-xl border border-[#EAE5F0] px-4 py-3 text-sm font-semibold transition hover:border-[#F373D4] hover:bg-[#FCF5FB]"
                  >
                    View training plan <span className="ml-1">→</span>
                  </button>
                </article>
              </section>

              <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-2xl border border-[#ECE9F2] bg-white p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9995A8]">
                        Recommendations
                      </p>
                      <h2 className="mt-1 text-lg font-bold">
                        Made for your routine
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveItem('AI Insights')}
                      className="text-xs font-semibold text-[#A44C93] hover:underline"
                    >
                      View insights
                    </button>
                  </div>

                  <div className="mt-5 divide-y divide-[#F0EDF4]">
                    {workouts.map((workout) => (
                      <div
                        key={workout.title}
                        className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg"
                          style={{ backgroundColor: workout.color }}
                        >
                          {workout.category === 'STRENGTH'
                            ? '↗'
                            : workout.category === 'RECOVERY'
                              ? '✳'
                              : '⌁'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold">
                            {workout.title}
                          </h3>
                          <p className="mt-1 text-xs text-[#89879B]">
                            {workout.detail}
                          </p>
                        </div>

                        <span className="hidden rounded-lg bg-[#F7F5FA] px-2 py-1 text-[9px] font-bold tracking-wide text-[#777488] sm:block">
                          {workout.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-[#ECE9F2] bg-white p-5 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#9995A8]">
                    Daily wellness
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    How are you feeling?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#89879B]">
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
                        className={`rounded-xl border px-3 py-3 text-sm transition ${
                          mood === option
                            ? 'border-[#D8C6F6] bg-[#F4EFFB] font-semibold text-[#65517D]'
                            : 'border-[#ECE9F2] text-[#554F65] hover:bg-[#FAF8FC]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckedIn(true)}
                    className="mt-4 w-full rounded-xl bg-[#202139] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303153]"
                  >
                    {checkedIn ? 'Check-in saved ✓' : 'Save check-in'}
                  </button>

                  {checkedIn && (
                    <p className="mt-3 text-xs text-[#6B8D79]">
                      Demo check-in: feeling {mood.toLowerCase()}.
                    </p>
                  )}
                </article>
              </section>

              <footer className="mt-10 border-t border-[#EAE7F0] py-6 text-center text-xs text-[#9895A7]">
                FitNect · Train smart. Recover better.
              </footer>
            </>
          ) : (
            <section className="rounded-3xl border border-[#ECE9F2] bg-white p-6 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#A44C93]">
                FitNect workspace
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                {activeItem}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#89879B]">
                This section is ready for its dedicated features. The current
                dashboard uses sample data; connect the relevant backend API
                before using it for real training or health decisions.
              </p>

              <button
                type="button"
                onClick={() => setActiveItem('Overview')}
                className="mt-6 rounded-xl bg-[#202139] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303153]"
              >
                Back to overview
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
