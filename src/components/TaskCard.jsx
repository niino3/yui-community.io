import { MapPin, Calendar, Star } from 'lucide-react'

const taskTypeColors = {
  '草取り': 'bg-green-100 text-green-700',
  '収穫': 'bg-yellow-100 text-yellow-700',
  '種まき': 'bg-blue-100 text-blue-700',
  '袋詰め': 'bg-purple-100 text-purple-700',
  '農薬散布': 'bg-orange-100 text-orange-700',
  '農機具': 'bg-gray-100 text-gray-700',
}

const skillLabels = {
  beginner: { label: '未経験OK', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  experienced: { label: '経験者向け', color: 'bg-amber-50 text-amber-600 border border-amber-200' },
}

export default function TaskCard({ task, onClick }) {
  const typeColor = taskTypeColors[task.type] || 'bg-gray-100 text-gray-700'
  const skill = skillLabels[task.skillLevel]

  return (
    <button
      onClick={onClick}
      className="card w-full text-left p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor}`}>
            {task.type}
          </span>
          {skill && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${skill.color}`}>
              {skill.label}
            </span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-black text-token-600">{task.reward}</span>
          <span className="text-xs text-token-500 font-semibold ml-0.5">TOKEN</span>
        </div>
      </div>

      <p className="font-bold text-gray-800 mb-2 text-sm leading-snug">{task.title}</p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <span className="text-base">{task.requester.avatar}</span>
        <span className="font-medium text-gray-700">{task.requester.name}</span>
        <span className="text-yellow-500">⭐</span>
        <span>{task.requester.rating}</span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {task.dateLabel.split(' ')[0]}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {task.distance} · {task.location}
        </span>
      </div>

      {task.applicantsCount > 0 && (
        <div className="mt-2 text-xs text-blue-500 font-medium">
          {task.applicantsCount}名が応募中
        </div>
      )}
    </button>
  )
}
