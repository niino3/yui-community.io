import { useState } from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'

const tutorialSteps = [
  {
    icon: '⛓️',
    title: 'ブロックチェーンで動く',
    description: '最先端のブロックチェーン基盤を採用。すべての貢献記録・トークン取引が改ざん不可能な形で安全に記録されます。難しい操作は一切不要です。',
    color: 'bg-purple-100',
  },
  {
    icon: '📋',
    title: 'お手伝いを探す',
    description: '掲示板から近くの農作業を探して応募。マッチングされたらTOKENがもらえます。',
    color: 'bg-primary-100',
  },
  {
    icon: '📱',
    title: 'QRで簡単決済',
    description: '農産物のQRコードをスキャンするだけ。TOKENで支払えます。',
    color: 'bg-blue-100',
  },
  {
    icon: '🌱',
    title: 'Earth Careで地球に貢献',
    description: '植樹・堆肥・清掃活動を記録するとTOKENとSBTがもらえます。',
    color: 'bg-emerald-100',
  },
]

export default function Onboarding({ navigate }) {
  const [step, setStep] = useState('welcome') // 'welcome', 'login', 'member-card', 'tutorial', 'done'
  const [tutorialIndex, setTutorialIndex] = useState(0)

  if (step === 'done') {
    navigate('home')
    return null
  }

  if (step === 'tutorial') {
    const current = tutorialSteps[tutorialIndex]
    const isLast = tutorialIndex === tutorialSteps.length - 1

    return (
      <div className="flex-1 flex flex-col px-6">
        {/* Progress */}
        <div className="flex gap-2 pt-6 pb-4 justify-center">
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === tutorialIndex ? 'w-8 bg-primary-500' : i < tutorialIndex ? 'w-4 bg-primary-300' : 'w-4 bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`w-28 h-28 ${current.color} rounded-full flex items-center justify-center mb-6`}>
            <span className="text-6xl">{current.icon}</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
        </div>

        <div className="pb-6">
          <button
            onClick={() => {
              if (isLast) {
                setStep('done')
              } else {
                setTutorialIndex(i => i + 1)
              }
            }}
            className="btn-primary"
          >
            {isLast ? 'はじめる！' : '次へ'}
          </button>
          {!isLast && (
            <button
              onClick={() => setStep('done')}
              className="w-full text-center text-sm text-gray-400 mt-3"
            >
              スキップ
            </button>
          )}
        </div>
      </div>
    )
  }

  if (step === 'member-card') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-primary-500" />
        </div>
        <h2 className="text-xl font-black text-gray-800 mb-2">ようこそ！</h2>
        <p className="text-sm text-gray-500 mb-6">これがあなたの会員証です</p>

        {/* Member card */}
        <div className="w-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-5 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-primary-200 font-medium">yui メンバー証</p>
              <p className="text-2xl font-black mt-0.5">🌾</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary-200">発行日</p>
              <p className="text-xs font-bold">2026-03-03</p>
            </div>
          </div>
          <p className="text-2xl font-black mb-1">田中 よし子</p>
          <p className="text-primary-200 text-sm">○○地区 / 農家</p>
          <div className="mt-4 pt-4 border-t border-primary-400/50">
            <p className="text-xs text-primary-200">
              🔒 このカードは譲渡・売買できません
            </p>
          </div>
        </div>

        <div className="card w-full p-4 mb-6 text-left">
          <p className="text-xs text-gray-500 mb-1">新規加入ボーナス</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-token-600">+10</span>
            <span className="text-lg font-bold text-token-500">TOKEN</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">ウォレットに付与されました</p>
        </div>

        <button onClick={() => setStep('tutorial')} className="btn-primary">
          使い方を確認する（5分）
        </button>
        <button onClick={() => setStep('done')} className="w-full text-center text-sm text-gray-400 mt-3">
          スキップして始める
        </button>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🌾</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-1">yui に参加する</h2>
        <p className="text-sm text-gray-500 mb-8">
          お名前と地域を教えてください
        </p>

        <div className="w-full space-y-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <input
              type="text"
              placeholder="お名前"
              defaultValue="田中 よし子"
              className="w-full py-4 px-5 text-sm focus:outline-none"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200">
            <select className="w-full py-4 px-5 text-sm focus:outline-none bg-transparent appearance-none">
              <option>○○地区</option>
              <option>△△地区</option>
              <option>□□地区</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200">
            <select className="w-full py-4 px-5 text-sm focus:outline-none bg-transparent appearance-none">
              <option>農家（農地を持っている）</option>
              <option>作業者（お手伝いしたい）</option>
              <option>地域住民（農機具を借りたい）</option>
            </select>
          </div>
        </div>

        <button onClick={() => setStep('member-card')} className="btn-primary">
          参加する
        </button>
      </div>
    )
  }

  // Welcome
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">🌾</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-token-400 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
            ¥
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-800 mb-2">yui</h1>
        <p className="text-sm text-gray-600 mb-1">農のある生活 × ブロックチェーン</p>
        <p className="text-xs text-gray-400 leading-relaxed mt-2">
          ブロックチェーン技術で「お互い様」をトークン化。<br />
          農作業・農産物・環境貢献を、<br />
          信頼と価値に変えるプラットフォーム。
        </p>

        {/* Tech badges */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-100">
            ⛓️ Blockchain
          </span>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
            🪙 SBT / Token
          </span>
          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
            🏛️ DAO
          </span>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {['農作業マッチング', 'QR決済', 'Earth Care', '農機具シェア'].map(f => (
            <span key={f} className="bg-primary-50 text-primary-600 text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 space-y-3">
        <button
          onClick={() => setStep('login')}
          className="w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-md active:opacity-90"
        >
          <span className="text-2xl">💬</span>
          LINE で参加する
        </button>
        <p className="text-center text-xs text-gray-400">
          LINEアカウントでかんたんにログインできます
        </p>
      </div>
    </div>
  )
}
