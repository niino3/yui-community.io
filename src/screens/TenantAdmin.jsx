import { useState } from 'react'
import {
  Users, Settings, TrendingUp, Shield, ChevronLeft, UserPlus, Search,
  ClipboardList, CheckCircle, Clock, Wrench, Leaf, Eye, Plus, ExternalLink,
} from 'lucide-react'
import { useCommunity } from '../context/CommunityContext'
import { useAuth } from '../context/AuthContext'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import { api } from '../api/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTasks } from '../hooks/useTasks'
import { useEquipmentList } from '../hooks/useEquipment'
import { useEarthCareList } from '../hooks/useEarthCare'

function useCommunityMembers() {
  const { community } = useCommunity()
  return useQuery({
    queryKey: ['community-members', community?.id],
    queryFn: () => api.get(`/communities/${community.id}/members`),
    enabled: !!community?.id,
  })
}

function useCommunityStats() {
  const { community } = useCommunity()
  return useQuery({
    queryKey: ['community-stats', community?.id],
    queryFn: () => api.get(`/communities/${community.id}/stats`),
    enabled: !!community?.id,
  })
}

function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ communityId, userId, role }) =>
      api.patch(`/communities/${communityId}/members/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-members'] }),
  })
}

const TABS = [
  { key: 'overview', label: 'ダッシュボード', icon: TrendingUp },
  { key: 'tasks', label: 'タスク管理', icon: ClipboardList },
  { key: 'equipment', label: '農機具管理', icon: Wrench },
  { key: 'earthcare', label: 'Earth Care', icon: Leaf },
  { key: 'members', label: 'メンバー', icon: Users },
  { key: 'settings', label: '設定', icon: Settings },
]

export default function TenantAdmin({ goBack }) {
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')

  const { community } = useCommunity()
  const { user } = useAuth()
  const { data: membersData, isLoading: membersLoading } = useCommunityMembers()
  const { data: statsData } = useCommunityStats()
  const updateRole = useUpdateMemberRole()

  const members = membersData?.data ?? membersData ?? []
  const stats = statsData?.data ?? statsData ?? {}
  const communityName = community?.name || 'コミュニティ'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {goBack && (
              <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: community?.color_primary || '#3d7a55' }}
            >
              {communityName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{communityName} 管理</h1>
              <p className="text-xs text-gray-500">@{community?.slug} | コミュニティ管理画面</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const url = import.meta.env.PROD
                  ? `https://${community?.slug}.yui-community.io`
                  : `/?community=${community?.slug}`
                window.open(url, '_blank')
              }}
              className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} /> コミュニティを開く
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.key
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && <OverviewTab stats={stats} members={members} community={community} />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'equipment' && <EquipmentTab />}
        {tab === 'earthcare' && <EarthCareTab />}
        {tab === 'members' && (
          <MembersTab
            members={members}
            loading={membersLoading}
            search={search}
            setSearch={setSearch}
            community={community}
            updateRole={updateRole}
          />
        )}
        {tab === 'settings' && <SettingsTab community={community} />}
      </main>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ stats, members, community }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'メンバー数', value: stats.members_count ?? members.length, icon: <Users size={20} />, color: 'bg-green-100 text-green-600' },
          { label: '今月の取引', value: stats.transactions_this_month ?? '-', icon: <TrendingUp size={20} />, color: 'bg-blue-100 text-blue-600' },
          { label: '流通トークン', value: stats.tokens_circulating ?? '-', icon: <TrendingUp size={20} />, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Earth Care', value: stats.earth_care_count ?? '-', icon: <Leaf size={20} />, color: 'bg-emerald-100 text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">最近の活動</h3>
          <EmptyState icon="📊" message="統計データを収集中..." sub="メンバーが活動を始めると表示されます" />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">トークン流通</h3>
          <div className="space-y-3">
            {[
              { label: '農作業報酬', pct: 45, color: 'bg-green-400' },
              { label: 'Earth Care 報酬', pct: 25, color: 'bg-emerald-400' },
              { label: '農産物決済', pct: 20, color: 'bg-yellow-400' },
              { label: '農機具レンタル', pct: 10, color: 'bg-amber-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28 flex-shrink-0">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Tasks Tab ─── */
function TasksTab() {
  const { isAuthenticated } = useAuth()
  const { data: tasksData, isLoading, error, refetch } = useTasks(
    isAuthenticated ? {} : { _skip: true }
  )

  const tasks = tasksData?.data ?? tasksData ?? []

  const STATUS_LABELS = { open: '募集中', matched: '作業中', completed: '完了', approved: '承認済み' }
  const STATUS_COLORS = {
    open: 'bg-blue-100 text-blue-600',
    matched: 'bg-yellow-100 text-yellow-600',
    completed: 'bg-green-100 text-green-600',
    approved: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">タスク一覧</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{tasks.length} 件</span>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={5} lines={2} />
      ) : error ? (
        <ErrorMessage onRetry={refetch} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="📋" message="タスクがありません" sub="メンバーがタスクを投稿すると表示されます" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {tasks.map(t => (
            <div key={t.id} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {t.status === 'completed' || t.status === 'approved'
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <Clock size={20} className="text-primary-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate">{t.title}</h3>
                <p className="text-xs text-gray-500 truncate">
                  報酬: {t.reward_amount ?? t.tokens} {t.reward_unit ?? 'TOKEN'}
                  {t.creator && ` | 投稿者: ${t.creator.display_name || t.creator.wallet_address?.slice(0, 8)}`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>
                {STATUS_LABELS[t.status] || t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Equipment Tab ─── */
function EquipmentTab() {
  const { isAuthenticated } = useAuth()
  const { data: eqData, isLoading, error, refetch } = useEquipmentList(
    isAuthenticated ? {} : { _skip: true }
  )

  const equipment = eqData?.data ?? eqData ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">農機具一覧</h2>
        <button className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
          <Plus size={16} /> 農機具を登録
        </button>
      </div>

      {isLoading ? (
        <SkeletonList count={4} lines={2} />
      ) : error ? (
        <ErrorMessage onRetry={refetch} />
      ) : equipment.length === 0 ? (
        <EmptyState icon="🔧" message="農機具が登録されていません" sub="「農機具を登録」から始めましょう" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map(eq => (
            <div key={eq.id} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {eq.icon || '🔧'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{eq.name}</h3>
                  <p className="text-xs text-gray-500">{eq.location || '場所未設定'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  eq.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {eq.status === 'available' ? '利用可能' : '使用中'}
                </span>
                <span className="text-xs text-gray-400">
                  {eq.daily_rate ?? eq.dailyRate ?? '-'} TOKEN/日
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Earth Care Tab ─── */
function EarthCareTab() {
  const { isAuthenticated } = useAuth()
  const { data: ecData, isLoading, error, refetch } = useEarthCareList(
    isAuthenticated ? {} : { _skip: true }
  )

  const activities = ecData?.data ?? ecData ?? []

  const STATUS_LABELS = { pending: '審査中', approved: '承認済み', rejected: '却下' }
  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Earth Care 活動一覧</h2>
        <span className="text-sm text-gray-500">{activities.length} 件</span>
      </div>

      {isLoading ? (
        <SkeletonList count={4} lines={2} />
      ) : error ? (
        <ErrorMessage onRetry={refetch} />
      ) : activities.length === 0 ? (
        <EmptyState icon="🌱" message="Earth Care 活動がありません" sub="メンバーが活動を記録すると表示されます" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {activities.map(a => (
            <div key={a.id} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                🌱
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate">{a.activity_type || a.title || a.type}</h3>
                <p className="text-xs text-gray-500">
                  {a.description?.slice(0, 50) || ''}
                  {a.reporter && ` | ${a.reporter.display_name || a.reporter.wallet_address?.slice(0, 8)}`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[a.status] || STATUS_COLORS.pending}`}>
                {STATUS_LABELS[a.status] || a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Members Tab ─── */
function MembersTab({ members, loading, search, setSearch, community, updateRole }) {
  const ROLE_LABELS = { admin: '管理者', operator: '運営者', member: 'メンバー' }
  const ROLE_COLORS = {
    admin: 'bg-red-100 text-red-600',
    operator: 'bg-blue-100 text-blue-600',
    member: 'bg-gray-100 text-gray-600',
  }

  const filteredMembers = members.filter(m =>
    !search || (m.display_name || m.wallet_address || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange(memberId, newRole) {
    if (!community?.id) return
    try {
      await updateRole.mutateAsync({ communityId: community.id, userId: memberId, role: newRole })
    } catch { /* handled by mutation */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">メンバー一覧</h2>
        <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
          <UserPlus size={16} /> メンバーを招待
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前やウォレットアドレスで検索..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {loading ? (
        <SkeletonList count={5} lines={2} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState icon="👥" message={search ? '該当するメンバーがいません' : 'メンバーがいません'} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {filteredMembers.map(m => (
            <div key={m.id} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{m.display_name || m.wallet_address?.slice(0, 12) + '...'}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{m.wallet_address}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] || ROLE_COLORS.member}`}>
                  {ROLE_LABELS[m.role] || 'メンバー'}
                </span>
                <select
                  value={m.role || 'member'}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="member">メンバー</option>
                  <option value="operator">運営者</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Settings Tab ─── */
function SettingsTab({ community }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Shield size={18} className="text-primary-500" /> コミュニティ設定
        </h3>
        <div className="space-y-4">
          <SettingsField label="コミュニティ名" value={community?.name} />
          <SettingsField label="スラグ" value={community?.slug} mono />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メインカラー</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: community?.color_primary || '#3d7a55' }} />
                <span className="text-sm font-mono text-gray-500">{community?.color_primary || '#3d7a55'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">サブカラー</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: community?.color_secondary || '#6b9080' }} />
                <span className="text-sm font-mono text-gray-500">{community?.color_secondary || '#6b9080'}</span>
              </div>
            </div>
          </div>
          <SettingsField label="トークン" value={`${community?.token_name || '-'} (${community?.token_symbol || '-'})`} />
          <SettingsField label="最大メンバー数" value={community?.max_members || 100} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
        <h3 className="font-bold text-gray-800">コントラクト情報</h3>
        <div className="space-y-2">
          {[
            ['トークンアドレス', community?.contract_address],
            ['SBT アドレス', community?.sbt_contract_address],
            ['チェーン', 'Polygon Amoy (80002)'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-mono text-gray-700 truncate max-w-[300px]">{val || '未設定'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsField({ label, value, mono }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        defaultValue={value ?? ''}
        className={`w-full py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none ${mono ? 'font-mono' : ''}`}
        readOnly
      />
    </div>
  )
}
