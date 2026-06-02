export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-lg font-bold">About ICPEP.SE</h3>
            <p className="text-sm text-slate-400">
              Integration of Computer Professionals and Educators Portal dedicated to fostering community and professional growth in technology and education.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#top" className="text-sm transition hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="#announcements" className="text-sm transition hover:text-white">
                  Announcements
                </a>
              </li>
              <li>
                <a href="#officers" className="text-sm transition hover:text-white">
                  Officers
                </a>
              </li>
              <li>
                <a href="mailto:info@icpep.se" className="text-sm transition hover:text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">Contact</h3>
            <p className="mb-2 text-sm text-slate-400">
              Email:{' '}
              <a href="mailto:info@icpep.se" className="transition hover:text-white">
                info@icpep.se
              </a>
            </p>
            <p className="text-sm text-slate-400">
              Follow us on social media for updates and events.
            </p>
          </div>
        </div>

        <hr className="mb-6 border-slate-700" />

        <div className="text-center text-sm text-slate-400">
          <p>&copy; {currentYear} ICPEP.SE Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
