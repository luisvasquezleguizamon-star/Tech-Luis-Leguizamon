export type Nature = 'DEBITO' | 'CREDITO'
export type Level = 'CLASE' | 'GRUPO' | 'CUENTA' | 'SUBCUENTA'

export interface AccountNode {
  code: string
  name: string
  level: Level
  nature: Nature
  acceptsMovements: boolean
  createdAt: string
  matched: boolean
  children: AccountNode[]
}

export interface CreateAccountInput {
  code: string
  name: string
  nature?: Nature
}

export interface CatalogFilters {
  search?: string
}
