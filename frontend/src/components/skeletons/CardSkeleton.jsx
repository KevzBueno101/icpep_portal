import Skeleton from '../Skeleton'

export default function CardSkeleton({ count = 1, className = '', dark = false }) {
  const bg = dark ? 'bg-slate-700' : 'bg-slate-200'
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className={`h-6 w-16 shrink-0 ${bg} rounded-full`} />
            <div className="flex-1 space-y-2">
              <Skeleton className={`h-5 w-3/4 ${bg}`} />
              <Skeleton className={`h-4 w-1/3 ${bg}`} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className={`h-4 w-full ${bg}`} />
            <Skeleton className={`h-4 w-5/6 ${bg}`} />
          </div>
          <Skeleton className={`mt-4 h-3 w-24 ${bg}`} />
        </div>
      ))}
    </div>
  )
}
