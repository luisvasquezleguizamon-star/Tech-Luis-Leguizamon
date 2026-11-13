import { Account } from '../domain/account.js';
import { AccountCode } from '../domain/account-code.js';
import type { AccountRepository } from '../domain/account.repository.js';
import { AccountAlreadyExistsError, ParentAccountNotFoundError } from '../domain/errors.js';

export interface CreateAccountInput {
  code: string;
  name: string;
  nature?: string;
}

export class CreateAccountUseCase {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(input: CreateAccountInput): Promise<Account> {
    // 1. Numérico y longitud válida (lo valida el objeto de valor)
    const code = AccountCode.create(input.code);

    // 2. Que no exista
    if (await this.repository.findByCode(code.toString())) {
      throw new AccountAlreadyExistsError(code.toString());
    }

    // 3. Que el padre exista
    const parentCode = code.parentCode();
    let parent: Account | null = null;
    if (parentCode) {
      parent = await this.repository.findByCode(parentCode.toString());
      if (!parent) throw new ParentAccountNotFoundError(parentCode.toString());
    }

    // 4. Crear (aquí se valida el nombre, la naturaleza y la herencia)
    const account = Account.create({ code: code.toString(), name: input.name, nature: input.nature, parent });
    await this.repository.save(account);
    return account;
  }
}