import { useEffect, useState } from 'react'
import { Info, Shield, Mail, MapPin, Eye, ChevronRight, Code2 } from 'lucide-react'
import OfficersCarousel from '../../components/OfficersCarousel'
import DevCommitteeModal from '../../components/DevCommitteeModal'
import { OfficersProvider } from '../../context/OfficersContext'
import api from '../../api/axios'

const FALLBACK_IDENTITY = [
  {
    section_type: 'MISSION',
    title: 'Our Mission',
    body: 'To provide a platform for student computer engineers to nurture technical skills, professional integrity, and academic excellence, preparing them for industrial challenges and global leadership.',
  },
  {
    section_type: 'VISION',
    title: 'Our Vision',
    body: 'To be the premier student organization producing innovative, ethically responsible, and globally competent computer engineering practitioners who drive technological advancements for community welfare.',
  },
  {
    section_type: 'CUSTOM',
    title: 'Core Values',
    body: 'Innovation & Creativity\nProfessional Integrity\nCollaborative Unity\nSocial Responsibility',
  },
]

const IDENTITY_TYPES = new Set(['MISSION', 'VISION'])

const isIdentity = (s) =>
  IDENTITY_TYPES.has(s.section_type) ||
  s.title?.toLowerCase().includes('core values')

const FEED_COLORS = {
  GOALS: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  HISTORY: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CONSTITUTION: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  RESOLUTION: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  CUSTOM: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
}

const TYPE_LABELS = {
  GOALS: 'Goals',
  HISTORY: 'History',
  CONSTITUTION: 'Constitution & By-Laws',
  RESOLUTION: 'Resolution',
  CUSTOM: 'Section',
}

export default function MemberAbout() {
  const [sections, setSections] = useState(null)
  const [devCommitteeOpen, setDevCommitteeOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    api
      .get('/about/')
      .then((res) => {
        if (mounted) setSections(res.data.results)
      })
      .catch(() => {
        if (mounted) setSections([])
      })
    return () => {
      mounted = false
    }
  }, [])

  const openPreview = (section) => {
    if (!section.document_url) return
    window.open(section.document_url, '_blank', 'noopener,noreferrer')
  }

  const allSections =
    sections && sections.length > 0 ? sections : sections === null ? null : FALLBACK_IDENTITY

  const identitySections = allSections?.filter(isIdentity) ?? []
  const feedSections = allSections?.filter((s) => !isIdentity(s)) ?? []

  return (
    <div className="space-y-10">

      {/* Hero section */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Info className="h-8 w-8 text-sky-600" />
          About ICPEP.SE
        </h1>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          Learn more about the Institute of Computer Engineers of the Philippines Student Edition.
        </p>
      </div>

      {/* Identity: Mission, Vision, Core Values */}
      {identitySections.length > 0 && (
        <div>
          <h2 className="mb-6 text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="h-1 w-5 rounded-full bg-sky-600" />
            Our Identity
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {identitySections.map((section) => {
              const lines = (section.body || '').split('\n').map((l) => l.trim()).filter(Boolean)
              const isMission = section.section_type === 'MISSION'
              const isVision = section.section_type === 'VISION'
              const accent = isMission
                ? 'from-sky-500 to-sky-600'
                : isVision
                  ? 'from-indigo-500 to-indigo-600'
                  : 'from-slate-500 to-slate-600'
              const iconBg = isMission
                ? 'bg-sky-50 text-sky-600'
                : isVision
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-slate-100 text-slate-600'
              return (
                <div
                  key={section.id || section.title}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r ${accent}`} />
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${iconBg}`}>
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                  {lines.length > 1 ? (
                    <ul className="mt-4 space-y-2 text-sm text-slate-600 font-medium flex-1">
                      {lines.map((line, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-600 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600 leading-relaxed flex-1">{section.body}</p>
                  )}
                  {section.document_url && (
                    <button
                      type="button"
                      onClick={() => openPreview(section)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      See pdf
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feeds: History, Constitution, Resolutions, Goals, etc. */}
      {feedSections.length > 0 && (
        <div>
          <h2 className="mb-6 text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="h-1 w-5 rounded-full bg-sky-600" />
            About the Organization
          </h2>
          <div className="space-y-4">
            {feedSections.map((section) => {
              const colors = FEED_COLORS[section.section_type] || FEED_COLORS.CUSTOM
              const label = TYPE_LABELS[section.section_type] || 'Section'
              const lines = (section.body || '').split('\n').map((l) => l.trim()).filter(Boolean)
              return (
                <div
                  key={section.id || section.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                          {label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                      {lines.length > 1 ? (
                        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                          {lines.map((line, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{section.body}</p>
                      )}
                      {section.document_url && (
                        <button
                          type="button"
                          onClick={() => openPreview(section)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
                        >
<Eye className="h-3.5 w-3.5" />
                      See pdf
                      <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leadership Board */}
      <OfficersProvider>
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Leadership Team</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Student Leadership Board</h2>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <OfficersCarousel />
          </div>
        </section>
      </OfficersProvider>

      {/* Web-App Development Committee */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Web-App Development Committee</h2>
              <p className="text-sm text-slate-500">Meet the team behind this portal.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDevCommitteeOpen(true)}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
            View Members
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold">Connect with the Chapter</h2>
            <p className="text-slate-400 text-sm mt-1">We are always eager to assist with inquiries, partnerships, and tech support.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-400 shrink-0" />
              <a href="mailto:icpep.se.catsuchapter@gmail.com" className="hover:underline">icpep.se.catsuchapter@gmail.com</a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Virac, Catanduanes</span>
            </div>
          </div>
        </div>

        {/* background glow */}
        <div className="absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Web-App Development Committee modal */}
      <DevCommitteeModal isOpen={devCommitteeOpen} onClose={() => setDevCommitteeOpen(false)} />
    </div>
  )
}