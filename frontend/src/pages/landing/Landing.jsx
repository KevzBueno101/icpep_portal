import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from './HeroSection'
import FeatureSection from './FeatureSection'
import AnnouncementFeed from './AnnouncementFeed'
import MilestonesSection from './MilestonesSection'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
        <AnnouncementFeed />
        <MilestonesSection />
      </main>
      <Footer />
    </div>
  )
}