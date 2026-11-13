export abstract class DomainError extends Error {
  abstract readonly type: string;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = new.target.name;
    this.field = field;
  }
}

export class InvalidAccountCodeError extends DomainError {
  readonly type = 'INVALID_ACCOUNT_CODE';
  constructor(message: string) { super(message, 'code'); }
}

export class InvalidAccountNameError extends DomainError {
  readonly type = 'INVALID_ACCOUNT_NAME';
  constructor(message: string) { super(message, 'name'); }
}

export class InvalidNatureError extends DomainError {
  readonly type = 'INVALID_NATURE';
  constructor(message: string) { super(message, 'nature'); }
}

export class AccountAlreadyExistsError extends DomainError {
  readonly type = 'ACCOUNT_ALREADY_EXISTS';
  constructor(code: string) { super(`Ya existe una cuenta con el código ${code}`, 'code'); }
}

export class ParentAccountNotFoundError extends DomainError {
  readonly type = 'PARENT_NOT_FOUND';
  constructor(parentCode: string) { super(`No existe la cuenta padre ${parentCode}`, 'code'); }
}

export class AccountNotFoundError extends DomainError {
  readonly type = 'ACCOUNT_NOT_FOUND';
  constructor(code: string) { super(`No existe la cuenta ${code}`, 'code'); }
}

export class AccountHasChildrenError extends DomainError {
  readonly type = 'ACCOUNT_HAS_CHILDREN';
  constructor(code: string) { super(`La cuenta ${code} tiene subcuentas y no se puede eliminar`); }
}