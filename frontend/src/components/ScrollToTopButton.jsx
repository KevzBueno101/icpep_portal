import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { isMemberView, MEMBER_FLOAT_OPACITY } from '../utils/floatingButtons'

const SHOW_AFTER = 300

export default function ScrollToTopButton() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Back to top"
      className={`fixed bottom-[16.5rem] right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 hover:shadow-xl active:scale-95 md:bottom-6 ${isMemberView(location.pathname) ? MEMBER_FLOAT_OPACITY : ''}`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
