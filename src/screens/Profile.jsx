import { Settings, ChevronRight, Leaf } from 'lucide-react'
import { useAccount } from 'wagmi'
import Header from '../components/Header'
import WalletConnect from '../components/WalletConnect'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { currentUser, transactions as mockTransactions } from '../data/mockData'
import { useYuiBalance } from '../web3/useYuiToken'
import { useMembershipStatus } from '../web3/useMembershipSBT'
import { SkeletonCard } from '../components/Skeleton'

export default function Profile({ navigate }) {
  const { address, isConnected } = useAccount()
  const { isAuthenticated, user } = useAuth()
  const { balance } = useYuiBalance(address)
  const { isMember } = useMembershipStatus(address)
  const { data: txData, isLoading: txLoading } = useTransactions(
    isAuthenticated ? {} : { _skip: true }
  )

  const transactions = txData?.data ?? mockTransactions
  const displayBalance = isConnected ? Number(balance).toFixed(1) : currentUser.tokens
  const displayName = user?.display_name || currentUser.name
  const area = user?.area || currentUser.area
  const joinedAt = user?.created_at?.slice(0, 10) || currentUser.joinedAt
  const trustScore = user?.trust_score ?? currentUser.trustScore
  const txCount = user?.transaction_count ?? currentUser.transactionCount
  const sbts = currentUser.sbts

  return (
    <div className="screen">
      <Header
        title="マイページ"
        rightElement={
          <button className="w-10 h-10 flex items-center justify-center">
            <Settings size={20} className="text-gray-600" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Profile hero */}
        <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-5 pt-4 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md">
              👨‍🌾
            </div>
            <div className="text-white">
              <h2 className="text-xl font-black">{displayName}</h2>
              <p className="text-primary-200 text-sm">{area}</p>
              <p className="text-primary-200 text-xs">加入: {joinedAt}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-primary-400/40 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{displayBalance}</p>
              <p className="text-[10px] text-primary-200">{isConnected ? 'YUI残高' : 'TOKEN残高'}</p>
            </div>
            <div className="bg-primary-400/40 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">⭐{trustScore}</p>
              <p className="text-[10px] text-primary-200">信頼スコア</p>
            </div>
            <div className="bg-primary-400/40 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{isConnected && isMember ? '✓' : txCount}</p>
              <p className="text-[10px] text-primary-200">{isConnected && isMember ? 'メンバーSBT' : '取引回数'}</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-3 pb-6">
          {/* Wallet */}
          <WalletConnect />

          {/* SBT badges */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">保有バッジ（SBT）</p>
              <span className="text-xs text-gray-400">{sbts.length}枚</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sbts.map(sbt => (
                <div key={sbt.id} className={`rounded-2xl p-3 ${sbt.color} flex items-center gap-2`}>
                  <span className="text-2xl">{sbt.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{sbt.label}</p>
                    {sbt.count !== undefined && (
                      <p className="text-[10px] opacity-70">{sbt.count}回達成</p>
                    )}
                    {sbt.date && (
                      <p className="text-[10px] opacity-70">{sbt.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              🔒 SBTは譲渡・売買できません
            </p>
          </div>

          {/* Earth Care button */}
          <button
            onClick={() => navigate('earth-care')}
            className="card w-full p-4 flex items-center gap-3 active:bg-gray-50 bg-emerald-50 border-emerald-200"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Leaf size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800">Earth Care 活動を記録</p>
              <p className="text-xs text-gray-500">植樹・堆肥・水路清掃でTOKEN獲得</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* Admin dashboard */}
          <button
            onClick={() => navigate('admin')}
            className="card w-full p-4 flex items-center gap-3 active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800">コミュニティ統計</p>
              <p className="text-xs text-gray-500">活動サマリー・管理ダッシュボード</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* Transaction history */}
          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">取引履歴</p>
            {txLoading ? (
              <SkeletonCard lines={4} />
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => {
                  const isEarn = tx.type === 'earn' || Number(tx.amount) > 0
                  return (
                    <div key={tx.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${isEarn ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isEarn ? '📥' : '📤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{tx.label ?? tx.description}</p>
                        <p className="text-[10px] text-gray-400">{tx.date ?? tx.created_at}</p>
                      </div>
                      <span className={`text-sm font-bold ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
                        {Number(tx.amount) > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Settings menu */}
          <div className="card divide-y divide-gray-50">
            {[
              { label: 'プロフィール編集', icon: '✏️' },
              { label: '通知設定', icon: '🔔' },
              { label: 'プライバシー設定', icon: '🔒' },
              { label: 'ヘルプ・サポート', icon: '💬' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 p-4 active:bg-gray-50">
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-sm text-gray-700 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
