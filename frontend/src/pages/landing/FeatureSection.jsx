import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Step 1 — Register',
    description:
      'Create your profile and submit your details to become a member of ICPEP.SE. Membership fee is 25 pesos valid for 1 year, which helps us fund events, resources, and community initiatives.',
    accent: '01',
  },
  {
    title: 'Step 2 — Wait for Activation',
    description:
      'Activation may take 1 - 5 days. You will receive an email notification once your membership is active.',
    accent: '02',
  },
  {
    title: 'Step 3 — Verify',
    description:
      'Check your profile and verify the membership ID details.',
    accent: '03',
  },
]


export default function FeatureSection() {
  return (
    <section className="bg-transparent py-16 sm:py-20 relative z-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            ICPEP.SE Portal
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            <span className="text-cyan-400">C</span>onnect •{' '}
            <span className="text-cyan-400">P</span>erform •{' '}
            <span className="text-cyan-400">E</span>xcel
          </h2>
          <p className="mt-4 text-base text-slate-300 md:text-lg">
            How to be a member of ICpEP.SE? Register now to access exclusive resources, and stay updated on the latest events and opportunities in the field of computer engineering and education.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800/60 hover:shadow-[0_8px_30px_-4px_rgba(6,182,212,0.15)] hover:border-cyan-500/30"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-lg font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                {feature.accent}
              </div>
              <h3 className="mb-3 text-xl font-bold text-white tracking-wide">
                {feature.title}
              </h3>
              {feature.actionLink && (
                <div className="mt-5">
                  <Link
                    to={feature.actionLink}
                    className="inline-flex items-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/20 hover:text-white"
                  >
                    {feature.actionText}
                    <span className="ml-2 transition-transform group-hover:translate-x-1">↗</span>
                  </Link>
                </div>
              )}
              <p className="leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
