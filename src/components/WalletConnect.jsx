import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, ExternalLink } from 'lucide-react'

export default function WalletConnect({ compact = false }) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`

    if (compact) {
      return (
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          {shortAddr}
        </button>
      )
    }

    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-medium text-green-700">接続済み</span>
          </div>
          <span className="text-xs text-gray-400">{chain?.name || 'Unknown'}</span>
        </div>
        <p className="text-sm font-mono text-gray-700 mb-3">{shortAddr}</p>
        <div className="flex gap-2">
          <a
            href={`https://amoy.polygonscan.com/address/${address}`}
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
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="w-full card p-4 flex items-center justify-center gap-3 bg-primary-500 text-white active:bg-primary-600 transition-colors"
    >
      <Wallet size={20} />
      <span className="font-bold text-sm">
        {isPending ? '接続中...' : 'ウォレットを接続'}
      </span>
    </button>
  )
}
