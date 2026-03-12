import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const CommunityContext = createContext(null)

/**
 * コミュニティコンテキスト
 *
 * 現在のコミュニティ情報を管理し、動的テーマを適用する
 * コミュニティの解決優先順位：
 * 1. 環境変数 VITE_COMMUNITY_SLUG
 * 2. サブドメイン (例: hokkaido.yui-community.io → hokkaido)
 * 3. クエリパラメータ ?community=hokkaido
 */
export function CommunityProvider({ children }) {
  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * コミュニティスラグを解決
   */
  const resolveSlug = useCallback(() => {
    // 1. 環境変数から取得（開発環境で固定値を使う場合）
    const envSlug = import.meta.env.VITE_COMMUNITY_SLUG
    if (envSlug) return envSlug

    // 2. サブドメインから取得
    const host = window.location.hostname
    const parts = host.split('.')

    // サブドメインがある場合（例: hokkaido.yui-community.io）
    // localhost や admin, www は除外
    if (parts.length >= 2) {
      const subdomain = parts[0]
      if (
        subdomain &&
        subdomain !== 'localhost' &&
        subdomain !== 'admin' &&
        subdomain !== 'www' &&
        subdomain !== '127'
      ) {
        return subdomain
      }
    }

    // 3. クエリパラメータから取得
    const params = new URLSearchParams(window.location.search)
    const querySlug = params.get('community')
    if (querySlug) return querySlug

    return null
  }, [])

  /**
   * コミュニティ情報を取得
   */
  const fetchCommunity = useCallback(async (slug) => {
    if (!slug) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // スラグをAPIクライアントに設定
      api.setCommunitySlug(slug)

      // コミュニティ情報を取得（/api/communities/current エンドポイントを想定）
      const data = await api.get('/communities/current')
      setCommunity(data)

      // 動的テーマを適用
      applyTheme(data)
    } catch (err) {
      console.error('Failed to fetch community:', err)
      setError(err?.body?.message || err?.message || 'コミュニティ情報の取得に失敗しました')
      setCommunity(null)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 動的テーマを適用（CSS変数を更新）
   */
  const applyTheme = useCallback((communityData) => {
    if (!communityData) return

    const root = document.documentElement

    // プライマリカラー
    if (communityData.color_primary) {
      root.style.setProperty('--color-primary', communityData.color_primary)
    }

    // セカンダリカラー
    if (communityData.color_secondary) {
      root.style.setProperty('--color-secondary', communityData.color_secondary)
    }

    // ロゴURL（必要に応じてファビコンも変更）
    if (communityData.logo_url) {
      const favicon = document.querySelector('link[rel="icon"]')
      if (favicon) {
        favicon.href = communityData.logo_url
      }
    }

    // ページタイトル
    if (communityData.name) {
      document.title = `${communityData.name} - Yui Community`
    }
  }, [])

  /**
   * コミュニティを再読み込み
   */
  const refreshCommunity = useCallback(async () => {
    const slug = resolveSlug()
    if (slug) {
      await fetchCommunity(slug)
    }
  }, [resolveSlug, fetchCommunity])

  /**
   * 初期化：スラグを解決してコミュニティ情報を取得
   */
  useEffect(() => {
    const slug = resolveSlug()
    fetchCommunity(slug)
  }, [resolveSlug, fetchCommunity])

  return (
    <CommunityContext.Provider
      value={{
        community,
        loading,
        error,
        refreshCommunity,
        slug: resolveSlug(),
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export function useCommunity() {
  const ctx = useContext(CommunityContext)
  if (!ctx) {
    throw new Error('useCommunity must be used within CommunityProvider')
  }
  return ctx
}
