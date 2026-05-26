const features = [
  {
    title: 'Community Connections',
    description: 'Build meaningful relationships with fellow technology professionals and educators across the region.',
    accent: 'CC',
  },
  {
    title: 'Event Announcements',
    description: 'Discover upcoming meetings, workshops, and professional development opportunities in one place.',
    accent: 'EA',
  },
  {
    title: 'Professional Growth',
    description: 'Access resources, mentorship, and collaboration channels designed to help you succeed.',
    accent: 'PG',
  },
]

export default function FeatureSection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            ICPEP.SE Portal
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Built for professionals who want to connect, share, and lead.
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            A clean, modern portal for announcements, member services, and leadership information.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-sky-700 text-sm font-bold text-white shadow-sm">
                {feature.accent}
              </div>
              <h3 className="mb-3 mt-5 text-xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="leading-7 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
