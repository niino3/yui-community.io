import { useState } from 'react'
import { MapPin, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useEquipmentDetail, useEquipmentReserve, useEquipmentReturn } from '../hooks/useEquipment'
import { equipment as mockEquipment } from '../data/mockData'

const timeSlots = ['午前（9:00〜12:00）', '午後（13:00〜17:00）', '一日（9:00〜17:00）']

export default function EquipmentDetail({ goBack, params }) {
  const [step, setStep] = useState('detail')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [rating, setRating] = useState(0)
  const [returned, setReturned] = useState(false)

  const { isAuthenticated } = useAuth()
  const { data: apiItem } = useEquipmentDetail(
    isAuthenticated ? params?.equipmentId : null
  )
  const reserveMutation = useEquipmentReserve()
  const returnMutation = useEquipmentReturn()

  const item = apiItem?.data ?? params?.equipment ?? mockEquipment.find(e => e.id === params?.equipmentId) ?? mockEquipment[0]
  const available = item.available ?? item.status === 'available'
  const pricePerHalf = item.pricePerHalf ?? item.price_per_half ?? 5
  const deposit = item.deposit ?? 10

  async function handleReserve() {
    if (isAuthenticated) {
      try {
        await reserveMutation.mutateAsync({ id: item.id, data: { time_slot: selectedSlot } })
      } catch { /* proceed with mock flow */ }
    }
    setStep('confirmed')
  }

  async function handleReturn() {
    if (isAuthenticated) {
      try {
        await returnMutation.mutateAsync(item.id)
      } catch { /* proceed with mock flow */ }
    }
    setReturned(true)
  }

  if (returned) {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">返却完了！</h2>
          <div className="card w-full p-4 mt-2 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">利用時間</span>
              <span className="font-bold">3時間24分</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">利用料</span>
              <span className="font-bold text-red-500">-{pricePerHalf} TOKEN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">保証金返却</span>
              <span className="font-bold text-green-600">+{deposit} TOKEN</span>
            </div>
          </div>
          <button onClick={goBack} className="btn-primary mt-6">戻る</button>
        </div>
      </div>
    )
  }

  if (step === 'using') {
    return (
      <div className="screen">
        <Header title="利用中" onBack={() => setStep('detail')} />
        <div className="flex-1 px-4 py-4 space-y-4">
          <div className="card p-5 text-center">
            <span className="text-5xl">{item.icon ?? '🚜'}</span>
            <h2 className="text-xl font-black text-gray-800 mt-2">{item.name}</h2>
            <p className="text-xs text-gray-500">{item.brand ?? item.description}</p>
            <div className="mt-3 py-2 bg-green-50 rounded-xl">
              <p className="text-xs text-green-600 font-bold">● 利用中</p>
              <p className="text-2xl font-mono font-black text-gray-800 mt-1">03:24:15</p>
            </div>
          </div>

          <div className="card p-4 space-y-2">
            {[
              { icon: '🎥', label: '操作マニュアルを見る' },
              { icon: '📞', label: '緊急連絡先' },
              { icon: '🛡️', label: '保険情報' },
            ].map(link => (
              <button key={link.label} className="w-full flex items-center gap-3 py-3 px-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-100">
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>

          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">返却時の評価</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl">
                  {s <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <button
            onClick={handleReturn}
            disabled={rating === 0 || returnMutation.isPending}
            className={`btn-primary ${rating === 0 ? 'opacity-50' : ''}`}
          >
            {returnMutation.isPending ? '処理中...' : '返却QRをスキャンして精算'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'confirmed') {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-4xl">
            {item.icon ?? '🚜'}
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">予約しました！</h2>
          <p className="text-sm text-gray-500 mb-4">
            {item.name}の予約が確定しました
          </p>
          <div className="card w-full p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">農機具</span>
              <span className="font-bold">{item.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">時間帯</span>
              <span className="font-bold">{selectedSlot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">場所</span>
              <span className="font-bold">{item.location ?? 'コミュニティ倉庫'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">エスクロー</span>
              <span className="font-bold text-token-600">{pricePerHalf + deposit} TOKEN ロック中</span>
            </div>
          </div>
          <button onClick={() => setStep('using')} className="btn-primary mt-6">
            農機具QRをスキャンして開始
          </button>
        </div>
      </div>
    )
  }

  if (step === 'reserve') {
    return (
      <div className="screen">
        <Header title="利用日時を選ぶ" onBack={() => setStep('detail')} />
        <div className="flex-1 px-4 py-4 space-y-4">
          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">時間帯を選んでください</p>
            <div className="space-y-2">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium text-left transition-colors ${selectedSlot === slot ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">費用の確認</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">利用料</span>
                <span className="font-bold text-token-600">{pricePerHalf} TOKEN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">保証金（返却時に返却）</span>
                <span className="font-bold text-gray-600">{deposit} TOKEN</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-700">合計（一時ロック）</span>
                <span className="font-black text-token-600">{pricePerHalf + deposit} TOKEN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <button
            onClick={handleReserve}
            disabled={!selectedSlot || reserveMutation.isPending}
            className={`btn-primary ${!selectedSlot ? 'opacity-50' : ''}`}
          >
            {reserveMutation.isPending ? '処理中...' : '予約を確定する'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title={item.name} onBack={goBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-amber-50 flex flex-col items-center py-6">
          <span className="text-7xl">{item.icon ?? '🚜'}</span>
          <h2 className="text-xl font-black text-gray-800 mt-2">{item.name}</h2>
          <p className="text-sm text-gray-500">{item.brand ?? item.description}</p>
        </div>

        <div className="px-4 py-4 space-y-3">
          <div className="card p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-black text-token-600">{pricePerHalf}</p>
                <p className="text-xs text-gray-500">TOKEN/半日</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-700">⭐{item.rating ?? '-'}</p>
                <p className="text-xs text-gray-500">評価</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-700">{item.useCount ?? item.use_count ?? 0}</p>
                <p className="text-xs text-gray-500">利用回数</p>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">説明</p>
              <p className="text-sm text-gray-700">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary-500" />
              <p className="text-sm text-gray-700">{item.location ?? 'コミュニティ倉庫'}</p>
            </div>
          </div>

          <div className={`card p-4 ${available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-sm font-bold ${available ? 'text-green-700' : 'text-red-600'}`}>
              {available ? '✅ 利用可能' : '❌ 貸出中'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{item.nextAvailable ?? item.next_available ?? ''}</p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <button
          onClick={() => setStep('reserve')}
          disabled={!available}
          className={`btn-primary ${!available ? 'opacity-50' : ''}`}
        >
          {available ? '予約する' : '貸出中 — 予約不可'}
        </button>
      </div>
    </div>
  )
}
