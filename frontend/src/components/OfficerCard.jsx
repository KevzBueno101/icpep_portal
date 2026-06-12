import { resolveProfilePictureUrl } from '../utils/profilePicture'

export default function OfficerCard({ officer }) {
  const {
    user,
    position,
    photo,
    profile_picture,
    department,
    academic_year,
    first_name,
    last_name,
    username
  } = officer

  const fname = first_name || user?.first_name || ''
  const lname = last_name || user?.last_name || ''
  const uname = username || user?.username || ''
  const rawPic = profile_picture || photo || null
  const pic = resolveProfilePictureUrl(rawPic)

  const initials = `${fname?.[0] ?? ''}${lname?.[0] ?? ''}`.toUpperCase() || 'IC'

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {pic ? (
        <img src={pic} alt={uname || 'Officer'} className="h-56 w-full bg-slate-200 object-cover" />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-slate-200">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-700 text-2xl font-bold text-white">
            {initials}
          </span>
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="mb-1 text-lg font-bold text-slate-900">
          {fname || uname || 'Officer'} {lname}
        </h3>
        <p className="mb-2 font-semibold text-sky-600">{position}</p>
        {department && <p className="mb-2 text-sm text-slate-600">{department}</p>}
        {academic_year && <p className="text-xs text-slate-500">AY {academic_year}</p>}
      </div>
    </article>
  )
}
