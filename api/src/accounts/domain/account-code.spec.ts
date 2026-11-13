import { describe, expect, it } from 'vitest';
import { AccountCode } from './account-code.js';
import { InvalidAccountCodeError } from './errors.js';

describe('AccountCode', () => {
  it.each([
    ['1', 'CLASE'],
    ['11', 'GRUPO'],
    ['1105', 'CUENTA'],
    ['110505', 'SUBCUENTA'],
  ])('el código %s es nivel %s', (code, level) => {
    expect(AccountCode.create(code).level).toBe(level);
  });

  it('calcula el padre por prefijo', () => {
    expect(AccountCode.create('115566').parentCode()?.toString()).toBe('1155');
    expect(AccountCode.create('1155').parentCode()?.toString()).toBe('11');
    expect(AccountCode.create('11').parentCode()?.toString()).toBe('1');
    expect(AccountCode.create('1').parentCode()).toBeNull();
  });

  it.each(['', 'abc', '11a', '123', '12345', '1234567'])('rechaza "%s"', (code) => {
    expect(() => AccountCode.create(code)).toThrow(InvalidAccountCodeError);
  });
});