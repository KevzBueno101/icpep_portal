import Skeleton from '../Skeleton'

export default function PageSkeleton({ className = '', dark = false }) {
  const bg = dark ? 'bg-slate-800' : 'bg-slate-200'
  const containerBg = dark ? 'bg-[#070E1B]' : 'bg-slate-50'
  return (
    <div className={`min-h-screen ${containerBg} flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className={`h-8 w-64 mx-auto ${bg}`} />
        <Skeleton className={`h-4 w-48 mx-auto ${bg}`} />
        <div className="space-y-3 pt-4">
          <Skeleton className={`h-4 w-full ${bg}`} />
          <Skeleton className={`h-4 w-5/6 ${bg}`} />
          <Skeleton className={`h-4 w-4/6 ${bg}`} />
        </div>
      </div>
    </div>
  )
}
