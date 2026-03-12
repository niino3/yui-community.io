import { useEffect, useState } from 'react'
import { api } from '../api/client'
import CreateCommunity from './CreateCommunity'
import PlatformAdmin from './PlatformAdmin'

/**
 * ランディングページ - yui-community.io
 * 全コミュニティのカード一覧を表示
 */
export default function LandingPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('landing')

  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.communities.list()
      setCommunities(data)
    } catch (err) {
      console.error('Failed to load communities:', err)
      setError(err?.body?.message || err?.message || 'コミュニティの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCommunityClick = (community) => {
    // サブドメインまたはクエリパラメータでコミュニティにアクセス
    // 本番環境ではサブドメインにリダイレクト、開発環境ではクエリパラメータを使用
    if (import.meta.env.PROD) {
      // 本番: サブドメインにリダイレクト
      const currentDomain = window.location.hostname.split('.').slice(-2).join('.') // yui-community.io
      window.location.href = `https://${community.slug}.${currentDomain}`
    } else {
      // 開発: クエリパラメータで遷移
      window.location.href = `/?community=${community.slug}`
    }
  }

  if (view === 'create') {
    return (
      <CreateCommunity
        onBack={() => { setView('landing'); loadCommunities() }}
        onCreated={() => loadCommunities()}
      />
    )
  }

  if (view === 'admin') {
    return <PlatformAdmin />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadCommunities} className="btn-primary">
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-700">Yui Community</h1>
              <p className="text-sm text-gray-600 mt-1">地域通貨で繋がるコミュニティプラットフォーム</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('create')}
                className="px-5 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                + コミュニティを作成
              </button>
              <button
                onClick={() => setView('admin')}
                className="px-5 py-2 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors"
              >
                管理画面
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* イントロセクション */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            あなたのコミュニティを見つけよう
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            地域通貨とSoulbound Tokenで、信頼と循環を育むコミュニティ。
            <br />
            環境活動や相互扶助を通じて、持続可能な未来を共創します。
          </p>
        </section>

        {/* コミュニティカード一覧 */}
        {communities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              まだコミュニティがありません
            </h3>
            <p className="text-gray-500">
              最初のコミュニティを作成してみましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onClick={() => handleCommunityClick(community)}
              />
            ))}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 Yui Community Platform. All rights reserved.</p>
            <p className="mt-2">
              持続可能な地域コミュニティのためのWeb3プラットフォーム
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * コミュニティカード
 */
function CommunityCard({ community, onClick }) {
  const primaryColor = community.color_primary || '#3d7a55'
  const secondaryColor = community.color_secondary || '#6b9080'

  return (
    <div
      onClick={onClick}
      className="card overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
    >
      {/* カードヘッダー（グラデーション背景） */}
      <div
        className="h-32 relative"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {community.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={community.logo_url}
              alt={community.name}
              className="w-20 h-20 object-contain bg-white/90 rounded-2xl p-3 shadow-lg"
            />
          </div>
        )}
      </div>

      {/* カードボディ */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">
          {community.name}
        </h3>

        <div className="space-y-3 mb-4">
          {/* トークン情報 */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" />
            </svg>
            <span className="font-medium">{community.token_name || community.token_symbol}</span>
            <span className="ml-1">({community.token_symbol})</span>
          </div>

          {/* メンバー数 */}
          {community.members_count !== undefined && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>{community.members_count} メンバー</span>
            </div>
          )}

          {/* トークンレート説明 */}
          {community.token_rate_description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {community.token_rate_description}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-mono">@{community.slug}</span>
          <span className="text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
            参加する →
          </span>
        </div>
      </div>
    </div>
  )
}
