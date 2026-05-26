import AnnouncementCard from '../../components/AnnouncementCard'

const announcements = [
  {
    id: 1,
    title: 'Welcome to ICPEP.SE Portal',
    body: 'The new portal brings member registration, announcements, and leadership information into a single place for the community.',
    category: 'announcement',
    created_at: '2026-05-24T08:00:00.000Z',
    author: 'Admin',
    pinned: true,
  },
  {
    id: 2,
    title: 'Monthly Meetup - June 15',
    body: 'Join the next professional development meetup for a focused discussion on emerging trends in computer science and education.',
    category: 'update',
    created_at: '2026-05-25T08:00:00.000Z',
    author: 'Events Team',
    pinned: false,
  },
  {
    id: 3,
    title: 'Call for Speakers',
    body: 'Members interested in sharing research, projects, or classroom practice can submit a proposal for the upcoming conference.',
    category: 'opportunity',
    created_at: '2026-05-26T08:00:00.000Z',
    author: 'Conference Committee',
    pinned: false,
  },
]

export default function AnnouncementFeed() {
  return (
    <section id="announcements" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Community Highlights
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Latest Announcements
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Stay updated with the latest news, events, and opportunities from our community.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      </div>
    </section>
  )
}
