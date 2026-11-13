import { AccountCode, type AccountLevel } from './account-code.js';
import { InvalidAccountCodeError, InvalidAccountNameError, InvalidNatureError } from './errors.js';
import { isNature, type Nature } from './nature.js';

const MAX_NAME_LENGTH = 100;

interface AccountProps {
  code: AccountCode;
  name: string;
  nature: Nature;
  createdAt: Date;
}

export interface CreateAccountParams {
  code: string;
  name: string;
  nature?: string;     // solo se usa si es CLASE
  parent: Account | null;
  now?: Date;
}

export class Account {
  private props: AccountProps;

  private constructor(props: AccountProps) {
    this.props = props;
  }

  static create(params: CreateAccountParams): Account {
    const code = AccountCode.create(params.code);
    const name = Account.validateName(params.name);
    const expectedParent = code.parentCode();

    let nature: Nature;
    if (expectedParent === null) {
      // Es una CLASE: no tiene padre y debe declarar su naturaleza
      if (!isNature(params.nature)) {
        throw new InvalidNatureError('Una clase debe tener naturaleza DEBITO o CREDITO');
      }
      nature = params.nature;
    } else {
      if (!params.parent || !params.parent.code.equals(expectedParent)) {
        throw new InvalidAccountCodeError(`El padre de ${code} debe ser ${expectedParent}`);
      }
      nature = params.parent.nature; // herencia
    }

    return new Account({ code, name, nature, createdAt: params.now ?? new Date() });
  }

  /** Reconstruye una cuenta ya guardada (la usa el repositorio). */
  static restore(props: { code: string; name: string; nature: Nature; createdAt: Date }): Account {
    return new Account({ ...props, code: AccountCode.create(props.code) });
  }

  rename(newName: string): void {
    this.props.name = Account.validateName(newName);
  }

  private static validateName(raw: string): string {
    const name = (raw ?? '').trim();
    if (name.length === 0) throw new InvalidAccountNameError('El nombre es obligatorio');
    if (name.length > MAX_NAME_LENGTH) {
      throw new InvalidAccountNameError(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
    }
    return name;
  }

  get code(): AccountCode { return this.props.code; }
  get name(): string { return this.props.name; }
  get nature(): Nature { return this.props.nature; }
  get level(): AccountLevel { return this.props.code.level; }
  get createdAt(): Date { return this.props.createdAt; }
}