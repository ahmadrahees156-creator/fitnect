
import { useState } from 'react'

const C = {
  lavender: '#E4DBF4',
  peach: '#FDC381',
  blue: '#A9CDFA',
  mint: '#CAECD6',
  pink: '#F373D4',
  ink: '#151517',
  purple: '#7855A6',
  paper: '#F6F2FA',
}

const features = [
  {
    no: '01',
    title: 'Daily wellness',
    description: 'Track sleep, soreness, mood and energy to understand how you feel each day.',
    tag: 'KNOW YOUR BASELINE',
    color: C.mint,
    visual: 'wellness',
  },
  {
    no: '02',
    title: 'Training insights',
    description: 'Explore activity patterns and understand how your training changes over time.',
    tag: 'SEE THE BIGGER PICTURE',
    color: C.blue,
    visual: 'training',
  },
  {
    no: '03',
    title: 'Injury risk awareness',
    description: 'Notice changes in your routine that may deserve closer attention.',
    tag: 'PAY ATTENTION TO SIGNALS',
    color: C.peach,
    visual: 'risk',
  },
  {
    no: '04',
    title: 'Recovery tracking',
    description: 'Make rest and recovery an intentional part of your training routine.',
    tag: 'REST IS PART OF THE PLAN',
    color: C.lavender,
    visual: 'recovery',
  },
  {
    no: '05',
    title: 'What-if simulator',
    description: 'Compare hypothetical training scenarios and explore possible adjustments.',
    tag: 'EXPLORE YOUR OPTIONS',
    color: '#F5D8ED',
    visual: 'simulator',
  },
  {
    no: '06',
    title: 'Nutrition & hydration',
    description: 'Build consistent habits that support your everyday wellness.',
    tag: 'SMALL HABITS ADD UP',
    color: C.mint,
    visual: 'nutrition',
  },
]

const steps = [
  {
    no: '01',
    title: 'Check in with yourself.',
    text: 'Record how you feel, how you slept and how your body is recovering.',
    color: C.mint,
  },
  {
    no: '02',
    title: 'Connect the signals.',
    text: 'Bring wellness and training information together to understand patterns.',
    color: C.blue,
  },
  {
    no: '03',
    title: 'Make informed decisions.',
    text: 'Use the bigger picture to guide thoughtful training and recovery choices.',
    color: C.peach,
  },
]



function Brand() {
  return (
    <a href="#home" className="group inline-flex shrink-0 items-center gap-3">
      <img
        src="/fitnect-logo.png"
        alt="FitNect logo"
        className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
      />

      <span className="text-2xl font-black tracking-[-1.5px]">
        FitNect<span className="text-[#F373D4]">.</span>
      </span>
    </a>
  )
}


function Arrow({ diagonal = false }) {
  return (
    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
      {diagonal ? '↗' : '→'}
    </span>
  )
}

function Label({ children, light = false }) {
  return (
    <div
      className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[.22em] sm:text-xs ${
        light ? 'text-[#CAECD6]' : 'text-[#7855A6]'
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#F373D4]" />
      {children}
    </div>
  )
}

function OrbitalArtwork() {
  return (
    <div className="hero-art relative mx-auto aspect-square w-full max-w-[650px]">
      <div className="absolute inset-[12%] rounded-full bg-[#A9CDFA]/40 blur-[75px]" />
      <div className="absolute inset-[24%] rounded-full bg-[#F373D4]/20 blur-[60px]" />

      <div className="absolute inset-[7%] rounded-full border border-black/10" />
      <div className="absolute inset-[15%] rounded-full border border-dashed border-[#7855A6]/30" />
      <div className="absolute inset-[24%] rounded-full border border-white/80" />

      <div className="orbit-ring absolute left-1/2 top-1/2 h-[85%] w-[43%] rounded-[48%] border-[18px] border-[#7855A6]/75 sm:border-[28px]" />

      <div className="orbit-ring orbit-ring-two absolute left-1/2 top-1/2 h-[70%] w-[53%] rounded-[45%] border-[16px] border-[#F373D4] sm:border-[24px]" />

      <div className="orbit-ring orbit-ring-three absolute left-1/2 top-1/2 h-[56%] w-[56%] rounded-[40%] border-[18px] border-[#A9CDFA] sm:border-[28px]" />

      {/* Keep the athlete above the animated rings. */}
      <div className="athlete-float absolute inset-0 z-10 flex items-center justify-center">
        <img
          src="/athlete-3d.png"
          alt="3D athlete representing sports wellness and performance"
          className="athlete-image h-[110%] w-[88%] max-w-none object-contain object-center"
          draggable="false"
        />
      </div>

      <span className="hero-float absolute left-[5%] top-[25%] z-20 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-[#CAECD6] text-2xl shadow-xl sm:h-16 sm:w-16">
        ♡
      </span>

      <span
        className="hero-float absolute right-[6%] top-[27%] z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-[#FDC381] text-2xl shadow-xl"
        style={{ animationDelay: '-2s' }}
      >
        ↗
      </span>

      <span
        className="hero-float absolute bottom-[17%] left-[10%] z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-[#F373D4] text-2xl shadow-xl"
        style={{ animationDelay: '-3s' }}
      >
        ◷
      </span>

      <span
        className="hero-float absolute bottom-[14%] right-[10%] z-20 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-[#CAECD6] text-2xl shadow-xl"
        style={{ animationDelay: '-1s' }}
      >
        +
      </span>

      <span className="absolute left-0 top-[49%] z-20 rounded-full border border-white bg-white/90 px-3 py-2 text-[9px] font-black tracking-wider shadow-lg sm:px-4 sm:text-[10px]">
        WELLNESS
      </span>

      <span className="absolute right-0 top-[57%] z-20 rounded-full border border-white bg-white/90 px-3 py-2 text-[9px] font-black tracking-wider shadow-lg sm:px-4 sm:text-[10px]">
        RECOVERY
      </span>

      <span className="absolute left-[40%] top-[5%] h-3 w-3 rounded-full bg-[#F373D4]" />
      <span className="absolute bottom-[5%] right-[40%] h-3 w-3 rounded-full bg-[#7855A6]" />
    </div>
  )
}

function FeatureVisual({ type }) {
  if (type === 'wellness') {
    return (
      <div className="relative h-32">
        <div className="absolute left-3 top-4 h-24 w-24 rounded-full border-[12px] border-white/65" />
        <div className="feature-float absolute left-10 top-1 flex h-20 w-20 items-center justify-center rounded-[27px] bg-[#7855A6] text-4xl text-white shadow-xl">
          ♡
        </div>
        <div className="absolute left-20 top-[65px] z-10 rounded-2xl border border-white bg-white/95 px-3 py-2 shadow-xl">
          <span className="text-[8px] font-black tracking-widest text-black/45">
            DAILY CHECK-IN
          </span>
          <p className="mt-1 text-xs font-black">How do you feel?</p>
        </div>
      </div>
    )
  }

  if (type === 'training') {
    const bars = [35, 62, 45, 82, 56, 94, 69, 78, 48]

    return (
      <div className="relative flex h-32 items-end gap-2 overflow-hidden rounded-2xl bg-white/45 p-3">
        {bars.map((height, index) => (
          <div
            key={index}
            className="feature-bar flex-1 rounded-t-lg"
            style={{
              height: `${height}%`,
              backgroundColor: [C.blue, C.mint, C.purple, C.peach][index % 4],
              animationDelay: `${index * 70}ms`,
            }}
          />
        ))}
        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[8px] font-black shadow">
          ACTIVITY ↗
        </span>
      </div>
    )
  }

  if (type === 'risk') {
    return (
      <div className="relative flex h-32 items-center justify-center">
        <div className="feature-spin absolute h-28 w-28 rounded-full border border-dashed border-black/25" />
        <div className="absolute h-20 w-20 rounded-full border-[10px] border-white/70" />
        <div className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDC381] text-3xl shadow-lg">
          ◎
        </div>
        <span className="absolute right-0 top-1 rounded-xl bg-white px-2 py-2 text-[8px] font-black shadow-lg">
          NOTICE PATTERNS
        </span>
      </div>
    )
  }

  if (type === 'recovery') {
    return (
      <div className="relative flex h-32 items-center justify-center">
        <div className="absolute h-28 w-28 rounded-full border-2 border-white/80" />
        <div className="feature-spin-slow absolute h-20 w-20 rounded-full border-[9px] border-[#7855A6]/50 border-r-[#F373D4]" />
        <div className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-lg">
          ◷
        </div>
        <span className="absolute bottom-0 right-0 rounded-xl bg-white px-2 py-2 text-[8px] font-black shadow">
          REST COUNTS
        </span>
      </div>
    )
  }

  if (type === 'simulator') {
    return (
      <div className="relative flex h-32 items-center justify-center">
        <div className="feature-plan absolute left-0 top-3 h-20 w-[48%] -rotate-6 rounded-2xl border border-white bg-white/80 p-3 shadow-md">
          <span className="text-[8px] font-black">PLAN A</span>
          <div className="mt-2 flex h-8 items-end gap-1">
            {[35, 70, 50, 85].map((height, index) => (
              <span
                key={index}
                className="w-3 rounded-t"
                style={{ height: `${height}%`, backgroundColor: C.blue }}
              />
            ))}
          </div>
        </div>

        <div className="feature-plan absolute right-0 top-6 h-20 w-[48%] rotate-6 rounded-2xl border border-white bg-white p-3 shadow-xl">
          <span className="text-[8px] font-black">PLAN B</span>
          <div className="mt-2 flex h-8 items-end gap-1">
            {[45, 55, 40, 65].map((height, index) => (
              <span
                key={index}
                className="w-3 rounded-t"
                style={{ height: `${height}%`, backgroundColor: C.pink }}
              />
            ))}
          </div>
        </div>

        <span className="absolute bottom-0 z-10 rounded-full bg-[#151517] px-3 py-1.5 text-[8px] font-black text-white">
          COMPARE SCENARIOS
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex h-32 items-center justify-center">
      <div className="feature-float absolute left-5 top-2 h-24 w-24 rounded-[30px] bg-[#A9CDFA] shadow-lg" />
      <div className="absolute left-11 top-8 flex h-20 w-20 items-center justify-center rounded-[26px] bg-white text-4xl shadow-xl">
        +
      </div>
      <div className="absolute right-0 top-4 rounded-xl bg-white px-3 py-3 shadow-lg">
        <p className="text-[8px] font-black tracking-widest text-black/45">
          DAILY HABIT
        </p>
        <p className="mt-1 text-xs font-black">Stay consistent</p>
      </div>
    </div>
  )
}

function FeatureCard({ feature, index, active, onSelect }) {
  const selected = active === index

  return (
    <article
      onMouseEnter={() => onSelect(index)}
      onMouseLeave={() => onSelect(-1)}
      className={`feature-card group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[28px] border border-white/90 p-5 sm:min-h-[350px] sm:rounded-[30px] sm:p-6 ${
        selected
          ? '-translate-y-2 shadow-[0_24px_50px_rgba(60,40,90,.16)]'
          : 'shadow-[0_7px_24px_rgba(60,40,90,.05)]'
      }`}
      style={{
        backgroundColor: feature.color,
        animationDelay: `${index * 90}ms`,
      }}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/45 blur-2xl transition-transform duration-700 ${
          selected ? 'scale-150' : ''
        }`}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[.18em] text-black/45">
          {feature.no} / FITNECT
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg transition-transform duration-500 ${
            selected ? 'rotate-45' : ''
          }`}
        >
          ↗
        </span>
      </div>

      <h3 className="relative mt-4 text-2xl font-black leading-tight tracking-[-.05em] sm:text-[27px]">
        {feature.title}
      </h3>

      <p className="relative mt-2 text-xs leading-6 text-black/65 sm:text-sm">
        {feature.description}
      </p>

      <div className="relative mt-auto pt-3">
        <FeatureVisual type={feature.visual} />
      </div>

      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          selected ? 'mt-2 max-h-6 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <span className="text-[8px] font-black tracking-[.16em] text-black/55">
          {feature.tag}
        </span>
      </div>
    </article>
  )
}

function Landing() {
  const [activeFeature, setActiveFeature] = useState(-1)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main
      id="home"
      className="min-h-screen overflow-hidden bg-[#E4DBF4] text-[#151517] selection:bg-[#F373D4]/40"
    >
      <style>{`
        @keyframes fitEnter {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fitFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }

        @keyframes fitOrbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes fitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fitMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes fitBar {
          from { transform: scaleY(.12); opacity: .25; }
          to { transform: scaleY(1); opacity: 1; }
        }

        @keyframes athleteHover {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }

        .fit-enter {
          animation: fitEnter .8s cubic-bezier(.2,.7,.2,1) both;
        }

        .fit-hero-art {
          animation: fitEnter 1s .12s cubic-bezier(.2,.7,.2,1) both;
        }

        .orbit-ring {
          transform: translate(-50%, -50%);
          animation: fitOrbit 25s linear infinite;
        }

        .orbit-ring-two { animation-duration: 32s; }
        .orbit-ring-three { animation-duration: 20s; }

        .hero-float, .feature-float {
          animation: fitFloat 5s ease-in-out infinite;
        }

        .athlete-float {
          animation: athleteHover 5s ease-in-out infinite;
          pointer-events: none;
        }

        .athlete-image {
          position: relative;
          z-index: 10;
          filter: drop-shadow(0 24px 35px rgba(80,55,115,.2));
        }

        .feature-spin { animation: fitSpin 16s linear infinite; }
        .feature-spin-slow { animation: fitSpin 12s linear infinite; }

        .feature-bar {
          transform-origin: bottom;
          animation: fitBar .8s both;
        }

        .feature-card {
          animation: fitEnter .65s cubic-bezier(.2,.7,.2,1) both;
          transition: transform .35s, box-shadow .35s;
        }

        .feature-plan { transition: transform .45s ease; }

        .feature-card:hover .feature-plan:first-child {
          transform: translateX(-4px) rotate(-10deg);
        }

        .feature-card:hover .feature-plan:nth-child(2) {
          transform: translateX(4px) rotate(10deg);
        }

        .fit-marquee { animation: fitMarquee 32s linear infinite; }
        .fit-marquee:hover { animation-play-state: paused; }

        @media (max-width: 640px) {
          .athlete-image {
            height: 105%;
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

   
<header className="sticky top-0 z-50 border-b border-white/60 bg-[#E4DBF4]/85 backdrop-blur-2xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">

    {/* Logo */}
    <div onClick={() => setMenuOpen(false)} className="shrink-0">
      <Brand />
    </div>

    {/* Desktop Navigation */}
    <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/45 p-1.5 shadow-sm md:flex">
      <a
        href="#about"
        className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#51465F] transition-all duration-300 hover:bg-white hover:text-[#7855A6]"
      >
        Our approach
      </a>

      <a
        href="#features"
        className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#51465F] transition-all duration-300 hover:bg-white hover:text-[#7855A6]"
      >
        Features
      </a>

      <a
        href="#how-it-works"
        className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#51465F] transition-all duration-300 hover:bg-white hover:text-[#7855A6]"
      >
        How it works
      </a>
    </nav>

    {/* Desktop Actions */}
    <div className="hidden items-center gap-3 md:flex">
      <a
        href="/login"
        className="rounded-full px-5 py-3 text-sm font-bold text-[#51465F] transition-all duration-300 hover:bg-white/70 hover:text-[#7855A6]"
      >
        Log in
      </a>

      <a
        href="/register"
        className="group inline-flex items-center gap-2 rounded-full bg-[#151517] px-5 py-3 text-sm font-bold text-white shadow-md shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7855A6] hover:shadow-lg"
      >
    Register
        <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
          ↗
        </span>
      </a>
    </div>

    {/* Mobile Menu Button */}
    <button
      type="button"
      aria-label={menuOpen ? "Close navigation" : "Open navigation"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(!menuOpen)}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-white/70 text-xl text-[#151517] shadow-sm transition-all duration-300 hover:bg-white md:hidden"
    >
      {menuOpen ? "×" : "☰"}
    </button>
  </div>

  {/* Mobile Navigation */}
  <div
    className={`grid transition-all duration-300 ease-in-out md:hidden ${
      menuOpen
        ? "grid-rows-[1fr] opacity-100"
        : "pointer-events-none grid-rows-[0fr] opacity-0"
    }`}
  >
    <div className="overflow-hidden">
      <nav className="mx-4 mb-4 rounded-3xl border border-white/80 bg-white/75 p-3 shadow-xl shadow-[#7855A6]/10 backdrop-blur-2xl">
        <a
          href="#about"
          onClick={() => setMenuOpen(false)}
          className="block rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#51465F] transition hover:bg-[#F1ECFA] hover:text-[#7855A6]"
        >
          Our approach
        </a>

        <a
          href="#features"
          onClick={() => setMenuOpen(false)}
          className="block rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#51465F] transition hover:bg-[#F1ECFA] hover:text-[#7855A6]"
        >
          Features
        </a>

        <a
          href="#how-it-works"
          onClick={() => setMenuOpen(false)}
          className="block rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#51465F] transition hover:bg-[#F1ECFA] hover:text-[#7855A6]"
        >
          How it works
        </a>

        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-black/10 pt-3">
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center rounded-full border border-[#7855A6]/20 bg-white px-4 py-3.5 text-sm font-bold text-[#7855A6] transition hover:bg-[#F1ECFA]"
          >
            Log in
          </a>

          <a
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center justify-center gap-2 rounded-full bg-[#FDC381] px-4 py-3.5 text-sm font-bold text-[#151517] transition hover:bg-[#F8B466]"
          >
            Get Started
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              ↗
            </span>
          </a>
        </div>
      </nav>
    </div>
  </div>
</header>


      <section className="relative isolate mx-auto grid max-w-[1600px] items-center gap-8 px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:min-h-[740px] lg:grid-cols-[.92fr_1.08fr] lg:gap-0 lg:px-14 lg:py-12">
        <div className="pointer-events-none absolute -left-36 top-20 -z-10 h-96 w-96 rounded-full bg-[#F373D4]/20 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-96 w-96 rounded-full bg-[#A9CDFA]/35 blur-[100px]" />

        <div className="fit-enter relative z-10">
          <Label>ATHLETE WELLNESS, REIMAGINED</Label>

          <h1 className="mt-8 text-[clamp(3.6rem,7.5vw,7.3rem)] font-black leading-[.86] tracking-[-.085em]">
            Listen
            <br />
            to your
            <br />
            <span className="relative inline-block pb-3">
              body<span className="text-[#7855A6]">.</span>
              <span className="absolute bottom-1 left-0 -z-10 h-[14%] w-full -rotate-2 rounded-full bg-[#FDC381]" />
            </span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-black/65 sm:text-lg">
            Performance is more than what happens during a workout. Understand
            your wellness, training and recovery as parts of one bigger picture.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#features"
              className="group inline-flex items-center gap-4 rounded-full bg-[#151517] px-7 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Explore the platform <Arrow diagonal />
            </a>

            <a
              href="#about"
              className="group inline-flex items-center gap-2 py-3 text-sm font-bold"
            >
              Our philosophy <Arrow />
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4 border-t border-black/15 pt-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#CAECD6] text-xl">
              ♡
            </div>
            <div>
              <p className="text-sm font-black">Your body has a story.</p>
              <p className="mt-1 text-xs text-black/55">
                Explore the signals behind your routine.
              </p>
            </div>
          </div>
        </div>

        <div className="fit-hero-art relative mx-auto w-full max-w-[650px] lg:ml-auto">
          <OrbitalArtwork />

          <div className="hero-float absolute right-[1%] top-[7%] z-20 hidden rounded-2xl border border-white bg-white/85 p-4 shadow-lg backdrop-blur-md sm:block">
            <p className="text-[9px] font-black tracking-[.16em] text-black/45">
              A MORE COMPLETE VIEW
            </p>
            <p className="mt-2 text-sm font-black">Beyond the workout.</p>
          </div>

          <div
            className="hero-float absolute bottom-[3%] right-[2%] z-20 hidden rounded-2xl border border-white bg-white/85 p-4 shadow-lg backdrop-blur-md sm:block"
            style={{ animationDelay: '-3s' }}
          >
            <p className="text-[9px] font-black tracking-[.16em] text-black/45">
              THE FITNECT MINDSET
            </p>
            <p className="mt-2 text-sm font-black">Train with awareness.</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-black/10 bg-[#151517] py-5 text-white">
        <div className="fit-marquee flex w-max items-center gap-7 whitespace-nowrap">
          {[0, 1, 2, 3].map((group) => (
            <div key={group} className="flex items-center gap-7">
              {['WELLNESS', 'TRAINING', 'RECOVERY', 'AWARENESS', 'CONSISTENCY'].map(
                (word, index) => (
                  <div key={word} className="flex items-center gap-7">
                    <span className="text-xs font-black tracking-[.22em] sm:text-sm">
                      {word}
                    </span>
                    <span
                      className="text-xl"
                      style={{
                        color: [C.pink, C.mint, C.peach, C.blue, C.lavender][index],
                      }}
                    >
                      ●
                    </span>
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <Label>THE BIGGER PICTURE</Label>
            <h2 className="mt-7 text-4xl font-black leading-[1.04] tracking-[-.06em] sm:text-6xl">
              You are
              <br />
              <span className="text-[#7855A6]">not just</span>
              <br />
              your stats.
            </h2>
          </div>

          <div className="lg:pt-12">
            <p className="max-w-2xl text-2xl font-semibold leading-relaxed tracking-[-.035em] sm:text-3xl">
              Your sleep. Your energy. Your training. Your recovery. They all
              belong in the same conversation.
            </p>

            <p className="mt-6 max-w-xl text-sm leading-8 text-black/60 sm:text-base">
              FitNect brings these everyday signals together to help athletes
              develop a clearer understanding of their routines. Instead of
              chasing a single number, start noticing how the pieces connect.
            </p>

            <div className="mt-10 grid grid-cols-2 border-t border-black/15 sm:grid-cols-4">
              {[
                ['01', 'Notice', C.mint],
                ['02', 'Connect', C.blue],
                ['03', 'Reflect', C.peach],
                ['04', 'Adapt', C.pink],
              ].map(([number, label, color]) => (
                <div
                  key={number}
                  className="border-b border-black/15 py-5 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black"
                    style={{ backgroundColor: color }}
                  >
                    {number}
                  </span>
                  <p className="mt-4 text-base font-black sm:text-lg">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="relative w-full overflow-hidden bg-[#F6F2FA] px-5 py-20 sm:px-8 sm:py-28 lg:px-14 lg:py-32"
      >
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#E4DBF4] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-20 h-80 w-80 rounded-full bg-[#F373D4]/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1600px]">
          <div className="grid gap-6 border-b border-black/15 pb-10 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-12">
            <div>
              <Label>MADE FOR THE WHOLE ATHLETE</Label>
              <h2 className="mt-7 text-4xl font-black leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl">
                Six ways to
                <br />
                <span className="text-[#7855A6]">understand more.</span>
              </h2>
            </div>

            <p className="max-w-xs text-sm leading-7 text-black/60">
              Different parts of your routine. One more connected perspective.
            </p>
          </div>

          <div className="mt-10 grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.65fr)] lg:gap-8 xl:gap-10">
            <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[30px] bg-[#151517] p-7 text-white sm:min-h-[480px] sm:p-9 lg:sticky lg:top-8 lg:min-h-[720px] lg:self-start">
              <div className="absolute -right-14 top-16 h-64 w-64 rounded-full border-[26px] border-[#7855A6]/80 animate-[fitSpin_28s_linear_infinite]" />
              <div className="absolute -right-2 top-28 h-52 w-52 rounded-full border-[22px] border-[#F373D4] animate-[fitSpin_21s_linear_infinite]" />
              <div className="absolute right-12 top-44 h-32 w-32 rotate-12 rounded-[35%] bg-gradient-to-br from-[#A9CDFA] via-[#FDC381] to-[#F373D4] shadow-[0_0_60px_rgba(243,115,212,.3)]" />
              <div className="absolute right-[95px] top-[190px] z-10 text-4xl font-black text-[#151517]">
                f.
              </div>

              <div className="relative z-20 flex flex-1 flex-col justify-between">
                <Label light>THE FITNECT APPROACH</Label>

                <div className="mt-24 sm:mt-36 lg:mt-auto">
                  <p className="text-sm text-white/60">More than a workout.</p>
                  <h3 className="mt-3 max-w-sm text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl">
                    Every signal is part of your story.
                  </h3>
                  <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                    Build a clearer picture of your training, wellness and recovery.
                  </p>
                  <a
                    href="#how-it-works"
                    className="group mt-7 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black text-[#151517] transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    Explore how <Arrow diagonal />
                  </a>
                </div>
              </div>

              <div className="relative z-20 mt-8 flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-[9px] font-black tracking-[.2em] text-white/50">
                  WELLNESS / TRAINING / RECOVERY
                </span>
                <span className="text-xl text-[#F373D4]">↗</span>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-5 lg:gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.no}
                  className={`min-w-0 ${
                    index === 1 ? 'sm:translate-y-5' : ''
                  } ${index === 4 ? 'sm:translate-y-3' : ''}`}
                >
                  <FeatureCard
                    feature={feature}
                    index={index}
                    active={activeFeature}
                    onSelect={setActiveFeature}
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-xs leading-6 text-black/45">
            Injury-risk awareness supports reflection, not medical diagnosis.
            Predictive insights require validated models and suitable athlete data.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1500px]">
          <Label>A SIMPLE PRACTICE</Label>

          <div className="mt-7 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <h2 className="text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-6xl">
                Small
                <br />
                check-ins.
                <br />
                <span className="text-[#7855A6]">Bigger picture.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-8 text-black/60 sm:text-base">
                A straightforward process designed around everyday athlete
                wellness, not complicated dashboards.
              </p>
            </div>

            <div className="border-t border-black/15">
              {steps.map((step) => (
                <article
                  key={step.no}
                  className="group grid grid-cols-[55px_1fr] gap-4 border-b border-black/15 py-7 sm:grid-cols-[75px_1fr] sm:gap-6 sm:py-9"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-black transition-transform duration-300 group-hover:rotate-12"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.no}
                  </span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-sm leading-7 text-black/60">
                      {step.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-14">
        <div className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[32px] bg-[#FDC381] px-6 py-16 sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[45px] border-white/25" />
          <div className="pointer-events-none absolute -bottom-32 right-[20%] h-80 w-80 rounded-full border-[35px] border-[#F373D4]/30" />

          <div className="relative max-w-4xl">
            <Label>YOUR JOURNEY, YOUR SIGNALS</Label>
            <h2 className="mt-7 text-4xl font-black leading-[.98] tracking-[-.07em] sm:text-6xl lg:text-8xl">
              Train hard.
              <br />
              Understand deeper.
            </h2>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#home"
                className="group inline-flex items-center gap-4 rounded-full bg-[#151517] px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                Back to the top <Arrow diagonal />
              </a>
              <span className="text-xs font-semibold text-black/60">
                FITNECT · ATHLETE WELLNESS
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-2 text-xs text-black/55">
              Train smart. Recover better. Perform stronger.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs font-bold text-black/60">
            <a href="#about" className="hover:text-[#7855A6]">Our approach</a>
            <a href="#features" className="hover:text-[#7855A6]">Features</a>
            <a href="#how-it-works" className="hover:text-[#7855A6]">How it works</a>
          </div>

          <p className="text-xs text-black/50">© 2026 FitNect</p>
        </div>
      </footer>
    </main>
  )
}

export default Landing
