
function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#7855A6]/15 bg-[#E4DBF4]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <a
            href="/"
            aria-label="FitNect home"
            className="text-xl font-black tracking-tight text-[#21182D]"
          >
            Fit<span className="text-[#7855A6]">Nect</span>
          </a>

          <p className="text-sm text-[#655774]">
            Your fitness journey, connected.
          </p>

          <p className="text-xs font-medium text-[#766887] sm:text-sm">
            © {new Date().getFullYear()} FitNect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
