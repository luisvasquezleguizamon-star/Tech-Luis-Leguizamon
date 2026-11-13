import type { Account } from '../../domain/account.js';
import type { AccountRepository } from '../../domain/account.repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>();

  constructor(initial: Account[] = []) {
    for (const account of initial) {
      this.accounts.set(account.code.toString(), account);
    }
  }

  async findByCode(code: string): Promise<Account | null> {
    return this.accounts.get(code) ?? null;
  }

  async findAll(): Promise<Account[]> {
    return [...this.accounts.values()].sort((a, b) =>
      a.code.toString().localeCompare(b.code.toString()),
    );
  }

  /** Como el padre es el prefijo, cualquier descendiente empieza por el código del padre. */
  async hasChildren(code: string): Promise<boolean> {
    for (const key of this.accounts.keys()) {
      if (key.length > code.length && key.startsWith(code)) return true;
    }
    return false;
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.code.toString(), account);
  }

  async delete(code: string): Promise<void> {
    this.accounts.delete(code);
  }
}