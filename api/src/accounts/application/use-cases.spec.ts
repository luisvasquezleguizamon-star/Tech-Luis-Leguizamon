import { beforeEach, describe, expect, it } from 'vitest';
import {
  AccountAlreadyExistsError,
  AccountHasChildrenError,
  InvalidAccountCodeError,
  ParentAccountNotFoundError,
} from '../domain/errors.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { seedAccounts } from '../infrastructure/persistence/seed-accounts.js';
import { CreateAccountUseCase } from './create-account.use-case.js';
import { DeleteAccountUseCase } from './delete-account.use-case.js';
import { GetCatalogTreeUseCase } from './get-catalog-tree.use-case.js';
import { RenameAccountUseCase } from './rename-account.use-case.js';

describe('Casos de uso de cuentas', () => {
  let repo: InMemoryAccountRepository;

  beforeEach(() => {
    repo = new InMemoryAccountRepository(seedAccounts());
  });

  describe('CreateAccount', () => {
    it('crea una subcuenta que hereda la naturaleza', async () => {
      const account = await new CreateAccountUseCase(repo).execute({ code: '110515', name: 'Caja auxiliar' });
      expect(account.nature).toBe('DEBITO');
      expect(account.level).toBe('SUBCUENTA');
    });

    it('rechaza código no numérico o de longitud inválida', async () => {
      const useCase = new CreateAccountUseCase(repo);
      await expect(useCase.execute({ code: '11a', name: 'X' })).rejects.toThrow(InvalidAccountCodeError);
      await expect(useCase.execute({ code: '123', name: 'X' })).rejects.toThrow(InvalidAccountCodeError);
    });

    it('rechaza código repetido', async () => {
      await expect(new CreateAccountUseCase(repo).execute({ code: '1105', name: 'X' }))
        .rejects.toThrow(AccountAlreadyExistsError);
    });

        it('rechaza si el padre no existe', async () => {
      await expect(new CreateAccountUseCase(repo).execute({ code: '1205', name: 'X' }))
        .rejects.toThrow(ParentAccountNotFoundError);
    });
  });

  describe('GetCatalogTree', () => {
    it('devuelve las clases como raíces con sus hijas anidadas', async () => {
      const tree = await new GetCatalogTreeUseCase(repo).execute();
      expect(tree.map((n) => n.code)).toEqual(['1', '2', '3', '4', '5']);
      expect(tree[0].children[0].code).toBe('11');
      expect(tree[0].acceptsMovements).toBe(false);
    });

    it('filtra por nombre e incluye los ancestros', async () => {
      const tree = await new GetCatalogTreeUseCase(repo).execute({ search: 'caja general' });
      expect(tree).toHaveLength(1);
      const caja = tree[0].children[0].children[0].children[0];
      expect(caja.code).toBe('110505');
      expect(caja.matched).toBe(true);
    });
  });

  describe('RenameAccount', () => {
    it('cambia el nombre', async () => {
      const account = await new RenameAccountUseCase(repo).execute('1105', 'Caja principal');
      expect(account.name).toBe('Caja principal');
    });
  });

  describe('DeleteAccount', () => {
    it('elimina una cuenta sin hijas', async () => {
      await new DeleteAccountUseCase(repo).execute('110510');
      expect(await repo.findByCode('110510')).toBeNull();
    });

    it('rechaza eliminar una cuenta con hijas', async () => {
      await expect(new DeleteAccountUseCase(repo).execute('1105')).rejects.toThrow(AccountHasChildrenError);
    });
  });
});