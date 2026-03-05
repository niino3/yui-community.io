import { useReadContract } from 'wagmi'
import { MembershipSBTABI } from '../contracts/abis'
import { CONTRACTS } from '../contracts/addresses'

const contractConfig = {
  address: CONTRACTS.MembershipSBT,
  abi: MembershipSBTABI,
}

export function useMembershipStatus(address) {
  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  return {
    isMember: data ? Number(data) > 0 : false,
    sbtCount: data ? Number(data) : 0,
    isLoading,
  }
}
