import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function usePlatformCommunities() {
  return useQuery({
    queryKey: ['platform-communities'],
    queryFn: () => api.platform.communities.list(),
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.platform.stats(),
  })
}

export function useCreateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.platform.communities.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-communities'] })
      qc.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

export function useUpdateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.platform.communities.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-communities'] }),
  })
}

export function useDeleteCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.platform.communities.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-communities'] }),
  })
}
