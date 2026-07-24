import { useState } from 'react'
import { Facebook, Mail } from 'lucide-react'
import PrivacyPolicyModal from './PrivacyPolicyModal'

export default function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-50 bg-slate-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-lg font-bold">About ICPEP.SE</h3>
            <p className="text-sm text-slate-400">
              It is a non-stock, non-profit professional organization for computer engineers, educators, students, and industry practitioners in the Philippines
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
              <li>
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-sm transition hover:text-white"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">Contact</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <a
                href="mailto:icpep.se.catsuchapter@gmail.com"
                className="inline-flex items-center gap-2 transition hover:text-white"
              >
                <Mail className="h-4 w-4" />
                <span>icpep.se.catsuchapter@gmail.com</span>
              </a>
              <a
                href='https://www.facebook.com/Icpep.seCatSu'
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition hover:text-white"
              >
                <Facebook className="h-4 w-4" />
                <span>Follow us on Facebook</span>
              </a>
            </div>
          </div>
        </div>

        <hr className="mb-6 border-slate-700" />

        <div className="text-center text-sm text-slate-400">
          <p>&copy; {currentYear} ICPEP.SE Portal. All rights reserved.</p>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </footer>
  )
}
