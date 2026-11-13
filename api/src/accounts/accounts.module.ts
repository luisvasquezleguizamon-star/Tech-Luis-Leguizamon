import { Module } from '@nestjs/common';
import type { AccountRepository } from './domain/account.repository.js';
import { CreateAccountUseCase } from './application/create-account.use-case.js';
import { DeleteAccountUseCase } from './application/delete-account.use-case.js';
import { GetCatalogTreeUseCase } from './application/get-catalog-tree.use-case.js';
import { RenameAccountUseCase } from './application/rename-account.use-case.js';
import { AccountsController } from './infrastructure/http/accounts.controller.js';
import { InMemoryAccountRepository } from './infrastructure/persistence/in-memory-account.repository.js';
import { seedAccounts } from './infrastructure/persistence/seed-accounts.js';

const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

@Module({
  controllers: [AccountsController],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (): AccountRepository => new InMemoryAccountRepository(seedAccounts()),
    },
    {
      provide: CreateAccountUseCase,
      useFactory: (repo: AccountRepository) => new CreateAccountUseCase(repo),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: GetCatalogTreeUseCase,
      useFactory: (repo: AccountRepository) => new GetCatalogTreeUseCase(repo),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: RenameAccountUseCase,
      useFactory: (repo: AccountRepository) => new RenameAccountUseCase(repo),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: DeleteAccountUseCase,
      useFactory: (repo: AccountRepository) => new DeleteAccountUseCase(repo),
      inject: [ACCOUNT_REPOSITORY],
    },
  ],
})
export class AccountsModule {}