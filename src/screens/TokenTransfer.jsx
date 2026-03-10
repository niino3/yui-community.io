import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import Header from '../components/Header'
import { useYuiBalance, useYuiTransfer } from '../web3/useYuiToken'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function TokenTransfer({ goBack }) {
  const { address } = useAccount()
  const { isAuthenticated } = useAuth()
  const { balance } = useYuiBalance(address)
  const { transfer, isPending, isConfirming, isSuccess, hash, error } = useYuiTransfer()

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (isSuccess && hash && isAuthenticated && to && amount) {
      api.transactions
        .record({ to_address: to, amount, tx_hash: hash })
        .catch(() => {})
    }
  }, [isSuccess, hash, isAuthenticated, to, amount])

  const isValidAddress = to && isAddress(to)
  const isValidAmount = amount && Number(amount) > 0 && Number(amount) <= Number(balance)
  const canSend = isValidAddress && isValidAmount && !isPending && !isConfirming

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSend) return
    transfer(to, amount)
  }

  if (isSuccess) {
    return (
      <div className="screen">
        <Header title="送金完了" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">送金が完了しました</h2>
          <p className="text-sm text-gray-500 text-center mb-4">
            {amount} YUI を送金しました
          </p>
          <a
            href={`https://amoy.polygonscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 underline mb-6"
          >
            トランザクションを確認 →
          </a>
          <button
            onClick={goBack}
            className="w-full bg-primary-500 text-white py-3 rounded-2xl font-bold"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="YUI 送金" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-5 text-white shadow-lg mb-6">
          <p className="text-xs text-primary-200 font-medium mb-1">送金可能残高</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{Number(balance).toFixed(1)}</span>
            <span className="text-lg font-bold text-primary-200">YUI</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">送金先アドレス</label>
            <input
              type="text"
              placeholder="0x..."
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {to && !isValidAddress && (
              <p className="text-xs text-red-500 mt-1">有効なアドレスを入力してください</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">送金額 (YUI)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {amount && Number(amount) > Number(balance) && (
              <p className="text-xs text-red-500 mt-1">残高が不足しています</p>
            )}
          </div>

          {error && (
            <div className="flex flex-col gap-2 bg-red-50 border border-red-200 rounded-2xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error.shortMessage || error.message}</p>
              </div>
              {(/(insufficient|funds|gas|balance)/i.test(error.shortMessage || error.message)) && (
                <a
                  href="https://faucet.polygon.technology/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary-600 underline"
                >
                  POL（ガス代）が足りません → Faucet でチャージ
                </a>
              )}
            </div>
          )}
          <div className="rounded-2xl p-3 bg-primary-50 border border-primary-200">
            <p className="text-xs font-bold text-primary-800 mb-1">送金できない場合</p>
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

          <button
            type="submit"
            disabled={!canSend}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-colors ${
              canSend
                ? 'bg-primary-500 text-white active:bg-primary-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPending || isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isPending ? '署名待ち...' : 'ブロックチェーン処理中...'}
              </>
            ) : (
              <>
                <Send size={16} /> 送金する
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
