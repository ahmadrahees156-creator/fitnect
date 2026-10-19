
import { useMemo, useState } from 'react'

const athletes = [
  {
    id: 1,
    name: 'Aarav Sharma',
    sport: 'Running',
    level: 'Intermediate',
    recovery: 86,
    training: 'Good',
    risk: 'Low',
    initials: 'AS',
    color: '#E4DBF4',
  },
  {
    id: 2,
    name: 'Ananya Verma',
    sport: 'Strength Training',
    level: 'Advanced',
    recovery: 62,
    training: 'Moderate',
    risk: 'Review',
    initials: 'AV',
    color: '#FDC381',
  },
  {
    id: 3,
    name: 'Kabir Singh',
    sport: 'Football',
    level: 'Beginner',
    recovery: 74,
    training: 'Good',
    risk: 'Low',
    initials: 'KS',
    color: '#CAECD6',
  },
]

const navigation = [
  'Overview',
  'My Athletes',
  'Risk Alerts',
  'Coach Notes',
]

function CoachDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [search, setSearch] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [notes, setNotes] = useState({})
  const [savedMessage, setSavedMessage] = useState('')

  const filteredAthletes = useMemo(
    () =>
      athletes.filter((athlete) =>
        `${athlete.name} ${athlete.sport}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  )

  const alerts = athletes.filter((athlete) => athlete.risk === 'Review')

  const saveNote = (athleteId, note) => {
    setNotes((previous) => ({ ...previous, [athleteId]: note }))
    setSavedMessage('Note saved for this session.')
  }

  const openAthlete = (athlete) => {
    setSelectedAthlete(athlete)
    setSavedMessage('')
  }

  return (
    <main className="min-h-screen bg-[#F8F6FB] text-[#302442]">
      <header className="sticky top-0 z-20 border-b border-[#EAE2F0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/dashboard" className="text-lg font-extrabold tracking-tight">
            Fit<span className="text-[#A17BC8]">Nect</span>
            <span className="ml-2 rounded-full bg-[#E4DBF4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#63477F]">
              Coach
            </span>
          </a>

          <a
            href="/dashboard"
            className="rounded-xl border border-[#E8DFEF] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F5EFFB]"
          >
            Athlete Dashboard →
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10">
        <section className="relative overflow-hidden rounded-[30px] bg-[#211B2B] p-7 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FDC381]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-100px] right-1/3 h-60 w-60 rounded-full bg-[#BDA4E7]/20 blur-3xl" />

          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#FDC381]">
              Coach workspace
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Help your athletes
              <br />
              <span className="text-[#FDC381]">train smarter.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Review athlete progress, monitor wellness trends and follow up
              when an athlete may need extra attention.
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('My Athletes')}
              className="mt-7 rounded-xl bg-[#FDC381] px-5 py-3 font-bold text-[#302442] transition hover:-translate-y-0.5 hover:bg-[#FFD39D]"
            >
              View my athletes →
            </button>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80">
              Training
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80">
              Recovery
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80">
              Injury-risk awareness
            </span>
          </div>
        </section>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {navigation.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setActiveTab(item)
                setSelectedAthlete(null)
              }}
              className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === item
                  ? 'bg-[#302442] text-white shadow-lg shadow-[#302442]/10'
                  : 'border border-[#EAE2F0] bg-white text-[#776A84] hover:bg-[#F1EAF8]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Assigned athletes',
              value: '03',
              detail: 'Athletes in demo data',
              color: '#E4DBF4',
            },
            {
              label: 'Need attention',
              value: String(alerts.length).padStart(2, '0'),
              detail: 'Assessments marked for review',
              color: '#FDC381',
            },
            {
              label: 'Recovery average',
              value: `${Math.round(athletes.reduce((sum, athlete) => sum + athlete.recovery, 0) / athletes.length)}%`,
              detail: 'Illustrative recovery score',
              color: '#CAECD6',
            },
            {
              label: 'Coach notes',
              value: String(Object.keys(notes).length).padStart(2, '0'),
              detail: 'Athletes with session notes',
              color: '#F9D9EF',
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-[24px] border border-[#ECE5F2] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#302442]/5"
            >
              <div className="mb-5 h-2 w-10 rounded-full" style={{ background: stat.color }} />
              <p className="text-sm font-medium text-[#92869E]">{stat.label}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-[#9A90A4]">{stat.detail}</p>
            </article>
          ))}
        </section>

        {activeTab === 'Risk Alerts' && (
          <section className="mt-8 rounded-[26px] border border-[#ECE5F2] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">Risk assessments to review</h2>
            <p className="mt-2 text-sm leading-6 text-[#8A7E96]">
              These are illustrative records, not actual ML predictions.
              Review an athlete's context before making training decisions.
            </p>

            {alerts.length === 0 ? (
              <p className="mt-6 text-sm text-[#81758D]">
                No demo alerts to review.
              </p>
            ) : (
              alerts.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  onClick={() => openAthlete(athlete)}
                  className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#F2D8B3] bg-[#FFF8ED] p-4 text-left transition hover:bg-[#FFF1DA]"
                >
                  <span>
                    <span className="block font-bold">{athlete.name}</span>
                    <span className="mt-1 block text-sm text-[#8A7E96]">
                      Assessment marked for review
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#FDC381]/40 px-3 py-1.5 text-xs font-bold">
                    Review →
                  </span>
                </button>
              ))
            )}
          </section>
        )}

        {(activeTab === 'Overview' ||
          activeTab === 'My Athletes' ||
          activeTab === 'Coach Notes') && (
          <section className="mt-8 rounded-[26px] border border-[#ECE5F2] bg-white p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
                  {activeTab === 'Coach Notes'
                    ? 'Athlete follow-ups'
                    : 'Your roster'}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {activeTab === 'Coach Notes'
                    ? 'Coach notes'
                    : activeTab === 'My Athletes'
                      ? 'My athletes'
                      : 'Athlete overview'}
                </h2>
                <p className="mt-2 text-sm text-[#92869F]">
                  Select an athlete to review their demo profile and add a note.
                </p>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search athletes..."
                aria-label="Search athletes"
                className="w-full rounded-xl border border-[#E8DFEF] bg-[#FCFAFE] px-4 py-3 text-sm outline-none transition focus:border-[#B99AD9] sm:max-w-xs"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredAthletes.map((athlete) => (
                <article
                  key={athlete.id}
                  className="rounded-[22px] border border-[#EEE7F3] p-5 transition duration-300 hover:border-[#D5C2E7] hover:shadow-lg hover:shadow-[#302442]/5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold"
                      style={{ background: athlete.color }}
                    >
                      {athlete.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{athlete.name}</h3>
                      <p className="mt-1 text-xs text-[#92869F]">
                        {athlete.sport} · {athlete.level}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        athlete.risk === 'Review'
                          ? 'bg-[#FFF0D9] text-[#87571C]'
                          : 'bg-[#E6F5EC] text-[#35724F]'
                      }`}
                    >
                      {athlete.risk === 'Review' ? 'Review' : 'Low risk'}
                    </span>
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#92869F]">Recovery score</p>
                      <p className="mt-1 text-2xl font-extrabold">
                        {athlete.recovery}
                        <span className="text-sm font-medium text-[#92869F]">/100</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAthlete(athlete)}
                      className="rounded-xl bg-[#F0E8F8] px-4 py-2.5 text-sm font-bold text-[#63477F] transition hover:bg-[#E4DBF4]"
                    >
                      View details →
                    </button>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0ECF4]">
                    <div
                      className="h-full rounded-full bg-[#B99AD9] transition-all duration-700"
                      style={{ width: `${athlete.recovery}%` }}
                    />
                  </div>
                </article>
              ))}

              {filteredAthletes.length === 0 && (
                <p className="py-8 text-sm text-[#92869F]">
                  No athletes match your search.
                </p>
              )}
            </div>
          </section>
        )}

        {selectedAthlete && (
          <section className="mt-8 rounded-[26px] border border-[#DCCDEB] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[2px] text-[#A08BAF]">
                  Athlete details · Demo
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">
                  {selectedAthlete.name}
                </h2>
                <p className="mt-2 text-sm text-[#92869F]">
                  {selectedAthlete.sport} · {selectedAthlete.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAthlete(null)}
                className="rounded-xl border border-[#E8DFEF] px-4 py-2 text-sm font-semibold hover:bg-[#F8F3FC]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F5F0FB] p-4">
                <p className="text-xs text-[#92869F]">Recovery</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {selectedAthlete.recovery}/100
                </p>
              </div>
              <div className="rounded-2xl bg-[#FFF5E7] p-4">
                <p className="text-xs text-[#92869F]">Training status</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {selectedAthlete.training}
                </p>
              </div>
              <div className="rounded-2xl bg-[#EAF6EE] p-4">
                <p className="text-xs text-[#92869F]">Assessment status</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {selectedAthlete.risk}
                </p>
              </div>
            </div>

            <label className="mt-7 block text-sm font-bold" htmlFor="coach-note">
              Coach note
            </label>
            <textarea
              id="coach-note"
              rows={4}
              value={notes[selectedAthlete.id] || ''}
              onChange={(event) => {
                setNotes((previous) => ({
                  ...previous,
                  [selectedAthlete.id]: event.target.value,
                }))
                setSavedMessage('')
              }}
              placeholder="Write a training observation or follow-up note..."
              className="mt-3 w-full resize-y rounded-2xl border border-[#E8DFEF] bg-[#FCFAFE] p-4 text-sm leading-6 outline-none transition focus:border-[#B99AD9]"
            />

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  saveNote(selectedAthlete.id, notes[selectedAthlete.id] || '')
                }
                className="rounded-xl bg-[#302442] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#49365E]"
              >
                Save note
              </button>
              {savedMessage && (
                <p role="status" className="text-sm font-medium text-[#35724F]">
                  {savedMessage}
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 rounded-2xl border border-[#EAE2F0] bg-white/70 px-5 py-4 text-xs leading-6 text-[#92869F]">
          Demo mode: athlete records, recovery scores, and review statuses are
          sample data. Notes stay in this page's current session. Real data,
          saved notes, athlete assignments, and role permissions require backend
          integration.
        </footer>
      </div>
    </main>
  )
}

export default CoachDashboard
