import { MapPin, Calendar } from 'lucide-react'

const categoryLabels = {
  people_care: 'お手伝い',
  earth_care: 'Earth Care',
}

const categoryColors = {
  people_care: 'bg-primary-100 text-primary-700',
  earth_care: 'bg-emerald-100 text-emerald-700',
}

/** API 形式のタスクを TaskCard 用に正規化 */
export function normalizeTaskForCard(task) {
  const isApiFormat = typeof task.category === 'string' && ['people_care', 'earth_care'].includes(task.category)
  if (isApiFormat) {
    return {
      id: task.id,
      type: categoryLabels[task.category] || task.category,
      reward: Number(task.token_reward) || 0,
      requester: {
        avatar: task.requester?.avatar_url ? '🖼️' : '👤',
        name: task.requester?.display_name || task.requester?.wallet_address?.slice(0, 10) + '...' || '不明',
        rating: '-',
      },
      dateLabel: task.created_at ? new Date(task.created_at).toLocaleDateString('ja-JP') : '募集中',
      location: 'コミュニティ',
      distance: '',
      applicantsCount: task.status === 'open' ? null : 0,
      skillLevel: null,
    }
  }
  return task
}

const legacyTypeColors = {
  '草取り': 'bg-green-100 text-green-700',
  '収穫': 'bg-yellow-100 text-yellow-700',
  '種まき': 'bg-blue-100 text-blue-700',
  '袋詰め': 'bg-purple-100 text-purple-700',
}

export default function TaskCard({ task, onClick }) {
  const t = normalizeTaskForCard(task)
  const typeColor = categoryColors[task.category] || legacyTypeColors[task.type] || 'bg-gray-100 text-gray-700'

  return (
    <button
      onClick={onClick}
      className="card w-full text-left p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor}`}>
            {t.type}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-black text-token-600">{t.reward}</span>
          <span className="text-xs text-token-500 font-semibold ml-0.5">TOKEN</span>
        </div>
      </div>

      <p className="font-bold text-gray-800 mb-2 text-sm leading-snug">{task.title}</p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <span className="text-base">{t.requester?.avatar || '👤'}</span>
        <span className="font-medium text-gray-700">{t.requester?.name}</span>
        {t.requester?.rating && t.requester.rating !== '-' && (
          <>
            <span className="text-yellow-500">⭐</span>
            <span>{t.requester.rating}</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {typeof t.dateLabel === 'string' && t.dateLabel.includes(' ') ? t.dateLabel.split(' ')[0] : t.dateLabel}
        </span>
        {(t.location || t.distance) && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {[t.distance, t.location].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {t.applicantsCount > 0 && (
        <div className="mt-2 text-xs text-blue-500 font-medium">
          {t.applicantsCount}名が応募中
        </div>
      )}
    </button>
  )
}
