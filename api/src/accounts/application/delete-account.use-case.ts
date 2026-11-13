import type { AccountRepository } from '../domain/account.repository.js';
import { AccountHasChildrenError, AccountNotFoundError } from '../domain/errors.js';

export class DeleteAccountUseCase {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(code: string): Promise<void> {
    const account = await this.repository.findByCode(code);
    if (!account) throw new AccountNotFoundError(code);
    if (await this.repository.hasChildren(code)) throw new AccountHasChildrenError(code);
    await this.repository.delete(code);
  }
}