import type { Account } from '../domain/account.js';
import type { AccountRepository } from '../domain/account.repository.js';
import { AccountNotFoundError } from '../domain/errors.js';

export class RenameAccountUseCase {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(code: string, newName: string): Promise<Account> {
    const account = await this.repository.findByCode(code);
    if (!account) throw new AccountNotFoundError(code);
    account.rename(newName); // la regla del nombre vive en la entidad
    await this.repository.save(account);
    return account;
  }
}