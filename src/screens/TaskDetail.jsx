import { useState } from 'react'
import { MapPin, Calendar, Clock, ChevronRight, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import { tasks } from '../data/mockData'

const categoryLabelsMap = { people_care: 'お手伝い', earth_care: 'Earth Care' }

export default function TaskDetail({ goBack, navigate, params }) {
  const [applied, setApplied] = useState(false)
  const [showApplicants, setShowApplicants] = useState(false)

  const rawTask = params?.task ?? tasks.find(t => t.id === params?.taskId) ?? tasks[0]
  const task = {
    ...rawTask,
    dateLabel: rawTask.dateLabel ?? (rawTask.created_at ? new Date(rawTask.created_at).toLocaleDateString('ja-JP') : '募集中'),
    location: rawTask.location ?? 'コミュニティ',
    distance: rawTask.distance ?? '',
    reviews: rawTask.reviews ?? [],
    applicants: rawTask.applicants ?? [],
  }
  const isRequester = false // mock: viewing as worker

  function handleApply() {
    setApplied(true)
  }

  return (
    <div className="screen">
      <Header title="依頼の詳細" onBack={goBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary-50 to-[#faf8f4] px-5 pt-4 pb-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-4xl">{task.requester?.avatar ?? '👤'}</span>
            <div>
              <p className="text-xs text-gray-500">依頼者</p>
              <p className="text-base font-bold text-gray-800">{task.requester?.display_name ?? task.requester?.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {task.requester?.rating && <><span>⭐ {task.requester.rating}</span><span>·</span></>}
                {task.requester?.transactionCount != null && <span>依頼 {task.requester.transactionCount}回</span>}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-black text-gray-800 mb-1">{task.title}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{categoryLabelsMap[task.category] ?? task.type}</span>
            {task.skillLevel === 'beginner' && (
              <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-0.5 rounded-full border border-emerald-200">未経験OK</span>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pb-6">
          {/* Reward */}
          <div className="card p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">報酬</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-token-600">{task.token_reward ?? task.reward}</span>
              <span className="text-sm font-bold text-token-500">TOKEN</span>
            </div>
          </div>

          {/* Details */}
          <div className="card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">日時</p>
                <p className="text-sm font-bold text-gray-800">{task.dateLabel}</p>
              </div>
            </div>
            <div className="border-t border-gray-50" />
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">場所</p>
                <p className="text-sm font-bold text-gray-800">{task.location}</p>
                {task.distance && <p className="text-xs text-primary-500 mt-0.5">現在地から {task.distance}</p>}
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="h-32 rounded-2xl bg-gradient-to-b from-green-100 to-green-200 overflow-hidden relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #4a7c59 0, #4a7c59 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #4a7c59 0, #4a7c59 1px, transparent 0, transparent 40px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-full p-2 shadow-md">
                <MapPin size={20} className="text-primary-500" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">依頼内容</p>
            <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Reviews */}
          {task.reviews.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-bold text-gray-500 mb-3">過去の評価コメント</p>
              <div className="space-y-2">
                {task.reviews.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-yellow-400 text-sm">⭐</span>
                    <div>
                      <p className="text-xs text-gray-700">「{r.text}」</p>
                      <p className="text-[10px] text-gray-400">{r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applicants (requester view) */}
          {task.applicants.length > 0 && (
            <div className="card p-4">
              <button
                onClick={() => setShowApplicants(!showApplicants)}
                className="w-full flex items-center justify-between"
              >
                <p className="text-xs font-bold text-gray-700">応募者 {task.applicants.length}名</p>
                <ChevronRight size={16} className={`text-gray-400 transition-transform ${showApplicants ? 'rotate-90' : ''}`} />
              </button>

              {showApplicants && (
                <div className="mt-3 space-y-3">
                  {task.applicants.map(a => (
                    <div key={a.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{a.avatar}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{a.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>⭐ {a.rating}</span>
                            <span>取引 {a.transactionCount}回</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">「{a.comment}」</p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold active:bg-primary-600">
                          この人にお願いする
                        </button>
                        <button className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-500 active:bg-gray-50">
                          断る
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply button */}
      {!isRequester && task.status === 'open' && (
        <div className="flex-shrink-0 p-4 bg-[#faf8f4] border-t border-gray-100">
          {applied ? (
            <div className="flex items-center justify-center gap-2 py-4 bg-primary-50 rounded-2xl border border-primary-200">
              <CheckCircle size={20} className="text-primary-500" />
              <span className="text-sm font-bold text-primary-600">応募しました！承認をお待ちください</span>
            </div>
          ) : (
            <button onClick={handleApply} className="btn-primary">
              応募する — {task.token_reward ?? task.reward} TOKEN もらえます
            </button>
          )}
        </div>
      )}
    </div>
  )
}
