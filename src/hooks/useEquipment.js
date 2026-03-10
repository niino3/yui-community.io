import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useEquipmentList(params = {}) {
  const { _skip, ...rest } = params
  return useQuery({
    queryKey: ['equipment', rest],
    queryFn: () => api.equipment.list(rest),
    enabled: !_skip,
  })
}

export function useEquipmentDetail(id) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => api.equipment.get(id),
    enabled: !!id,
  })
}

export function useEquipmentReserve() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.equipment.reserve(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })
}

export function useEquipmentReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.equipment.return(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })
}
