import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useTransactions(params = {}) {
  const { _skip, ...rest } = params
  return useQuery({
    queryKey: ['transactions', rest],
    queryFn: () => api.transactions.list(rest),
    enabled: !_skip,
  })
}
