import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Header from '../components/Header'

export default function ApproveWork({ goBack }) {
  const [rating, setRating] = useState(0)
  const [approved, setApproved] = useState(false)

  const worker = { name: '鈴木 けんた', avatar: '👨‍🌾', rating: 4.8, transactionCount: 32 }
  const task = { title: '畑の草取り', reward: 30 }

  function handleApprove() {
    if (rating > 0) setApproved(true)
  }

  if (approved) {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-token-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-5xl">🎉</span>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">承認しました！</h2>
          <p className="text-sm text-gray-500 mb-4">
            {worker.name}さんへ
            <span className="font-black text-token-600 text-lg mx-1">{task.reward}</span>
            TOKEN を送りました
          </p>
          <div className="card w-full p-4">
            <p className="text-xs text-gray-500 mb-1">お互いの貢献記録が更新されました</p>
            <div className="flex items-center gap-2 text-sm">
              <span>🌾</span>
              <span className="font-medium text-gray-700">Contribution SBT が発行されました</span>
            </div>
          </div>
          <button onClick={goBack} className="btn-primary mt-6">ホームに戻る</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="作業完了の確認" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Worker info */}
        <div className="card p-4 flex items-center gap-3">
          <span className="text-4xl">{worker.avatar}</span>
          <div>
            <p className="text-xs text-gray-500">作業者</p>
            <p className="text-base font-bold text-gray-800">{worker.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>⭐ {worker.rating}</span>
              <span>·</span>
              <span>取引 {worker.transactionCount}回</span>
            </div>
          </div>
        </div>

        {/* Task + reward */}
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">完了報告</p>
          <p className="font-bold text-gray-800 mb-3">{task.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">送金額</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-token-600">{task.reward}</span>
              <span className="text-sm font-bold text-token-500">TOKEN</span>
            </div>
          </div>
        </div>

        {/* Completion photo */}
        <div className="card p-4">
          <p className="text-xs font-bold text-gray-500 mb-3">完了写真</p>
          <button className="w-full h-36 bg-gradient-to-b from-green-100 to-green-200 rounded-xl flex items-center justify-center relative overflow-hidden">
            <span className="text-5xl">🌿</span>
            <span className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-0.5 rounded-full font-medium text-gray-600">
              📷 完了写真を見る
            </span>
          </button>
        </div>

        {/* Rating */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-4 text-center">
            作業はいかがでしたか？
          </p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="text-4xl transition-transform active:scale-110"
              >
                {s <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {rating === 5 ? '最高でした！' : rating === 4 ? 'とても良かったです' : rating === 3 ? '普通でした' : rating === 2 ? 'もう少し...' : '残念でした'}
            </p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 bg-[#faf8f4] border-t border-gray-100">
        <button
          onClick={handleApprove}
          disabled={rating === 0}
          className={`btn-token ${rating === 0 ? 'opacity-50' : ''}`}
        >
          OK！ {task.reward} TOKEN を送る
        </button>
        {rating === 0 && (
          <p className="text-center text-xs text-gray-400 mt-2">評価を入力してください</p>
        )}
      </div>
    </div>
  )
}
