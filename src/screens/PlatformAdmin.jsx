import { useState } from 'react'
import { Plus, Settings, Users, TrendingUp, Trash2, Edit, Eye, ToggleLeft, ToggleRight, Wrench } from 'lucide-react'
import { usePlatformCommunities, usePlatformStats, useDeleteCommunity, useUpdateCommunity } from '../hooks/usePlatform'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import CreateCommunity from './CreateCommunity'

export default function PlatformAdmin() {
  const [view, setView] = useState('dashboard')
  const [editingId, setEditingId] = useState(null)

  const { data: commData, isLoading, error, refetch } = usePlatformCommunities()
  const { data: statsData } = usePlatformStats()
  const deleteMutation = useDeleteCommunity()
  const updateMutation = useUpdateCommunity()

  const communities = commData?.data ?? commData ?? []
  const stats = statsData?.data ?? statsData ?? {}

  if (view === 'create') {
    return (
      <CreateCommunity
        onBack={() => setView('dashboard')}
        onCreated={() => { refetch(); setView('dashboard') }}
      />
    )
  }

  if (view === 'edit' && editingId) {
    const editTarget = communities.find(c => c.id === editingId)
    if (editTarget) {
      return (
        <CreateCommunity
          editData={editTarget}
          onBack={() => { setEditingId(null); setView('dashboard') }}
          onCreated={() => { refetch(); setEditingId(null); setView('dashboard') }}
        />
      )
    }
  }

  async function handleToggleActive(community) {
    try {
      await updateMutation.mutateAsync({
        id: community.id,
        data: { is_active: !community.is_active },
      })
    } catch { /* handled by mutation */ }
  }

  async function handleDelete(id) {
    if (!confirm('このコミュニティを無効化しますか？')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch { /* handled by mutation */ }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Yui Platform 管理</h1>
            <p className="text-xs text-gray-500">全コミュニティを管理</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> コミュニティを作成
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '総コミュニティ', value: stats.total_communities ?? communities.length, icon: <Settings size={20} />, color: 'bg-blue-100 text-blue-600' },
            { label: '総メンバー', value: stats.total_members ?? '-', icon: <Users size={20} />, color: 'bg-green-100 text-green-600' },
            { label: '総取引数', value: stats.total_transactions ?? '-', icon: <TrendingUp size={20} />, color: 'bg-purple-100 text-purple-600' },
            { label: '流通トークン', value: stats.total_tokens ?? '-', icon: <TrendingUp size={20} />, color: 'bg-yellow-100 text-yellow-600' },
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

        {/* Community list */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">コミュニティ一覧</h2>
          {isLoading ? (
            <SkeletonList count={3} lines={2} />
          ) : error ? (
            <ErrorMessage onRetry={refetch} />
          ) : communities.length === 0 ? (
            <EmptyState icon="🏘️" message="コミュニティがまだありません" sub="「コミュニティを作成」から始めましょう" />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {communities.map(c => (
                <div key={c.id} className="p-5 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: c.color_primary || '#3d7a55' }}
                  >
                    {c.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800 truncate">{c.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                      }`}>
                        {c.is_active !== false ? '有効' : '無効'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      @{c.slug} | {c.token_symbol || 'TOKEN'} | {c.members_count ?? 0}名
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        const url = import.meta.env.PROD
                          ? `https://${c.slug}.yui-community.io`
                          : `/?community=${c.slug}`
                        window.open(url, '_blank')
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="開く"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        const url = import.meta.env.PROD
                          ? `https://${c.slug}.yui-community.io?admin=true`
                          : `/?community=${c.slug}&admin=true`
                        window.open(url, '_blank')
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="コミュニティ管理"
                    >
                      <Wrench size={16} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => { setEditingId(c.id); setView('edit') }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(c)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={c.is_active !== false ? '無効化' : '有効化'}
                    >
                      {c.is_active !== false
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
