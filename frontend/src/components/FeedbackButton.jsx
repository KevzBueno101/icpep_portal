import { FileText } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const FEEDBACK_URL = 'https://forms.gle/AmYkx8MDDXLMefNh6'

export default function FeedbackButton() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group fixed bottom-32 z-50 flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 hover:shadow-xl md:bottom-5 ${isAdmin ? 'right-5' : 'left-5'}`}
      aria-label="Send feedback"
    >
      <FileText className="h-5 w-5" />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  )
}
