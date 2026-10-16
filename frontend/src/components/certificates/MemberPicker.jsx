import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react'
import api from '../../api/axios'
import { fetchCandidateIds } from '../../api/certificates'

const PAGE_HINT = 25

export default function MemberPicker({
  eventName,
  eventDate,
  selected = {},
  onToggle,
  onSelectMembers,
}) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null })
  const [loading, setLoading] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/certificates/candidates/', {
          params: {
            page,
            ...(debounced ? { search: debounced } : {}),
            ...(eventName ? { event_name: eventName } : {}),
            ...(eventDate ? { event_date: eventDate } : {}),
          },
        })
        if (!cancelled) {
          setData({
            results: res.data.results || [],
            count: res.data.count || 0,
            next: res.data.next,
            previous: res.data.previous,
          })
        }
      } catch {
        if (!cancelled) setData({ results: [], count: 0, next: null, previous: null })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debounced, page, eventName, eventDate])

  const totalPages = Math.max(1, Math.ceil((data.count || 0) / PAGE_HINT))

  const selectableOnPage = useMemo(
    () => data.results.filter((m) => !m.already_issued),
    [data.results]
  )

  const handleSelectAllResults = async () => {
    setSelectingAll(true)
    try {
      const res = await fetchCandidateIds({ search: debounced, eventName, eventDate })
      onSelectMembers?.(res.members || [])
    } finally {
      setSelectingAll(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member by name, ID, or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-500" />
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500">
            {data.count} member{data.count === 1 ? '' : 's'} found
          </p>
          <button
            type="button"
            onClick={handleSelectAllResults}
            disabled={selectingAll || selectableOnPage.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Select all results
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && data.results.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">Loading members…</div>
        ) : data.results.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No members match this search.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.results.map((member) => {
              const isSelected = !!selected[member.id]
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    disabled={member.already_issued}
                    onClick={() => !member.already_issued && onToggle?.(member)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      member.already_issued
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                        isSelected
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                      </svg>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {member.full_name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {member.student_number} · {member.user_email}
                      </span>
                    </span>

                    {member.already_issued ? (
                      <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        Already issued
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          disabled={!data.previous || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={!data.next || loading}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
