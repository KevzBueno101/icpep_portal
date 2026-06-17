export default function OfficerSkeleton() {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Avatar skeleton */}
      <div className="h-56 w-full bg-slate-200 animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-6 text-center space-y-3">
        {/* Name skeleton */}
        <div className="h-6 bg-slate-200 rounded animate-pulse mx-auto w-3/4" />
        
        {/* Position skeleton */}
        <div className="h-5 bg-slate-200 rounded animate-pulse mx-auto w-1/2" />
        
        {/* Office skeleton */}
        <div className="h-4 bg-slate-200 rounded animate-pulse mx-auto w-2/3" />
        
        {/* Academic year skeleton */}
        <div className="h-3 bg-slate-200 rounded animate-pulse mx-auto w-1/3" />
      </div>
    </article>
  )
}
