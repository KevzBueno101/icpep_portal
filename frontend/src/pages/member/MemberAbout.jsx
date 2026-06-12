import { Info, Shield, Users, Mail, Globe, MapPin } from 'lucide-react'
import { useOfficers } from '../../context/OfficersContext'

export default function MemberAbout() {
  // MemberAbout can be rendered on routes that may not wrap it in OfficersProvider
  // depending on navigation/state hydration.
  let officers = []
  let officersLoading = false

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
  } catch (e) {
    console.error('[MemberAbout] OfficersContext unavailable:', e)
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

      {/* Vision, Mission, Core Values */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Mission */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow transition duration-200">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              To provide a platform for student computer engineers to nurture technical skills, professional integrity, and academic excellence, preparing them for industrial challenges and global leadership.
            </p>
          </div>
        </div>

        {/* Vision */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow transition duration-200">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              To be the premier student organization producing innovative, ethically responsible, and globally competent computer engineering practitioners who drive technological advancements for community welfare.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow transition duration-200">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.198-.443.802-.443.999 0l1.582 3.208 3.535.513c.489.071.685.679.33.1.03l-2.558 2.493.604 3.52c.084.488-.428.86-.866.63L12 14.195l-3.161 1.662c-.439.23-.951-.142-.866-.63l.604-3.52-2.558-2.493c-.355-.346-.159-.954.33-.1.03l3.535-.513 1.582-3.208Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Core Values</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Innovation & Creativity
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Professional Integrity
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Collaborative Unity
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Social Responsibility
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Leadership Board */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Leadership Board</h2>
        </div>

        {officersLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500 text-sm">Loading officers...</div>
        ) : officers?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {officers.map((officer, idx) => (
              <div
                key={officer.user_id ?? idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  {officer.profile_picture ? (
                    <img
                      src={officer.profile_picture}
                      alt={`${officer.first_name} ${officer.last_name}`}
                      className="h-10 w-10 rounded-full object-cover bg-slate-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold">
                      {(officer.first_name?.[0] ?? 'O')}
                      {(officer.last_name?.[0] ?? '')}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {officer.first_name || '—'} {officer.last_name || ''}
                    </h4>
                    <p className="text-xs text-sky-600 font-semibold truncate">{officer.position || ''}</p>
                    {officer.department && <p className="text-xs text-slate-500 truncate">{officer.department}</p>}
                    {officer.academic_year && <p className="text-xs text-slate-400 truncate">AY {officer.academic_year}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{officer.username ? `@${officer.username}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No officers available.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-400 shrink-0" />
              <span>org@icpep.se</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-400 shrink-0" />
              <span>www.icpep.se</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Computer Lab, Bldg 2</span>
            </div>
          </div>
        </div>

        {/* background glow */}
        <div className="absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
    </div>
  )
}

