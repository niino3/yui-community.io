import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useTasks(params = {}) {
  const { _skip, ...rest } = params
  return useQuery({
    queryKey: ['tasks', rest],
    queryFn: () => api.tasks.list(rest),
    enabled: !_skip,
  })
}
