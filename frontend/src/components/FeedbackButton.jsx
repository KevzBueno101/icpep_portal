import { FileText } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { isMemberView, MEMBER_FLOAT_OPACITY } from '../utils/floatingButtons'

const FEEDBACK_URL = 'https://forms.gle/AmYkx8MDDXLMefNh6'

export default function FeedbackButton() {
  const location = useLocation()
  const floatOpacity = isMemberView(location.pathname) ? MEMBER_FLOAT_OPACITY : ''

  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group fixed bottom-[13.5rem] right-6 z-50 flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 hover:shadow-xl ${floatOpacity}`}
      aria-label="Take survey"
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">Survey</span>
    </a>
  )
}
