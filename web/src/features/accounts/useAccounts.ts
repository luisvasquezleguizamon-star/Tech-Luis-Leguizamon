import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from './accounts.api'
import type { CatalogFilters, CreateAccountInput } from './types'

export const accountKeys = {
  all: ['accounts'] as const,
  tree: (filters: CatalogFilters) => ['accounts', 'tree', filters] as const,
}

export function useCatalogTree(filters: CatalogFilters = {}) {
  return useQuery({
    queryKey: accountKeys.tree(filters),
    queryFn: () => accountsApi.getTree(filters),
    placeholderData: keepPreviousData, // no parpadea al cambiar el filtro
  })
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: accountKeys.all })
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: invalidate,
  })
}

export function useRenameAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ code, name }: { code: string; name: string }) => accountsApi.rename(code, name),
    onSuccess: invalidate,
  })
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: (code: string) => accountsApi.remove(code),
    onSuccess: invalidate,
  })
}