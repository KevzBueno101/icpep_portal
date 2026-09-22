import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Handshake, Users, Sparkles } from 'lucide-react'
import { publicApi } from '../../api/axios'

const MAX_ATTACHMENT_MB = 10

const benefits = [
  {
    icon: Users,
    title: 'Reach Future Engineers',
    text: 'Connect your brand with driven computer engineering students at CatSU who are shaping the next wave of technology.',
  },
  {
    icon: Handshake,
    title: 'Collaborate on Impactful Events',
    text: 'Co-create workshops, hackathons, and outreach programs that leave a lasting mark on the community.',
  },
  {
    icon: Sparkles,
    title: 'Gain Lasting Visibility',
    text: 'Get recognized across our campus events, digital platforms, and member network as a partner in progress.',
  },
]

export default function SponsorshipSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [attachment, setAttachment] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setAttachment(null)
      return
    }
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      toast.error(`Attachment must be ${MAX_ATTACHMENT_MB} MB or smaller.`)
      e.target.value = ''
      setAttachment(null)
      return
    }
    setAttachment(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('email', form.email)
      formData.append('message', form.message)
      if (attachment) {
        formData.append('attachment', attachment)
      }
      await publicApi.post('/partnership/partnership/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Partnership proposal sent successfully!')
      setForm({ name: '', email: '', message: '' })
      setAttachment(null)
    } catch (err) {
      const data = err.response?.data
      let detail =
        data?.detail ||
        data?.name?.[0] ||
        data?.email?.[0] ||
        data?.message?.[0] ||
        data?.attachment?.[0] ||
        err.message ||
        'Failed to send proposal. Please try again.'
      if (typeof detail !== 'string') detail = 'Failed to send proposal. Please try again.'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Partner With ICpEP.SE
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Sponsor, Partner, or <span className="text-cyan-400">Collaborate</span> With Us
          </h2>
          <p className="mt-4 text-base text-slate-300 md:text-lg">
            Join us in empowering the next generation of computer engineers. Whether it's funding
            an event, sharing expertise, or building something together — your partnership makes a
            real difference.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-5">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-bold text-white">{benefit.title}</h3>
                  <p className="leading-relaxed text-slate-400">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-sm">
            <h3 className="mb-1 text-xl font-bold text-white">Let's Start a Conversation</h3>
            <p className="mb-6 text-sm text-slate-400">
              Fill out the form below and we'll reach out to discuss how we can work together.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="sponsor-name" className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Full Name
                </label>
                <input
                  id="sponsor-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                />
              </div>

              <div>
                <label htmlFor="sponsor-email" className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Email
                </label>
                <input
                  id="sponsor-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                />
              </div>

              <div>
                <label htmlFor="sponsor-message" className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Message
                </label>
                <textarea
                  id="sponsor-message"
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Tell us about your organization and how you'd like to partner with us."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                />
              </div>

              <div>
                <label htmlFor="sponsor-attachment" className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Attachment <span className="text-slate-500 font-normal">(optional, max {MAX_ATTACHMENT_MB} MB)</span>
                </label>
                <input
                  id="sponsor-attachment"
                  name="attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-300 hover:file:bg-cyan-500/30"
                />
                {attachment && (
                  <p className="mt-1 text-xs text-cyan-400">{attachment.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3.5 text-sm font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="h-4 w-4" />
                {submitting ? 'Sending...' : 'Send Proposal'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Submit the form and we will reach out to you via email.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
