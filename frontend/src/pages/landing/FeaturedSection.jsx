import FeaturedContent from '../../components/FeaturedContent'

export default function FeaturedSection() {
  return (
    <section className="bg-transparent py-16 sm:py-20 relative z-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Featured
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Featured Content
          </h2>
          <p className="mt-4 text-base text-slate-300 md:text-lg">
            Discover what's happening in ICpEP.SE CatSU Chapter
          </p>
        </div>

        <FeaturedContent />
      </div>
    </section>
  )
}
