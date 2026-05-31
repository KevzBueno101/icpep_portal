import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from './HeroSection'
import FeatureSection from './FeatureSection'
import AnnouncementFeed from './AnnouncementFeed'
import OfficersRoster from './OfficersRoster'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
        <AnnouncementFeed />
        <OfficersRoster />
      </main>
      <Footer />
    </div>
  )
}

