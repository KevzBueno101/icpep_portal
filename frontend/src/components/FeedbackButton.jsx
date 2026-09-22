import { FileText } from 'lucide-react'

const FEEDBACK_URL = 'https://forms.gle/AmYkx8MDDXLMefNh6'

export default function FeedbackButton() {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-28 left-5 z-50 flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 hover:shadow-xl md:bottom-4"
      aria-label="Send feedback"
    >
      <FileText className="h-5 w-5" />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  )
}
