import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, X, QrCode, Wallet } from 'lucide-react'
import { useYuiBalance, useYuiTransfer } from '../web3/useYuiToken'
import QrCodeScanner from '../components/QrCodeScanner'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

const mockProduct = {
  name: 'ミニトマト（500g）',
  seller: '田中 よし子',
  price: 15,
  description: '無農薬・有機栽培。今朝収穫したばかりです。',
  icon: '🍅',
}

export default function QRScan({ navigate, goBack }) {
  const { address, isConnected } = useAccount()
  const { isAuthenticated } = useAuth()
  const { balance } = useYuiBalance(address)
  const { transfer, isPending, isConfirming, isSuccess, hash, error } = useYuiTransfer()

  const [mode, setMode] = useState('select') // 'select', 'show-qr', 'scan', 'manual', 'confirm', 'success'
  const [scanMode, setScanMode] = useState('pay')
  const [payAmount, setPayAmount] = useState('')
  const [scannedAddress, setScannedAddress] = useState('')
  const [scannedAmount, setScannedAmount] = useState('')
  const [manualInput, setManualInput] = useState(false)


  function handleManualConfirm() {
    if (isAddress(scannedAddress) && Number(scannedAmount) > 0) {
      setManualInput(false)
      setMode('confirm')
    }
  }

  function handlePay() {
    if (isConnected && isAddress(scannedAddress)) {
      transfer(scannedAddress, scannedAmount)
    } else {
      setMode('success')
    }
  }

  // M5-4: 送金成功時にバックエンドへ取引を記録
  useEffect(() => {
    if (isSuccess && hash && isAuthenticated && scannedAddress && scannedAmount) {
      const record = async () => {
        try {
          await api.transactions.record({
            to_address: scannedAddress,
            amount: scannedAmount,
            tx_hash: hash,
          })
        } catch {
          /* 失敗しても送金自体は完了しているので無視 */
        }
      }
      record()
    }
  }, [isSuccess, hash, isAuthenticated, scannedAddress, scannedAmount])

  if (isSuccess) {
    return (
      <div className="screen">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={48} className="text-primary-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">決済完了！</h2>
          <p className="text-sm text-gray-500 mb-1">{scannedAmount} YUI を送金しました</p>
          <div className="flex items-baseline gap-1 my-3">
            <span className="text-4xl font-black text-token-600">-{scannedAmount}</span>
            <span className="text-lg font-bold text-token-500">YUI</span>
          </div>
          {hash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 underline mb-4"
            >
              トランザクションを確認 →
            </a>
          )}
          <button onClick={() => navigate('home')} className="btn-primary mt-4">
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'confirm') {
    return (
      <div className="screen">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-[#faf8f4]">
          <button onClick={() => setMode('scan')} className="w-10 h-10 flex items-center justify-center">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-800">決済の確認</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-4 py-4 space-y-4">
          {!isConnected ? (
            <>
              <div className="card p-5 flex flex-col items-center text-center">
                <span className="text-6xl mb-3">{mockProduct.icon}</span>
                <h2 className="text-xl font-black text-gray-800">{mockProduct.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{mockProduct.description}</p>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <span className="text-3xl">👩‍🌾</span>
                <div>
                  <p className="text-xs text-gray-500">販売者</p>
                  <p className="text-sm font-bold">{mockProduct.seller}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">送金先</p>
              <p className="text-sm font-mono text-gray-700 break-all">{scannedAddress}</p>
            </div>
          )}

          <div className="card p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">支払い金額</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black text-token-600">{scannedAmount}</span>
              <span className="text-xl font-bold text-token-500">{isConnected ? 'YUI' : 'TOKEN'}</span>
            </div>
            {isConnected && (
              <p className="text-xs text-gray-400 mt-2">残高: {Number(balance).toFixed(1)} YUI</p>
            )}
          </div>

          {error && (
            <div className="card p-3 bg-red-50 border-red-200 space-y-2">
              <p className="text-xs text-red-600">{error.shortMessage || error.message}</p>
              {(/(insufficient|funds|gas|balance)/i.test(error.shortMessage || error.message)) && (
                <a
                  href="https://faucet.polygon.technology/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs font-bold text-primary-600 underline"
                >
                  POL（ガス代）が足りません → Faucet でチャージ
                </a>
              )}
            </div>
          )}
          {isConnected && (
            <div className="card p-3 bg-primary-50 border-primary-200">
              <p className="text-xs text-primary-800 font-medium mb-1">送金できない場合</p>
              <p className="text-xs text-primary-700 mb-2">
                送金には少量の POL（ネットワーク手数料）が必要です。YUI だけでは送金できません。
              </p>
              <a
                href="https://faucet.polygon.technology/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary-600 underline"
              >
                Faucet でテスト用 POL を無料取得 →
              </a>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 space-y-3">
          <button
            onClick={handlePay}
            disabled={isPending || isConfirming}
            className="btn-token"
          >
            {isPending ? '署名待ち...' : isConfirming ? 'ブロックチェーン処理中...' : `${scannedAmount} ${isConnected ? 'YUI' : 'TOKEN'} で支払う`}
          </button>
          <button onClick={() => setMode('scan')} className="w-full text-center text-sm text-gray-500">
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'show-qr') {
    const qrData = JSON.stringify({
      to: address,
      amount: payAmount || '0',
      token: 'YUI',
    })

    return (
      <div className="screen">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-[#faf8f4]">
          <button onClick={() => setMode('select')} className="w-10 h-10 flex items-center justify-center">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-800">受け取り用QR</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="card p-6 flex flex-col items-center">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
            <p className="text-xs text-gray-400 mt-4 font-mono break-all text-center">
              {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : ''}
            </p>
          </div>

          {!payAmount && (
            <div className="mt-6 w-full">
              <label className="text-sm font-bold text-gray-700 block mb-1">請求金額 (YUI)</label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="金額を入力（任意）"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          )}

          <p className="text-sm text-gray-500 text-center mt-4">
            このQRコードを相手にスキャンしてもらうと<br />YUI トークンを受け取れます
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'scan') {
    return (
      <div className="screen bg-gray-900">
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

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {manualInput ? (
            <div className="w-full max-w-xs space-y-4">
              <h3 className="text-white text-sm font-bold text-center mb-2">送金先を入力</h3>
              <input
                type="text"
                placeholder="0x... ウォレットアドレス"
                value={scannedAddress}
                onChange={e => setScannedAddress(e.target.value)}
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <input
                type="number"
                step="1"
                min="0"
                placeholder="金額 (YUI)"
                value={scannedAmount}
                onChange={e => setScannedAmount(e.target.value)}
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={handleManualConfirm}
                disabled={!isAddress(scannedAddress) || !scannedAmount}
                className="w-full bg-primary-500 text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-40"
              >
                確認画面へ
              </button>
              <button onClick={() => setManualInput(false)} className="w-full text-center text-sm text-gray-400">
                戻る
              </button>
            </div>
          ) : (
            <>
              <QrCodeScanner
                onScan={payload => {
                  setScannedAddress(payload.to)
                  setScannedAmount(payload.amount || '0')
                  setMode('confirm')
                }}
                onError={() => { }}
              />
              <p className="text-white text-sm font-medium text-center mt-4">
                {scanMode === 'pay'
                  ? '農産物のQRコードをスキャンするか、手動入力で送金'
                  : '依頼者のQRコードをスキャン'}
              </p>
              <button
                onClick={() => setManualInput(true)}
                className="mt-4 px-6 py-2 bg-gray-700 text-white rounded-full text-sm font-bold border border-gray-600"
              >
                手動入力で送金
              </button>
            </>
          )}
        </div>

        <div className="flex-shrink-0 pb-4 px-4">
          <button onClick={() => setMode('select')} className="w-full text-center text-sm text-gray-400 py-2">
            戻る
          </button>
        </div>
      </div>
    )
  }

  // mode === 'select'
  return (
    <div className="screen">
      <div className="flex-shrink-0 h-14 flex items-center justify-center bg-[#faf8f4]">
        <h1 className="text-base font-bold text-gray-800">QR 決済</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <button
          onClick={() => setMode('scan')}
          className="w-full card p-6 flex flex-col items-center gap-3 active:bg-gray-50 transition-colors"
        >
          <div className="w-16 h-16 bg-primary-100 rounded-3xl flex items-center justify-center">
            <QrCode size={32} className="text-primary-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-800">スキャンして支払う</p>
            <p className="text-xs text-gray-500 mt-1">相手のQRコードを読み取って送金</p>
          </div>
        </button>

        {isConnected && (
          <button
            onClick={() => navigate('token-transfer')}
            className="w-full card p-6 flex flex-col items-center gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="w-16 h-16 bg-token-100 rounded-3xl flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-800">手動入力で送金</p>
              <p className="text-xs text-gray-500 mt-1">アドレスと金額を入力して送金</p>
            </div>
          </button>
        )}

        {isConnected && (
          <button
            onClick={() => setMode('show-qr')}
            className="w-full card p-6 flex flex-col items-center gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="w-16 h-16 bg-token-100 rounded-3xl flex items-center justify-center">
              <Wallet size={32} className="text-token-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-800">QRコードで受け取る</p>
              <p className="text-xs text-gray-500 mt-1">自分のQRコードを表示して受け取り</p>
            </div>
          </button>
        )}

        {isConnected && (
          <div className="card p-3 bg-primary-50 border-primary-200 w-full text-center">
            <p className="text-xs text-primary-700">
              🔗 ウォレット接続中 — 実際のブロックチェーン上で送金されます
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
