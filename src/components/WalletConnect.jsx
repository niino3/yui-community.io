import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { Wallet, LogOut, ExternalLink, AlertTriangle } from 'lucide-react'
import { EXPLORER_URL, CHAIN_ID } from '../contracts/addresses'

const targetChain = CHAIN_ID === 137 ? polygon : polygonAmoy

const FAUCET_URL = 'https://faucet.polygon.technology/'

export default function WalletConnect({ compact = false }) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [showNoWallet, setShowNoWallet] = useState(false)

  const isWrongNetwork = isConnected && chain?.id !== targetChain.id

  function handleConnect() {
    if (!window.ethereum) {
      setShowNoWallet(true)
      return
    }
    setShowNoWallet(false)
    connect({ connector: connectors[0] })
  }

  if (isConnected) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`

    if (compact) {
      return (
        <button
          onClick={() => isWrongNetwork ? switchChain({ chainId: targetChain.id }) : disconnect()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isWrongNetwork ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isWrongNetwork ? 'bg-yellow-500' : 'bg-green-500'}`} />
          {isWrongNetwork ? 'ネットワーク切替' : shortAddr}
        </button>
      )
    }

    return (
      <div className="card p-4 space-y-3">
        {isWrongNetwork && (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-yellow-800">ネットワークが違います</p>
              <p className="text-xs text-yellow-700 mt-0.5">{targetChain.name} に切り替えてください</p>
              <button
                onClick={() => switchChain({ chainId: targetChain.id })}
                className="mt-2 text-xs font-bold text-white bg-yellow-600 rounded-lg px-3 py-1.5"
              >
                {targetChain.name} に切り替え
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isWrongNetwork ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className={`text-xs font-medium ${isWrongNetwork ? 'text-yellow-700' : 'text-green-700'}`}>
              {isWrongNetwork ? `${chain?.name || 'Unknown'}（要切替）` : '接続済み'}
            </span>
          </div>
          <span className="text-xs text-gray-400">{chain?.name || 'Unknown'}</span>
        </div>
        <p className="text-sm font-mono text-gray-700">{shortAddr}</p>
        {!isWrongNetwork && (
          <div className="text-xs text-gray-400">
            <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">
              テスト用 POL を取得（Faucet）
            </a>
          </div>
        )}
        <div className="flex gap-2">
          <a
            href={`${EXPLORER_URL}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-xs text-primary-600 bg-primary-50 rounded-xl py-2"
          >
            <ExternalLink size={12} /> Polygonscan
          </a>
          <button
            onClick={() => disconnect()}
            className="flex items-center justify-center gap-1 text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2"
          >
            <LogOut size={12} /> 切断
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="w-full card p-4 flex items-center justify-center gap-3 bg-primary-500 text-white active:bg-primary-600 transition-colors"
      >
        <Wallet size={20} />
        <span className="font-bold text-sm">
          {isPending ? '接続中...' : 'ウォレットを接続'}
        </span>
      </button>
      {showNoWallet && (
        <div className="card p-3 bg-yellow-50 border-yellow-200 space-y-2">
          <p className="text-xs text-yellow-800 font-bold">MetaMask が見つかりません</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-600 font-bold"
          >
            MetaMask をインストール <ExternalLink size={10} />
          </a>
        </div>
      )}
      {connectError && (
        <p className="text-xs text-red-500 text-center">{connectError.shortMessage || connectError.message}</p>
      )}
    </div>
  )
}
