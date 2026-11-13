import { describe, expect, it } from 'vitest';
import { Account } from './account.js';
import { InvalidAccountCodeError, InvalidNatureError } from './errors.js';

describe('Account', () => {
  const activo = Account.create({ code: '1', name: 'Activo', nature: 'DEBITO', parent: null });

  it('una clase exige naturaleza', () => {
    expect(() => Account.create({ code: '2', name: 'Pasivo', parent: null })).toThrow(InvalidNatureError);
  });

  it('la hija hereda la naturaleza del padre', () => {
    const disponible = Account.create({ code: '11', name: 'Disponible', nature: 'CREDITO', parent: activo });
    expect(disponible.nature).toBe('DEBITO');
  });

  it('rechaza un padre que no corresponde al prefijo', () => {
    expect(() => Account.create({ code: '21', name: 'X', parent: activo })).toThrow(InvalidAccountCodeError);
  });

  it('renombrar valida el nombre', () => {
    expect(() => activo.rename('   ')).toThrow();
  });
});