import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

const getFileUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${BACKEND_ORIGIN}${path}`
}

const MemberMembershipVerify = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [decisionMode, setDecisionMode] = useState(null) // 'APPROVED' | 'REJECTED'
  const [adminMessage, setAdminMessage] = useState('')

  const proofImages = [
    ...(member?.payment_proof_image
      ? [{ src: getFileUrl(member.payment_proof_image), label: 'Payment Proof' }]
      : []),
    ...(member?.coe_id_image
      ? [{ src: getFileUrl(member.coe_id_image), label: 'COE/ID Document' }]
      : []),
  ]

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/members/${id}/`)
        setMember(res.data)
      } catch {
        toast.error('Unable to load member details.')
        setMember(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const applyDecision = async (decision) => {
    if (!member) return
    setBusy(true)
    try {
      const res = await api.post(`/members/${id}/approve/`, {
        membership_status: decision,
        admin_message: adminMessage,
      })
      setMember(res.data)

      toast.success(
        decision === 'APPROVED'
          ? 'Member verified and approved successfully.'
          : 'Member request rejected.'
      )

      navigate('/admin/membership', { replace: true })
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          `Unable to ${decision === 'APPROVED' ? 'verify' : 'reject'} member.`
      )
    } finally {
      setBusy(false)
      setDecisionModalOpen(false)
      setAdminMessage('')
    }
  }

  const openDecisionModal = (mode) => {
    setDecisionMode(mode)
    setAdminMessage('')
    setDecisionModalOpen(true)
  }
  const closeDecisionModal = () => {
    setDecisionModalOpen(false)
    setDecisionMode(null)
    setAdminMessage('')
  }

  if (loading) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Member not found.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/membership')}
          className="mt-4 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Back to Membership
        </button>
      </div>
    )
  }

  const fullName = `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Admin</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-slate-900">Membership</span>
            <span className="mx-2">→</span>
            <span className="text-slate-500">Verify</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/membership')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Profile</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            {fullName || '—'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{member.user_email || 'No email'}</p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Student ID</span>
              <span className="font-mono text-slate-900">{member.student_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Course</span>
              <span className="font-medium text-slate-900">{member.course || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Year</span>
              <span className="font-medium text-slate-900">{member.year_level || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Section</span>
              <span className="font-medium text-slate-900">{member.section || '—'}</span>
            </div>
          </div>

          <div className="mt-5">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {member.membership_status}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Payment Proofs</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Proof of payment</h3>
          <p className="mt-1 text-sm text-slate-600">Review the uploaded proof before approving.</p>

          {proofImages.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No payment proof uploaded.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {proofImages.map((img, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{img.label}</p>
                    {img.src && (
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-sky-700 hover:text-sky-800"
                      >
                        Open
                      </a>
                    )}
                  </div>
                  <div className="w-full max-h-80 overflow-auto bg-slate-50">
                    {img.src ? (
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No image</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => openDecisionModal('REJECTED')}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => openDecisionModal('APPROVED')}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Verify
            </button>
          </div>

          {/* Decision modal */}
          {decisionModalOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-950">
                      {decisionMode === 'APPROVED' ? 'Verify membership' : 'Reject membership'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {decisionMode === 'APPROVED'
                        ? 'Approve this membership request.'
                        : 'Reject this membership request.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDecisionModal}
                    disabled={busy}
                    className="shrink-0 rounded-full p-1.5 hover:bg-slate-100 text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Message <span className="text-slate-400 font-normal">(optional)</span>
                    </span>
                    <textarea
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      placeholder="Add a note about this decision..."
                      rows={3}
                      className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 resize-none"
                    />
                  </label>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center shrink-0">
                  <button
                    type="button"
                    onClick={closeDecisionModal}
                    disabled={busy}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDecision(decisionMode)}
                    disabled={busy}
                    className={
                      decisionMode === 'APPROVED'
                        ? 'rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed'
                        : 'rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                    }
                  >
                    {busy
                      ? 'Processing…'
                      : decisionMode === 'APPROVED'
                        ? 'Approve'
                        : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberMembershipVerify