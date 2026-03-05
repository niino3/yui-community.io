import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { api, setAuthToken, clearAuth, setStoredUser, getStoredUser, isAuthenticated } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loginWithWallet = useCallback(async () => {
    if (!address || !walletClient) return
    setLoading(true)
    setError(null)
    try {
      const { nonce, message } = await api.auth.nonce(address)
      const signature = await walletClient.signMessage({ message })
      const { token, user: u } = await api.auth.wallet(address, message, signature)
      setAuthToken(token)
      setStoredUser(u)
      setUser(u)
    } catch (e) {
      setError(e?.body?.message || e?.message || 'ログインに失敗しました')
      throw e
    } finally {
      setLoading(false)
    }
  }, [address, walletClient])

  const logout = useCallback(async () => {
    try {
      if (isAuthenticated()) await api.auth.logout()
    } catch {
      /* ignore */
    }
    clearAuth()
    setUser(null)
  }, [])

  useEffect(() => {
    if (!isConnected || !address) {
      clearAuth()
      setUser(null)
      return
    }
    if (!walletClient) return
    if (user?.wallet_address?.toLowerCase() === address?.toLowerCase()) return
    loginWithWallet().catch(() => {})
  }, [isConnected, address, walletClient, loginWithWallet])

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithWallet, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
