export default function EmptyState({ icon = '🌿', message = 'データがありません', sub }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium text-gray-500">{message}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
