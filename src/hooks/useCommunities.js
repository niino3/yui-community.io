import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: () => api.communities.list(),
  })
}
