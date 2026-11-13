import { describe, expect, it } from 'vitest';
import { InMemoryAccountRepository } from './in-memory-account.repository.js';
import { seedAccounts } from './seed-accounts.js';


describe('InMemoryAccountRepository', () => {
  it('carga los datos de ejemplo respetando las reglas', async () => {
    const repo = new InMemoryAccountRepository(seedAccounts());
    const caja = await repo.findByCode('110505');
    expect(caja?.name).toBe('Caja general');
    expect(caja?.nature).toBe('DEBITO');
  });

  it('detecta si una cuenta tiene hijas', async () => {
    const repo = new InMemoryAccountRepository(seedAccounts());
    expect(await repo.hasChildren('1105')).toBe(true);
    expect(await repo.hasChildren('110505')).toBe(false);
  });

  it('elimina una cuenta', async () => {
    const repo = new InMemoryAccountRepository(seedAccounts());
    await repo.delete('110510');
    expect(await repo.findByCode('110510')).toBeNull();
  });
});