import { useQuery } from '@tanstack/react-query'
import { useCommunity } from '../context/CommunityContext'
import { api } from '../api/client'
import { CONTRACTS, CHAIN_ID, EXPLORER_URL } from '../contracts/addresses'

/**
 * マルチテナント対応のコントラクトアドレス動的解決フック
 *
 * コミュニティが選択されている場合: API からコントラクトアドレスを取得
 * 選択されていない場合: デフォルトのアドレス（addresses.js）を使用
 */
export function useContracts() {
  const { community } = useCommunity()

  const { data: registry } = useQuery({
    queryKey: ['contract-registry', community?.id],
    queryFn: () => api.get(`/communities/${community.id}/contracts`),
    enabled: !!community?.id,
    staleTime: 5 * 60 * 1000,
  })

  if (registry?.data) {
    const tokenEntry = registry.data.find(r => r.contract_type === 'token')
    const sbtEntry = registry.data.find(r => r.contract_type === 'sbt')
    return {
      tokenAddress: tokenEntry?.contract_address || CONTRACTS.YuiToken,
      sbtAddress: sbtEntry?.contract_address || CONTRACTS.MembershipSBT,
      chainId: CHAIN_ID,
      explorerUrl: EXPLORER_URL,
      isLoading: false,
    }
  }

  return {
    tokenAddress: community?.token_address || CONTRACTS.YuiToken,
    sbtAddress: community?.sbt_address || CONTRACTS.MembershipSBT,
    chainId: CHAIN_ID,
    explorerUrl: EXPLORER_URL,
    isLoading: false,
  }
}
