import { request } from '../../shared/http'
import type { AccountNode, CatalogFilters, CreateAccountInput } from './types'

export const accountsApi = {
  getTree(filters: CatalogFilters = {}) {
    const params = new URLSearchParams()
    if (filters.search?.trim()) params.set('search', filters.search.trim())
    const query = params.toString()
    return request<AccountNode[]>(`/accounts/tree${query ? `?${query}` : ''}`)
  },

  create(input: CreateAccountInput) {
    return request<AccountNode>('/accounts', { method: 'POST', body: JSON.stringify(input) })
  },

  rename(code: string, name: string) {
    return request<{ code: string; name: string }>(`/accounts/${code}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
  },

  remove(code: string) {
    return request<void>(`/accounts/${code}`, { method: 'DELETE' })
  },
}
