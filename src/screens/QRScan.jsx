import { useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

const states = ['scan', 'confirm', 'success']

const mockProduct = {
  name: 'ミニトマト（500g）',
  seller: '田中 よし子',
  price: 15,
  description: '無農薬・有機栽培。今朝収穫したばかりです。',
  icon: '🍅',
}

export default function QRScan({ navigate }) {
  const [state, setState] = useState('scan')
  const [scanMode, setScanMode] = useState('pay') // 'pay' or 'complete'

  function handleScan() {
    setState('confirm')
  }

  function handlePay() {
    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={48} className="text-primary-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">決済完了！</h2>
          <p className="text-gray-500 text-sm mb-1">{mockProduct.name}</p>
          <div className="flex items-baseline gap-1 my-3">
            <span className="text-4xl font-black text-token-600">-{mockProduct.price}</span>
            <span className="text-lg font-bold text-token-500">TOKEN</span>
          </div>
          <div className="card w-full p-4 mt-2 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">販売者</span>
              <span className="font-bold">{mockProduct.seller}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品</span>
              <span className="font-bold">{mockProduct.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">金額</span>
              <span className="font-bold text-token-600">{mockProduct.price} TOKEN</span>
            </div>
          </div>
          <button onClick={() => setState('scan')} className="btn-primary mt-6">
            続けてスキャン
          </button>
          <button onClick={() => navigate('home')} className="mt-3 text-sm text-gray-500">
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (state === 'confirm') {
    return (
      <div className="screen">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-[#faf8f4]">
          <button onClick={() => setState('scan')} className="w-10 h-10 flex items-center justify-center">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-800">決済の確認</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-4 py-4 space-y-4">
          {/* Product info */}
          <div className="card p-5 flex flex-col items-center text-center">
            <span className="text-6xl mb-3">{mockProduct.icon}</span>
            <h2 className="text-xl font-black text-gray-800">{mockProduct.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{mockProduct.description}</p>
          </div>

          {/* Seller */}
          <div className="card p-4 flex items-center gap-3">
            <span className="text-3xl">👩‍🌾</span>
            <div>
              <p className="text-xs text-gray-500">販売者</p>
              <p className="text-sm font-bold">{mockProduct.seller}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="card p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">支払い金額</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black text-token-600">{mockProduct.price}</span>
              <span className="text-xl font-bold text-token-500">TOKEN</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 space-y-3">
          <button onClick={handlePay} className="btn-token">
            {mockProduct.price} TOKEN で支払う
          </button>
          <button onClick={() => setState('scan')} className="w-full text-center text-sm text-gray-500">
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen bg-gray-900">
      {/* Mode toggle */}
      <div className="flex-shrink-0 pt-4 px-4 pb-3">
        <div className="flex gap-2 bg-gray-800 rounded-2xl p-1">
          <button
            onClick={() => setScanMode('pay')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${scanMode === 'pay' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
          >
            農産物を買う
          </button>
          <button
            onClick={() => setScanMode('complete')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${scanMode === 'complete' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
          >
            作業完了報告
          </button>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-64 h-64 relative mb-6">
          {/* QR frame corners */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full border border-white/20 rounded-xl" />
          </div>
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary-400 rounded-br-xl" />
          <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-primary-400/70 animate-pulse" />

          {/* Scan button in center */}
          <button
            onClick={handleScan}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <span className="text-2xl">📷</span>
            </div>
          </button>
        </div>

        <p className="text-white text-sm font-medium text-center">
          {scanMode === 'pay'
            ? '農産物についているQRコードを\nスキャンしてください'
            : '依頼者のスマホに表示されている\nQRコードをスキャンしてください'}
        </p>
        <button
          onClick={handleScan}
          className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full text-sm font-bold"
        >
          スキャン（モック）
        </button>
      </div>

      <div className="flex-shrink-0 pb-4 px-4">
        <p className="text-gray-500 text-xs text-center">
          {scanMode === 'pay' ? '農産物のQRタグをスキャンするとTOKENで支払いができます' : '作業完了を報告するとTOKENが受け取れます'}
        </p>
      </div>
    </div>
  )
}
