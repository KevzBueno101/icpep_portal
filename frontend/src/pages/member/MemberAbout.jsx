import { useEffect, useState } from 'react'
import { Info, Mail, MapPin, Eye, ChevronRight, ChevronDown, Code2, ChevronLeft } from 'lucide-react'
import OfficersCarousel from '../../components/OfficersCarousel'
import DevCommitteeModal from '../../components/DevCommitteeModal'
import { OfficersProvider } from '../../context/OfficersContext'
import api from '../../api/axios'
import { CATEGORY_DEFS, categoryFor, FEED_COLORS, typeLabel } from '../../utils/aboutCategories'

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

export default function MemberAbout() {
  const [sections, setSections] = useState(null)
  const [devCommitteeOpen, setDevCommitteeOpen] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState(() => new Set())
  const [activeCategory, setActiveCategory] = useState(null)

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

  const groupedSections = (() => {
    const map = new Map(CATEGORY_DEFS.map((c) => [c.key, []]))
    ;(allSections || []).forEach((section) => {
      const key = categoryFor(section)
      if (map.has(key)) map.get(key).push(section)
      else map.get('CUSTOM').push(section)
    })
    return map
  })()

  const activeDef = CATEGORY_DEFS.find((c) => c.key === activeCategory)
  const activeItems = activeCategory ? (groupedSections.get(activeCategory) || []) : []

  const toggleHistory = (id) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderSectionCard = (section) => {
    const colors = FEED_COLORS[section.section_type] || FEED_COLORS.CUSTOM
    const lines = (section.body || '').split('\n').map((l) => l.trim()).filter(Boolean)
    const isHistory = section.section_type === 'HISTORY'
    const isExpanded = expandedHistory.has(section.id)
    const hasListBody = lines.length > 1 && !isHistory && section.section_type !== 'CUSTOM'
    const longBody = (hasListBody && lines.length > 3) || (!hasListBody && (section.body || '').length > 150)
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
                {typeLabel(section.section_type)}
              </span>
              {section.document_url && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  <Eye className="h-3 w-3" />
                  PDF
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
            {hasListBody ? (
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {(isExpanded ? lines : lines.slice(0, 3)).map((line, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className={`mt-2 break-words whitespace-pre-wrap text-sm text-slate-600 leading-relaxed transition-all duration-200 ${
                  !isExpanded && (isHistory || longBody) ? 'line-clamp-3' : ''
                }`}
              >
                {section.body}
              </p>
            )}
            {(isHistory || longBody) && (
              <button
                type="button"
                onClick={() => toggleHistory(section.id)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                {isExpanded ? 'Read less' : 'Read more'}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
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
  }

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

      {/* Organization Docs — categorized, admin-style */}
      <div>
        <h2 className="mb-1 text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="h-1 w-5 rounded-full bg-sky-600" />
          About the Organization
        </h2>
        <p className="mb-6 text-sm text-slate-500">Browse the organization's documents and sections by category.</p>

        {allSections == null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : activeCategory ? (
          <div className="space-y-4">
            {/* Category header */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Categories
              </button>
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activeDef.iconBox}`}>
                <activeDef.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-slate-900">{activeDef.label}</h3>
                <p className="text-xs text-slate-500">{activeDef.subtitle}</p>
              </div>
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${activeDef.chip}`}>
                {activeItems.length} {activeItems.length === 1 ? 'section' : 'sections'}
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
                No {activeDef.label.toLowerCase()} sections yet.
              </div>
            ) : (
              <div className="space-y-4">
                {activeItems.map(renderSectionCard)}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_DEFS.map((def) => {
              const count = groupedSections.get(def.key)?.length || 0
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => setActiveCategory(def.key)}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${def.iconBox}`}>
                      <def.icon className="h-6 w-6" />
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{def.label}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{def.subtitle}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${def.chip}`}>
                    {count} {count === 1 ? 'section' : 'sections'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
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