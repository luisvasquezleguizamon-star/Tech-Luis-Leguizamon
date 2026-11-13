import { InvalidAccountCodeError } from './errors.js';

export type AccountLevel = 'CLASE' | 'GRUPO' | 'CUENTA' | 'SUBCUENTA';

const LEVEL_BY_LENGTH: Record<number, AccountLevel> = {
  1: 'CLASE',
  2: 'GRUPO',
  4: 'CUENTA',
  6: 'SUBCUENTA',
};

const PARENT_LENGTH: Record<number, number | null> = { 1: null, 2: 1, 4: 2, 6: 4 };

export class AccountCode {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): AccountCode {
    const value = (raw ?? '').trim();
    if (!/^\d+$/.test(value)) {
      throw new InvalidAccountCodeError('El código debe contener solo números');
    }
    if (!(value.length in LEVEL_BY_LENGTH)) {
      throw new InvalidAccountCodeError('El código debe tener 1, 2, 4 o 6 dígitos');
    }
    return new AccountCode(value);
  }

  get level(): AccountLevel {
    return LEVEL_BY_LENGTH[this.value.length];
  }

  /** 115566 → 1155, 1155 → 11, 11 → 1, 1 → null */
  parentCode(): AccountCode | null {
    const parentLength = PARENT_LENGTH[this.value.length];
    return parentLength === null ? null : new AccountCode(this.value.slice(0, parentLength));
  }

  equals(other: AccountCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}