import { X } from 'lucide-react'

const COMMITTEE = [
  { name: 'Kevin B. Bueno', role: 'Lead / Fullstack Developer' },
  { name: 'Jhan Lorenz Bongon', role: 'Business Process Analyst' },
  { name: 'Edcel Tanael', role: 'Documentation Officer' },
  { name: 'Jayron Benavidez', role: 'QA Tester' },
]

export default function DevCommitteeModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 px-4 py-10" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Web-App Development Committee</h2>
            <p className="text-sm text-slate-500">ICpEP.SE CatSU</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <ul className="space-y-4">
            {COMMITTEE.map((m) => (
              <li key={m.name} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                  {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
