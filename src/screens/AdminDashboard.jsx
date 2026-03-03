import { TrendingUp, Users, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import { communityStats } from '../data/mockData'

export default function AdminDashboard({ goBack, navigate }) {
  return (
    <div className="screen">
      <Header title="コミュニティ統計" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-primary-600">{communityStats.totalMembers}</p>
            <p className="text-xs text-gray-500 mt-0.5">総メンバー</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{communityStats.activeThisMonth}</p>
            <p className="text-xs text-gray-500 mt-0.5">今月アクティブ</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-token-600">{communityStats.totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-0.5">総取引件数</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-purple-600">{communityStats.totalTokensCirculating}</p>
            <p className="text-xs text-gray-500 mt-0.5">流通TOKEN</p>
          </div>
        </div>

        {/* Earth care */}
        <div className="card p-4 bg-emerald-50 border border-emerald-100">
          <p className="text-sm font-bold text-emerald-700 mb-2">🌍 Earth Care 実績</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-emerald-600">{communityStats.co2Reduced}t</p>
              <p className="text-xs text-emerald-500">CO₂削減量（推定）</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-emerald-600">23</p>
              <p className="text-xs text-emerald-500">Earth Care 申請</p>
            </div>
          </div>
        </div>

        {/* Popular tasks */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">人気のタスク（今月）</p>
          <div className="space-y-2">
            {communityStats.topTasks.map((task, i) => (
              <div key={task} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-black text-primary-600">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700">{task}</span>
                <div className="h-2 bg-primary-200 rounded-full" style={{ width: `${80 - i * 20}px` }}>
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${90 - i * 15}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token flow */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">トークン流通（今月）</p>
          <div className="space-y-2">
            {[
              { label: '農作業報酬', amount: 1240, color: 'bg-green-400' },
              { label: 'Earth Care報酬', amount: 345, color: 'bg-emerald-400' },
              { label: '農産物決済', amount: 890, color: 'bg-yellow-400' },
              { label: '農機具レンタル', amount: 210, color: 'bg-amber-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-8 ${item.color} rounded-full flex-shrink-0`} />
                <span className="flex-1 text-xs text-gray-600">{item.label}</span>
                <span className="text-sm font-bold text-gray-700">{item.amount} TOKEN</span>
              </div>
            ))}
          </div>
        </div>

        {/* DAO proposals */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">DAO 提案・投票</p>
            <button className="text-xs text-primary-500 font-medium flex items-center gap-1">
              提案を作成 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { title: 'Earth Care換算レートの見直し', votes: 23, total: 47, status: '投票中', daysLeft: 3 },
              { title: 'オンボーディングボーナスを10→15TOKENに', votes: 38, total: 47, status: '可決', daysLeft: 0 },
            ].map(p => (
              <div key={p.title} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-700 flex-1">{p.title}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === '投票中' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(p.votes / p.total) * 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {p.votes}/{p.total}票 ({Math.round(p.votes / p.total * 100)}%)
                  {p.daysLeft > 0 && ` · 残り${p.daysLeft}日`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
