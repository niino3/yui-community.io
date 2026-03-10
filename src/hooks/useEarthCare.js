import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useEarthCareList(params = {}) {
  const { _skip, ...rest } = params
  return useQuery({
    queryKey: ['earth-care', rest],
    queryFn: () => api.earthCare.list(rest),
    enabled: !_skip,
  })
}

export function useEarthCareDetail(id) {
  return useQuery({
    queryKey: ['earth-care', id],
    queryFn: () => api.earthCare.get(id),
    enabled: !!id,
  })
}

export function useEarthCareCreate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.earthCare.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['earth-care'] }),
  })
}

export function useEarthCareApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.earthCare.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['earth-care'] }),
  })
}
