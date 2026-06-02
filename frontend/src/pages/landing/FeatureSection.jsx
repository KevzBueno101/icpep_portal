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
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            ICPEP.SE Portal
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            <span className="text-cyan-400">C</span>onnect •{' '}
            <span className="text-cyan-400">P</span>erform •{' '}
            <span className="text-cyan-400">E</span>xcel
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            How to be a member of ICpEP.SE? Register now to access exclusive resources, and stay updated on the latest events and opportunities in the field of computer engineering and education.
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
              {feature.actionLink && (
                <div className="mt-4">
                  <Link
                    to={feature.actionLink}
                    className="inline-flex items-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-[14px] font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/15"
                  >
                    {feature.actionText}
                    <span className="ml-2">↗</span>
                  </Link>
                </div>
              )}
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
