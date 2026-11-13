import type { AccountLevel } from '../domain/account-code.js';
import type { Account } from '../domain/account.js';
import type { AccountRepository } from '../domain/account.repository.js';
import type { Nature } from '../domain/nature.js';

export interface AccountNode {
  code: string;
  name: string;
  level: AccountLevel;
  nature: Nature;
  acceptsMovements: boolean; // solo las cuentas sin hijas
  createdAt: string;
  matched: boolean;
  children: AccountNode[];
}

export interface CatalogFilters {
  search?: string;
  from?: Date;
  to?: Date;
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export class GetCatalogTreeUseCase {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(filters: CatalogFilters = {}): Promise<AccountNode[]> {
    const all = await this.repository.findAll(); // ordenadas por código

    // Quién tiene hijas (se calcula sobre el catálogo completo, no sobre el filtrado)
    const withChildren = new Set<string>();
    for (const account of all) {
      const parent = account.code.parentCode();
      if (parent) withChildren.add(parent.toString());
    }

    const search = filters.search?.trim() ? normalize(filters.search.trim()) : null;
    const isFiltering = Boolean(search || filters.from || filters.to);

    const matches = (account: Account): boolean => {
      if (search) {
        const inCode = account.code.toString().startsWith(search);
        const inName = normalize(account.name).includes(search);
        if (!inCode && !inName) return false;
      }
      if (filters.from && account.createdAt < filters.from) return false;
      if (filters.to && account.createdAt > filters.to) return false;
      return true;
    };

    // Coincidencias + sus ancestros
    const matched = new Set(all.filter(matches).map((a) => a.code.toString()));
    const visible = new Set<string>();
    if (isFiltering) {
      for (const account of all) {
        if (!matched.has(account.code.toString())) continue;
        let code = account.code as ReturnType<typeof account.code.parentCode>;
        while (code) {
          visible.add(code.toString());
          code = code.parentCode();
        }
      }
    }

    // Armar el árbol
    const nodes = new Map<string, AccountNode>();
    const roots: AccountNode[] = [];
    for (const account of all) {
      const key = account.code.toString();
      if (isFiltering && !visible.has(key)) continue;

      const node: AccountNode = {
        code: key,
        name: account.name,
        level: account.level,
        nature: account.nature,
        acceptsMovements: !withChildren.has(key),
        createdAt: account.createdAt.toISOString(),
        matched: isFiltering && matched.has(key),
        children: [],
      };
      nodes.set(key, node);

      const parentKey = account.code.parentCode()?.toString();
      const parentNode = parentKey ? nodes.get(parentKey) : undefined;
      if (parentNode) parentNode.children.push(node);
      else roots.push(node);
    }
    return roots;
  }
}