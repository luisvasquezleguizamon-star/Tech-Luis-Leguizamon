import type { Account } from '../../domain/account.js';

export function toAccountResponse(account: Account, acceptsMovements: boolean) {
  return {
    code: account.code.toString(),
    name: account.name,
    level: account.level,
    nature: account.nature,
    acceptsMovements,
    createdAt: account.createdAt.toISOString(),
  };
}