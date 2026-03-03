import { useState } from 'react'
import { MapPin, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import { currentUser } from '../data/mockData'

const taskTypes = ['草取り', '収穫', '種まき', '袋詰め', '農薬散布', '農機具操作', 'その他']
const timeSlots = ['午前 9:00〜12:00', '午後 13:00〜17:00', '一日（9:00〜17:00）']
const tokenSuggestions = [15, 25, 30, 40, 50]

export default function TaskPost({ goBack, navigate }) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    type: '',
    date: '',
    timeSlot: '',
    tokens: 30,
    memo: '',
  })

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">投稿しました！</h2>
          <p className="text-sm text-gray-500 mb-2">応募者が来たらLINEでお知らせします</p>
          <div className="card w-full p-4 mt-4 text-left">
            <p className="text-xs text-gray-500 mb-1">作業内容</p>
            <p className="font-bold text-gray-800">{form.type || '草取り'}</p>
            <p className="text-xs text-gray-500 mt-2 mb-1">日時</p>
            <p className="font-bold text-gray-800">{form.date || '3月15日'} {form.timeSlot || '午前'}</p>
            <p className="text-xs text-gray-500 mt-2 mb-1">報酬</p>
            <p className="text-xl font-black text-token-600">{form.tokens} <span className="text-sm text-token-500">TOKEN</span></p>
          </div>
          <button
            onClick={() => navigate('home')}
            className="btn-primary mt-6"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="お手伝いを頼む" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Task type */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">何をお願いしますか？</p>
          <div className="grid grid-cols-3 gap-2">
            {taskTypes.map(type => (
              <button
                key={type}
                onClick={() => update('type', type)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  form.type === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">いつ？</p>
          <input
            type="date"
            value={form.date}
            onChange={e => update('date', e.target.value)}
            className="w-full py-3 px-4 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-primary-400"
          />
          <p className="text-xs font-bold text-gray-700 mt-3 mb-2">時間帯</p>
          <div className="space-y-2">
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => update('timeSlot', slot)}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-colors ${
                  form.timeSlot === slot
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">どこで？</p>
          <button className="w-full flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
            <MapPin size={18} className="text-primary-500" />
            <span className="text-sm text-gray-500">📍 現在地の近くを選ぶ</span>
          </button>
          <div className="mt-2 h-24 bg-gradient-to-b from-green-100 to-green-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
            地図で場所を選択（モック）
          </div>
        </div>

        {/* Token amount */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-1">お礼（TOKEN）</p>
          <p className="text-xs text-gray-400 mb-3">現在の残高: {currentUser.tokens} TOKEN</p>
          <div className="flex items-baseline gap-2 mb-3">
            <input
              type="number"
              value={form.tokens}
              onChange={e => update('tokens', Number(e.target.value))}
              className="w-24 text-3xl font-black text-token-600 bg-transparent border-b-2 border-token-400 text-center focus:outline-none"
            />
            <span className="text-lg font-bold text-token-500">TOKEN</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tokenSuggestions.map(s => (
              <button
                key={s}
                onClick={() => update('tokens', s)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  form.tokens === s
                    ? 'bg-token-500 text-white'
                    : 'bg-token-50 text-token-600 border border-token-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Memo */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">一言メモ（任意）</p>
          <textarea
            value={form.memo}
            onChange={e => update('memo', e.target.value)}
            placeholder="例：畑の南側をお願いします。道具は用意してあります。"
            rows={3}
            className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-primary-400 resize-none"
          />
        </div>
      </div>

      <div className="flex-shrink-0 p-4 bg-[#faf8f4] border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={!form.type}
          className={`btn-primary ${!form.type ? 'opacity-50' : ''}`}
        >
          投稿する
        </button>
      </div>
    </div>
  )
}
