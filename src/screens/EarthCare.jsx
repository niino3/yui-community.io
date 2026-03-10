import { useState } from 'react'
import { Camera, MapPin } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useEarthCareCreate } from '../hooks/useEarthCare'
import { earthCareActivities } from '../data/mockData'

export default function EarthCare({ goBack }) {
  const [step, setStep] = useState('form')
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [photoTaken, setPhotoTaken] = useState(false)

  const { isAuthenticated } = useAuth()
  const createMutation = useEarthCareCreate()

  const selectedActivity = earthCareActivities.find(a => a.id === selected)

  async function handleSubmit() {
    if (isAuthenticated && selectedActivity) {
      try {
        await createMutation.mutateAsync({
          type: selectedActivity.type,
          amount: Number(amount) || 1,
          description: `${selectedActivity.label} ${amount || 1}`,
        })
      } catch { /* proceed with mock flow */ }
    }
    setStep('pending')
  }

  if (step === 'approved') {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🌱</span>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">承認されました！</h2>
          <p className="text-sm text-gray-500 mb-4">
            コミュニティメンバーが承認しました
          </p>
          <div className="card w-full p-5 text-center">
            <p className="text-xs text-gray-500 mb-2">獲得TOKEN</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-token-600">+{selectedActivity?.tokenReward || 15}</span>
              <span className="text-xl font-bold text-token-500">TOKEN</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-emerald-600 text-sm font-bold">🌱 Earth Care SBT 発行！</span>
            </div>
          </div>
          <button onClick={goBack} className="btn-primary mt-6">戻る</button>
        </div>
      </div>
    )
  }

  if (step === 'pending') {
    return (
      <div className="screen">
        <Header title="承認待ち" onBack={goBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">申請しました！</h2>
          <p className="text-sm text-gray-500 mb-6">
            コミュニティメンバーに承認リクエストが届きました。
            3名以上の承認で確定します。
          </p>

          <div className="card w-full p-4 text-left">
            <p className="text-xs text-gray-500 mb-3">承認状況</p>
            <div className="space-y-2">
              {[
                { name: '山田 さやか', status: 'approved' },
                { name: '伊藤 農園', status: 'approved' },
                { name: '中村 みか', status: 'pending' },
              ].map(a => (
                <div key={a.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{a.name}</span>
                  <span className={`text-xs font-bold ${a.status === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                    {a.status === 'approved' ? '✓ 承認' : '待機中...'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">2/3 承認済み</p>
          </div>

          <button
            onClick={() => setStep('approved')}
            className="btn-primary mt-6"
          >
            承認される（モック）
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="Earth Care 活動を記録" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
          <p className="font-bold mb-0.5">地球への貢献をトークン化 🌍</p>
          <p className="text-xs text-emerald-100">植樹・堆肥・水路清掃などの活動を記録してTOKENとSBTを獲得</p>
        </div>

        {/* Activity type */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">活動の種類</p>
          <div className="grid grid-cols-3 gap-2">
            {earthCareActivities.map(activity => (
              <button
                key={activity.id}
                onClick={() => setSelected(activity.id)}
                className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                  selected === activity.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                <span className="text-2xl">{activity.icon}</span>
                <span className="text-[10px] font-bold">{activity.label}</span>
                <span className={`text-[10px] font-bold ${selected === activity.id ? 'text-emerald-100' : 'text-token-500'}`}>
                  +{activity.tokenReward}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        {selected && (
          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">
              {selectedActivity?.label === '植樹' ? '本数' :
               selectedActivity?.label === '堆肥作り' ? '量（kg）' : '面積・時間など'}
            </p>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="例: 5"
              className="w-full py-3 px-4 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}

        {/* Photo */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">写真を撮る（複数可）</p>
          {photoTaken ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="h-24 bg-green-100 rounded-xl flex items-center justify-center relative">
                <span className="text-3xl">🌳</span>
                <span className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded">活動前</span>
              </div>
              <div className="h-24 bg-green-200 rounded-xl flex items-center justify-center relative">
                <span className="text-3xl">🌲</span>
                <span className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded">活動後</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPhotoTaken(true)}
              className="w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-gray-100"
            >
              <Camera size={28} className="text-gray-400" />
              <span className="text-xs text-gray-500">タップして撮影</span>
            </button>
          )}
        </div>

        {/* GPS */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">位置情報</p>
            <p className="text-xs text-green-600">● 自動取得済み: ○○地区 北山</p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={!selected || !photoTaken || createMutation.isPending}
          className={`w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg active:bg-emerald-600 transition-colors ${(!selected || !photoTaken) ? 'opacity-50' : ''}`}
        >
          {createMutation.isPending ? '送信中...' : 'コミュニティに申請する'}
        </button>
        {(!selected || !photoTaken) && (
          <p className="text-center text-xs text-gray-400 mt-2">
            活動種別と写真を入力してください
          </p>
        )}
      </div>
    </div>
  )
}
