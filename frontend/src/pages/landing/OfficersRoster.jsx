import OfficerCard from '../../components/OfficerCard'

const officers = [
  {
    id: 1,
    user: {
      username: 'sarahjohnson',
      first_name: 'Sarah',
      last_name: 'Johnson',
    },
    position: 'President',
    department: 'Computer Science',
    academic_year: '2025-2026',
    photo: null,
  },
  {
    id: 2,
    user: {
      username: 'jameschen',
      first_name: 'James',
      last_name: 'Chen',
    },
    position: 'Vice President',
    department: 'Information Technology',
    academic_year: '2025-2026',
    photo: null,
  },
  {
    id: 3,
    user: {
      username: 'mariarodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
    },
    position: 'Secretary',
    department: 'Computer Engineering',
    academic_year: '2025-2026',
    photo: null,
  },
  {
    id: 4,
    user: {
      username: 'michaelthompson',
      first_name: 'Michael',
      last_name: 'Thompson',
    },
    position: 'Treasurer',
    department: 'Software Engineering',
    academic_year: '2025-2026',
    photo: null,
  },
]

export default function OfficersRoster() {
  return (
    <section id="officers" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Leadership Team
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Meet Our Officers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Meet the dedicated officers leading our community forward.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {officers.map((officer) => (
            <OfficerCard key={officer.id} officer={officer} />
          ))}
        </div>
      </div>
    </section>
  )
}
