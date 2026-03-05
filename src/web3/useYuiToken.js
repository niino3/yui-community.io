import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { YuiTokenABI } from '../contracts/abis'
import { CONTRACTS } from '../contracts/addresses'

const contractConfig = {
  address: CONTRACTS.YuiToken,
  abi: YuiTokenABI,
}

export function useYuiBalance(address) {
  const { data, isLoading, refetch } = useReadContract({
    ...contractConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  return {
    balance: data ? formatEther(data) : '0',
    balanceRaw: data,
    isLoading,
    refetch,
  }
}

export function useYuiTotalSupply() {
  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: 'totalSupply',
  })

  return {
    totalSupply: data ? formatEther(data) : '0',
    isLoading,
  }
}

export function useYuiTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function transfer(to, amount) {
    writeContract({
      ...contractConfig,
      functionName: 'transfer',
      args: [to, parseEther(amount)],
    })
  }

  return { transfer, hash, isPending, isConfirming, isSuccess, error }
}
