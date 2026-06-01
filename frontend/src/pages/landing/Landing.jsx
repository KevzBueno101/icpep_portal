import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from './HeroSection'
import FeatureSection from './FeatureSection'
import AnnouncementFeed from './AnnouncementFeed'
import MilestonesSection from './MilestonesSection'
import MovingLogoText from './MovingLogoText'

export default function Landing() {
  const location = useLocation()

  useEffect(() => {
    const targetId =
      location.state?.scrollTo || (location.hash ? location.hash.slice(1) : '')

    if (!targetId) return

    const scrollToTarget = () => {
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const timeoutId = window.setTimeout(scrollToTarget, 0)
    return () => window.clearTimeout(timeoutId)
  }, [location.hash, location.state])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
        <AnnouncementFeed />
        <MilestonesSection />
        <MovingLogoText />
      </main>
      <Footer />
    </div>
  )
}
