export default function OfficerCard({ officer }) {
  const { user, position, photo, department, academic_year } = officer
  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}` || 'IC'

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {photo ? (
        <img src={photo} alt={user?.username} className="h-56 w-full bg-slate-200 object-cover" />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-slate-200">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-700 text-2xl font-bold text-white">
            {initials}
          </span>
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="mb-1 text-lg font-bold text-slate-900">
          {user?.first_name || 'Officer'} {user?.last_name}
        </h3>
        <p className="mb-2 font-semibold text-sky-600">{position}</p>
        {department && <p className="mb-2 text-sm text-slate-600">{department}</p>}
        {academic_year && <p className="text-xs text-slate-500">AY {academic_year}</p>}
      </div>
    </article>
  )
}
