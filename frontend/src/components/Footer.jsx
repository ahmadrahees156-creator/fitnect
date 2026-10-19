
import Brand from './Brand'

function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[#7855A6]/15 bg-[#E4DBF4]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#C9B5EE]/40 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#FDC381]/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 border-b border-[#7855A6]/15 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="inline-flex transition-transform duration-300 hover:scale-[1.02]">
              <Brand />
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-[#655774] sm:text-base">
              Your fitness journey, connected. Discover your potential, build
              healthier habits, and take one step closer to your goals every day.
            </p>

            <a
              href="/register"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#151517] px-5 py-3 text-sm font-bold text-white shadow-md transition duration-300 hover:-translate-y-1 hover:bg-[#7855A6] hover:shadow-lg"
            >
              Start your journey
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </a>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#21182D]">
              Explore
            </h3>

            <ul className="mt-5 space-y-3">
              {[
                ['Home', '/#home'],
                ['Our approach', '/#about'],
                ['Features', '/#features'],
                ['How it works', '/#how-it-works'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="inline-flex items-center text-sm font-medium text-[#655774] transition duration-200 hover:translate-x-1 hover:text-[#7855A6]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#21182D]">
              Your Account
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="/login"
                  className="inline-flex items-center text-sm font-medium text-[#655774] transition duration-200 hover:translate-x-1 hover:text-[#7855A6]"
                >
                  Log in
                </a>
              </li>

              <li>
                <a
                  href="/register"
                  className="inline-flex items-center text-sm font-medium text-[#655774] transition duration-200 hover:translate-x-1 hover:text-[#7855A6]"
                >
                  Create an account
                </a>
              </li>

              <li>
                <a
                  href="mailto:hello@fitnect.app?subject=FitNect%20Support"
                  className="inline-flex items-center text-sm font-medium text-[#655774] transition duration-200 hover:translate-x-1 hover:text-[#7855A6]"
                >
                  Contact support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs font-medium text-[#766887] sm:text-sm">
            © {new Date().getFullYear()} FitNect. All rights reserved.
          </p>

          <p className="text-xs font-medium text-[#766887] sm:text-sm">
            Built for your next level{' '}
            <span className="text-[#7855A6]">✦</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
