import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Award, Plus, Pencil, Trash2, Loader2, X, CheckCircle2,
  AlertTriangle, ImageIcon, ShieldAlert, RefreshCw, Search,
  ChevronLeft, ChevronRight, Ban, Upload,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/useAuth'
import { useRealtimeContent, useRealtimeGuard } from '../../context/RealtimeContext'
import { RESOURCES } from '../../utils/realtime'
import { fetchCandidateIds } from '../../api/certificates'
import ConfirmModal from '../../components/common/ConfirmModal'
import CertificatePreview from '../../components/certificates/CertificatePreview'
import MemberPicker from '../../components/certificates/MemberPicker'

const PRESETS = [
  { value: 'CLASSIC', label: 'Classic' },
  { value: 'MODERN', label: 'Modern' },
  { value: 'ELEGANT', label: 'Elegant' },
  { value: 'MINIMAL', label: 'Minimal' },
  { value: 'UPLOAD', label: 'Custom upload' },
]

const makeSignatory = (data = {}) => ({
  name: '', position: '', signature_url: '', file: null, preview: '', ...data,
})

const makeEmptyDesign = () => ({
  name: '',
  preset: 'CLASSIC',
  title: 'Certificate of Participation',
  message: 'For actively participating in this event and contributing to the success of the organization.',
  header_school: 'Catanduanes State University',
  header_college: 'College of Engineering and Architecture',
  header_organization: 'Institute of Computer Engineers of the Philippines. Student Edition - CatSU Chapter',
  signatories: [makeSignatory()],
  text_color: '#0f172a',
  font_size: 16,
  text_align: 'CENTER',
})

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function CertificatesPage() {
  const { user } = useAuth()
  const isRestricted = user?.access_level === 'RESTRICTED'

  const [tab, setTab] = useState('issue')
  const [designs, setDesigns] = useState([])
  const [designsLoading, setDesignsLoading] = useState(true)

  const [designModalOpen, setDesignModalOpen] = useState(false)
  const [designEditingId, setDesignEditingId] = useState(null)
  const [designForm, setDesignForm] = useState(makeEmptyDesign)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [bgPreview, setBgPreview] = useState('')
  const [designSaving, setDesignSaving] = useState(false)
  const bgInputRef = useRef(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [designId, setDesignId] = useState('')
  const [selected, setSelected] = useState({})
  const [selectAllOpen, setSelectAllOpen] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [issueResult, setIssueResult] = useState(null)

  const [issued, setIssued] = useState({ results: [], count: 0, next: null, previous: null })
  const [issuedLoading, setIssuedLoading] = useState(false)
  const [issuedSearch, setIssuedSearch] = useState('')
  const [issuedDebounced, setIssuedDebounced] = useState('')
  const [issuedPage, setIssuedPage] = useState(1)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)

  const fetchDesigns = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setDesignsLoading(true)
      const res = await api.get('/certificates/designs/')
      const list = res.data.results ?? res.data
      setDesigns(list)
      setDesignId((prev) => prev || (list[0]?.id ? String(list[0].id) : ''))
    } catch {
      if (!silent) toast.error('Failed to load certificate designs.')
    } finally {
      if (!silent) setDesignsLoading(false)
    }
  }, [])

  useEffect(() => { fetchDesigns() }, [fetchDesigns])

  const fetchIssued = useCallback(async () => {
    setIssuedLoading(true)
    try {
      const res = await api.get('/certificates/', {
        params: { page: issuedPage, ...(issuedDebounced ? { search: issuedDebounced } : {}) },
      })
      setIssued({
        results: res.data.results || [],
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
      })
    } catch {
      toast.error('Failed to load issued certificates.')
    } finally {
      setIssuedLoading(false)
    }
  }, [issuedPage, issuedDebounced])

  useEffect(() => {
    const id = setTimeout(() => { setIssuedDebounced(issuedSearch.trim()); setIssuedPage(1) }, 400)
    return () => clearTimeout(id)
  }, [issuedSearch])

  useEffect(() => {
    if (tab === 'issued') fetchIssued()
  }, [tab, fetchIssued])

  useRealtimeContent(RESOURCES.CERTIFICATES, () => {
    fetchDesigns({ silent: true })
    if (tab === 'issued') fetchIssued()
  })
  useRealtimeGuard(designModalOpen || deleteTarget != null || issueConfirmOpen || revokeTarget != null)

  // Revoke the background preview object URL on unmount / change
  useEffect(() => () => {
    if (bgPreview) URL.revokeObjectURL(bgPreview)
  }, [bgPreview])

  const selectedCount = Object.keys(selected).length

  const selectedDesign = useMemo(
    () => designs.find((d) => String(d.id) === String(designId)) || null,
    [designs, designId]
  )

  const previewDesign = useMemo(() => ({
    ...designForm,
    font_size: Number(designForm.font_size) || 16,
    background_url: bgPreview || designForm.background_url || designForm.background_image || '',
    signatories: (designForm.signatories || []).map((s) => ({
      name: s.name,
      position: s.position,
      signature_url: s.preview || s.signature_url || '',
    })),
  }), [designForm, bgPreview])

  const resetDesignForm = () => {
    setDesignForm((prev) => {
      (prev.signatories || []).forEach((s) => { if (s.preview) URL.revokeObjectURL(s.preview) })
      return makeEmptyDesign()
    })
    setDesignEditingId(null)
    setBackgroundFile(null)
    setBgPreview('')
  }

  const openCreateDesign = () => {
    resetDesignForm()
    setDesignModalOpen(true)
  }

  const updateSignatory = (index, patch) => {
    setDesignForm((prev) => ({
      ...prev,
      signatories: prev.signatories.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))
  }

  const addSignatory = () => {
    setDesignForm((prev) => ({ ...prev, signatories: [...prev.signatories, makeSignatory()] }))
  }

  const removeSignatory = (index) => {
    setDesignForm((prev) => {
      const target = prev.signatories[index]
      if (target?.preview) URL.revokeObjectURL(target.preview)
      return { ...prev, signatories: prev.signatories.filter((_, i) => i !== index) }
    })
  }

  const openEditDesign = (design) => {
    setDesignEditingId(design.id)
    const signatories = (Array.isArray(design.signatories) ? design.signatories : [])
      .map((s) => makeSignatory({
        name: s.name || '',
        position: s.position || '',
        signature_url: s.signature_url || '',
      }))
    setDesignForm({
      name: design.name || '',
      preset: design.preset || 'CLASSIC',
      title: design.title || '',
      message: design.message || '',
      header_school: design.header_school || '',
      header_college: design.header_college || '',
      header_organization: design.header_organization || '',
      signatories: signatories.length ? signatories : [makeSignatory()],
      text_color: design.text_color || '#0f172a',
      font_size: design.font_size || 16,
      text_align: design.text_align || 'CENTER',
      background_url: design.background_image || '',
    })
    setBackgroundFile(null)
    setBgPreview('')
    setDesignModalOpen(true)
  }

  const onPickBackground = (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Background image must be under 10MB.'); return }
    setBackgroundFile(file)
    setBgPreview(URL.createObjectURL(file))
  }

  const onPickSignature = (index, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Signature image must be under 10MB.'); return }
    setDesignForm((prev) => ({
      ...prev,
      signatories: prev.signatories.map((s, i) => {
        if (i !== index) return s
        if (s.preview) URL.revokeObjectURL(s.preview)
        return { ...s, file, preview: URL.createObjectURL(file) }
      }),
    }))
  }

  const saveDesign = async () => {
    if (!designForm.name.trim()) { toast.error('Design name is required.'); return }
    if (!designForm.title.trim()) { toast.error('Certificate title is required.'); return }
    setDesignSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', designForm.name.trim())
      fd.append('preset', designForm.preset)
      fd.append('title', designForm.title.trim())
      fd.append('message', designForm.message || '')
      fd.append('header_school', designForm.header_school || '')
      fd.append('header_college', designForm.header_college || '')
      fd.append('header_organization', designForm.header_organization || '')
      fd.append('text_color', designForm.text_color || '#0f172a')
      fd.append('font_size', String(Number(designForm.font_size) || 16))
      fd.append('text_align', designForm.text_align || 'CENTER')
      if (backgroundFile) fd.append('background_image', backgroundFile)

      const keptSignatories = []
      ;(designForm.signatories || []).forEach((s) => {
        const name = (s.name || '').trim()
        const position = (s.position || '').trim()
        if (!name && !position && !s.signature_url && !s.file) return
        keptSignatories.push({
          name,
          position,
          signature_url: s.file ? '' : (s.signature_url || ''),
          file: s.file,
        })
      })
      fd.append(
        'signatories',
        JSON.stringify(keptSignatories.map(({ name, position, signature_url }) => ({ name, position, signature_url })))
      )
      keptSignatories.forEach((s, i) => {
        if (s.file) fd.append(`signature_${i}`, s.file)
      })

      if (designEditingId) {
        await api.patch(`/certificates/designs/${designEditingId}/`, fd)
        toast.success('Design updated.')
      } else {
        await api.post('/certificates/designs/', fd)
        toast.success('Design saved.')
      }
      setDesignModalOpen(false)
      resetDesignForm()
      await fetchDesigns()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save design.')
    } finally {
      setDesignSaving(false)
    }
  }

  const confirmDeleteDesign = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/certificates/designs/${deleteTarget.id}/`)
      toast.success('Design removed.')
      setDeleteTarget(null)
      await fetchDesigns()
    } catch {
      toast.error('Failed to remove design.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleMember = (member) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[member.id]) delete next[member.id]
      else next[member.id] = { id: member.id, full_name: member.full_name || member.name }
      return next
    })
  }

  const mergeMembers = (members) => {
    setSelected((prev) => {
      const next = { ...prev }
      members.forEach((m) => { next[m.id] = { id: m.id, full_name: m.full_name } })
      return next
    })
  }

  const removeMember = (id) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const clearSelection = () => setSelected({})

  const doSelectAllMembers = async () => {
    setSelectingAll(true)
    try {
      const res = await fetchCandidateIds({ eventName, eventDate })
      mergeMembers(res.members || [])
      if (res.truncated) toast('Only the first 5000 members were added.')
    } catch {
      toast.error('Failed to select all members.')
    } finally {
      setSelectingAll(false)
      setSelectAllOpen(false)
    }
  }

  const canIssue =
    !isRestricted && selectedDesign && eventName.trim() && eventDate && selectedCount > 0

  const doIssue = async () => {
    setIssuing(true)
    try {
      const res = await api.post('/certificates/issue/', {
        design: selectedDesign.id,
        event_name: eventName.trim(),
        event_date: eventDate,
        member_ids: Object.keys(selected).map((id) => Number(id)),
      })
      setIssueResult(res.data)
      setIssueConfirmOpen(false)
      setSelected({})
      toast.success(`Issued ${res.data.issued} certificate${res.data.issued === 1 ? '' : 's'}.`)
      fetchDesigns({ silent: true })
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to issue certificates.')
    } finally {
      setIssuing(false)
    }
  }

  const confirmRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await api.post(`/certificates/${revokeTarget.id}/revoke/`)
      toast.success('Certificate revoked.')
      setRevokeTarget(null)
      await fetchIssued()
    } catch {
      toast.error('Failed to revoke certificate.')
    } finally {
      setRevoking(false)
    }
  }

  if (isRestricted) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-3 text-xl font-bold text-amber-900">Restricted account</h1>
          <p className="mt-2 text-sm text-amber-800">
            Your account has read-only access and cannot manage certificates.
          </p>
        </div>
      </div>
    )
  }

  const tagList = Object.values(selected)
  const visibleTags = tagList.slice(0, 60)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
            <Award className="h-8 w-8 text-sky-600" />
            Generate Certificate
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Design certificate templates, pick the members who joined an event, and issue their certificates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchDesigns()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
        {[{ id: 'issue', label: 'Issue certificates' }, { id: 'designs', label: 'Designs' }, { id: 'issued', label: 'Issued' }].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'designs' ? (
        <DesignsTab
          designs={designs}
          loading={designsLoading}
          onCreate={openCreateDesign}
          onEdit={openEditDesign}
          onDelete={setDeleteTarget}
        />
      ) : tab === 'issued' ? (
        <IssuedTab
          data={issued}
          loading={issuedLoading}
          search={issuedSearch}
          onSearch={setIssuedSearch}
          onRevoke={setRevokeTarget}
          onPrev={() => setIssuedPage((p) => Math.max(1, p - 1))}
          onNext={() => setIssuedPage((p) => p + 1)}
          page={issuedPage}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Event name</label>
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. ICpEP Tech Summit 2026"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Event date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Certificate design</label>
              <select
                value={designId}
                onChange={(e) => setDesignId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Select a design…</option>
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Choose recipients</h2>
              <MemberPicker
                eventName={eventName}
                eventDate={eventDate}
                selected={selected}
                onToggle={toggleMember}
                onSelectMembers={mergeMembers}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Preview</h2>
              </div>
              <CertificatePreview
                design={selectedDesign || previewDesign}
                memberName="Sample Member Name"
                eventName={eventName || 'Event name'}
                eventDate={eventDate}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Selected: {selectedCount}
                </p>
                <p className="text-xs text-slate-500">Ticks stay even after you search again.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectAllOpen(true)}
                  disabled={selectingAll}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Select all members
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedCount === 0}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear selection
                </button>
              </div>
            </div>

            {selectedCount > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleTags.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                  >
                    {m.full_name}
                    <button
                      type="button"
                      aria-label={`Remove ${m.full_name}`}
                      onClick={() => removeMember(m.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tagList.length > visibleTags.length ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    +{tagList.length - visibleTags.length} more
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="button"
                disabled={!canIssue}
                onClick={() => setIssueConfirmOpen(true)}
                className="w-full rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Issue Certificates ({selectedCount})
              </button>
            </div>
          </div>

          {issueResult ? (
            <IssueResult result={issueResult} onClose={() => setIssueResult(null)} />
          ) : null}
        </div>
      )}

      {/* Design modal */}
      {designModalOpen ? (
        <DesignModal
          form={designForm}
          setForm={setDesignForm}
          editing={!!designEditingId}
          saving={designSaving}
          preview={previewDesign}
          bgPreview={bgPreview}
          bgInputRef={bgInputRef}
          onPickBackground={onPickBackground}
          onPickSignature={onPickSignature}
          onAddSignatory={addSignatory}
          onRemoveSignatory={removeSignatory}
          onUpdateSignatory={updateSignatory}
          onCancel={() => { setDesignModalOpen(false); resetDesignForm() }}
          onSave={saveDesign}
        />
      ) : null}

      <ConfirmModal
        isOpen={deleteTarget != null}
        variant="caution"
        title="Remove this design?"
        description={deleteTarget ? `"${deleteTarget.name}" will be removed. Designs already used on certificates are archived instead of deleted.` : ''}
        confirmText="Remove"
        busy={deleting}
        onConfirm={confirmDeleteDesign}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={selectAllOpen}
        variant="info"
        title="Select all members?"
        description="This will select every approved, active member for this event. Members who already received a certificate for this event will be skipped."
        confirmText="Select all"
        busy={selectingAll}
        onConfirm={doSelectAllMembers}
        onCancel={() => setSelectAllOpen(false)}
      />

      <ConfirmModal
        isOpen={issueConfirmOpen}
        variant="info"
        title="Issue certificates?"
        description={`You are about to issue ${selectedCount} certificate${selectedCount === 1 ? '' : 's'} for "${eventName || 'this event'}". Continue?`}
        confirmText={`Issue ${selectedCount}`}
        busy={issuing}
        onConfirm={doIssue}
        onCancel={() => setIssueConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={revokeTarget != null}
        variant="caution"
        title="Revoke this certificate?"
        description={revokeTarget ? `The certificate for ${revokeTarget.member_name} (${revokeTarget.event_name}) will no longer be valid. Verification links will show it as revoked.` : ''}
        confirmText="Revoke"
        busy={revoking}
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  )
}

function DesignsTab({ designs, loading, onCreate, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Saved designs</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" /> New design
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Loading designs…
        </div>
      ) : designs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No certificate designs yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {designs.map((design) => (
            <div key={design.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-3">
                <CertificatePreview design={design} showQr={false} memberName="Sample Member Name" eventName="Sample Event" eventDate="2026-01-15" />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{design.name}</p>
                  <p className="text-xs text-slate-500">
                    {design.certificate_count || 0} issued · {PRESETS.find((p) => p.value === design.preset)?.label || design.preset}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(design)}
                    aria-label="Edit design"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(design)}
                    aria-label="Remove design"
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IssuedTab({ data, loading, search, onSearch, onRevoke, onPrev, onNext, page }) {
  const results = data.results || []
  const hasPrev = page > 1
  const hasNext = Boolean(data.next)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Issued certificates{data.count ? ` · ${data.count}` : ''}
        </h2>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search member, event, or code…"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Loading certificates…
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Award className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No certificates found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {results.map((cert) => (
              <div key={cert.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{cert.member_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {cert.event_name} · {formatDate(cert.event_date)} · <span className="font-mono">{cert.verification_code}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    cert.status === 'REVOKED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {cert.status === 'REVOKED' ? 'Revoked' : 'Issued'}
                  </span>
                  {cert.status === 'ISSUED' ? (
                    <button
                      type="button"
                      onClick={() => onRevoke(cert)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Ban className="h-3.5 w-3.5" /> Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev || loading}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="text-xs font-semibold text-slate-500">Page {page}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || loading}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DesignModal({
  form, setForm, editing, saving, preview,
  bgPreview, bgInputRef, onPickBackground,
  onPickSignature, onAddSignatory, onRemoveSignatory, onUpdateSignatory,
  onCancel, onSave,
}) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit design' : 'New design'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Design name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Participation 2026"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Preset</label>
              <select value={form.preset} onChange={(e) => set('preset', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Message</label>
              <textarea value={form.message} onChange={(e) => set('message', e.target.value)} rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Header (small text at top)</p>
              <input value={form.header_school} onChange={(e) => set('header_school', e.target.value)} placeholder="School / University"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
              <input value={form.header_college} onChange={(e) => set('header_college', e.target.value)} placeholder="College"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
              <input value={form.header_organization} onChange={(e) => set('header_organization', e.target.value)} placeholder="Organization"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Signatories</p>
                <button type="button" onClick={onAddSignatory}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                  <Plus className="h-3.5 w-3.5" /> Add signatory
                </button>
              </div>
              {(form.signatories || []).map((sig, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Signatory {index + 1}</span>
                    <button type="button" onClick={() => onRemoveSignatory(index)}
                      className="rounded-lg p-1 text-red-500 hover:bg-red-50" aria-label="Remove signatory">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input value={sig.name} onChange={(e) => onUpdateSignatory(index, { name: e.target.value })} placeholder="Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                  <input value={sig.position} onChange={(e) => onUpdateSignatory(index, { position: e.target.value })} placeholder="Position"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5" />
                      {sig.preview || sig.signature_url ? 'Change signature' : 'Upload signature'}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { onPickSignature(index, e.target.files?.[0]); e.target.value = '' }} />
                    </label>
                    {sig.preview || sig.signature_url ? (
                      <img src={sig.preview || sig.signature_url} alt="" className="h-8 w-16 rounded object-contain" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Text color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.text_color} onChange={(e) => set('text_color', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200" />
                  <input value={form.text_color} onChange={(e) => set('text_color', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Font size ({form.font_size})</label>
                <input type="range" min="11" max="30" value={Number(form.font_size) || 16} onChange={(e) => set('font_size', Number(e.target.value))}
                  className="w-full" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Alignment</label>
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                {[{ value: 'LEFT', label: 'Left' }, { value: 'CENTER', label: 'Center' }, { value: 'RIGHT', label: 'Right' }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('text_align', o.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      (form.text_align || 'CENTER') === o.value ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Background image</label>
              <button type="button" onClick={() => bgInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                {bgPreview || form.background_url || form.background_image ? 'Change background' : 'Upload background'}
              </button>
              <input ref={bgInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { onPickBackground(e.target.files?.[0]); e.target.value = '' }} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Live preview</label>
            <CertificatePreview design={preview} memberName="Sample Member Name" eventName="Event name" eventDate="2026-01-15" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={saving}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save design'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IssueResult({ result, onClose }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-emerald-900">
            {result.issued} certificate{result.issued === 1 ? '' : 's'} issued for {result.event_name}.
          </p>
          <p className="text-sm text-emerald-800">Event date: {formatDate(result.event_date)}</p>

          {result.skipped?.length ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-white/70 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4" /> {result.skipped.length} skipped
              </p>
              <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-800">
                {result.skipped.map((s, i) => (
                  <li key={i}>{s.name || `Member #${s.id}`} — {s.reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button type="button" onClick={onClose} className="mt-3 text-sm font-semibold text-emerald-800 underline">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
