import OfficersCarousel from '../../components/OfficersCarousel'

export default function OfficersRoster() {
  return (
    <section
      id="officers"
      className="bg-white py-16 border-t border-slate-100"
      aria-label="Leadership Board"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Headline / Section title (kept inside the white section) */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Leadership Team
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Student Leadership Board
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Meet the dedicated officers leading our community forward.
          </p>
        </div>

        <OfficersCarousel />
      </div>
    </section>
  )
}

