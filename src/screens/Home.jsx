import { Bell, Plus, Search, Tractor, Leaf, ChevronRight, ArrowUpRight, ArrowDownLeft, Send } from 'lucide-react'
import { useAccount } from 'wagmi'
import { currentUser, notifications, transactions, myActiveTasks } from '../data/mockData'
import { useYuiBalance } from '../web3/useYuiToken'
import { useMembershipStatus } from '../web3/useMembershipSBT'
import WalletConnect from '../components/WalletConnect'

export default function Home({ navigate }) {
  const { address, isConnected } = useAccount()
  const { balance, isLoading: balanceLoading } = useYuiBalance(address)
  const { isMember } = useMembershipStatus(address)
  const unreadCount = notifications.filter(n => !n.read).length

  const displayBalance = isConnected ? Number(balance).toFixed(1) : currentUser.tokens

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#faf8f4] px-5 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">おはようございます</p>
            <h1 className="text-xl font-black text-gray-800">{currentUser.name} さん 🌾</h1>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && <WalletConnect compact />}
            <button
              onClick={() => navigate('home')}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Wallet connection */}
        {!isConnected && (
          <div className="mx-4 mb-3">
            <WalletConnect />
          </div>
        )}

        {/* Token balance card */}
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-primary-200 font-medium">残高</p>
              {isConnected && (
                <span className="text-[10px] bg-primary-400/40 text-primary-100 px-2 py-0.5 rounded-full">
                  🔗 オンチェーン
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              {balanceLoading ? (
                <div className="w-24 h-12 bg-primary-400/30 rounded-xl animate-pulse" />
              ) : (
                <span className="text-5xl font-black">{displayBalance}</span>
              )}
              <span className="text-lg font-bold text-primary-200">{isConnected ? 'YUI' : 'TOKEN'}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-primary-200">信頼スコア</span>
                <span className="text-sm font-bold">⭐ {currentUser.trustScore}</span>
              </div>
              <div className="w-px h-4 bg-primary-400" />
              {isConnected && isMember ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-primary-200">メンバー</span>
                  <span className="text-sm font-bold">✓ SBT</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-primary-200">取引回数</span>
                  <span className="text-sm font-bold">{currentUser.transactionCount}回</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send token button */}
        {isConnected && (
          <div className="mx-4 mb-4">
            <button
              onClick={() => navigate('token-transfer')}
              className="w-full card p-3 flex items-center justify-center gap-2 bg-token-50 border-token-200 active:bg-token-100"
            >
              <Send size={16} className="text-token-600" />
              <span className="text-sm font-bold text-token-700">YUI を送金する</span>
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('task-post')}
              className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-token-100 rounded-2xl flex items-center justify-center">
                <Plus size={20} className="text-token-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">農作業を</p>
                <p className="text-sm font-bold text-gray-800">お手伝いを頼む</p>
              </div>
            </button>

            <button
              onClick={() => navigate('tasks')}
              className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center">
                <Search size={20} className="text-primary-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">農作業を</p>
                <p className="text-sm font-bold text-gray-800">仕事を探す</p>
              </div>
            </button>

            <button
              onClick={() => navigate('qr')}
              className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">農産物</p>
                <p className="text-sm font-bold text-gray-800">QR決済</p>
              </div>
            </button>

            <button
              onClick={() => navigate('earth-care')}
              className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Leaf size={20} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">環境貢献</p>
                <p className="text-sm font-bold text-gray-800">Earth Care</p>
              </div>
            </button>
          </div>
        </div>

        {/* Active task */}
        {myActiveTasks.length > 0 && (
          <div className="px-4 mb-4">
            <h2 className="text-sm font-bold text-gray-700 mb-2">進行中のタスク</h2>
            {myActiveTasks.map(task => (
              <button
                key={task.id}
                onClick={() => navigate('work-complete', { task })}
                className="card w-full p-4 bg-primary-50 border border-primary-200 active:bg-primary-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs text-primary-600 font-medium mb-0.5">マッチング済み</p>
                    <p className="text-sm font-bold text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.dateLabel}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-black text-token-600">+{task.reward}</span>
                    <span className="text-xs text-token-500">TOKEN</span>
                    <ChevronRight size={16} className="text-primary-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Notifications */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-700">お知らせ</h2>
            <button className="text-xs text-primary-500 font-medium">すべて見る</button>
          </div>
          <div className="card divide-y divide-gray-50">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className={`p-3 flex items-start gap-3 ${!n.read ? 'bg-primary-50' : ''}`}>
                <span className="text-lg flex-shrink-0">
                  {n.type === 'match' ? '🤝' : n.type === 'token' ? '💰' : n.type === 'review' ? '⭐' : '🌱'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{n.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-700">取引履歴</h2>
            <button className="text-xs text-primary-500 font-medium">すべて見る</button>
          </div>
          <div className="card divide-y divide-gray-50">
            {transactions.slice(0, 4).map(tx => (
              <div key={tx.id} className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tx.type === 'earn'
                    ? <ArrowDownLeft size={16} className="text-green-600" />
                    : <ArrowUpRight size={16} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{tx.label}</p>
                  <p className="text-[10px] text-gray-400">{tx.date}</p>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
