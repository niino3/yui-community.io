export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${width} ${height} bg-gray-200 rounded-lg animate-pulse`} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 3, lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  )
}
