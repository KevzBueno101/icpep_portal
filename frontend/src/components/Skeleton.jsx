export default function Skeleton({ className = '', height = '', width = '', rounded = true }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 ${rounded ? 'rounded-lg' : ''} ${height} ${width} ${className}`}
    />
  )
}
