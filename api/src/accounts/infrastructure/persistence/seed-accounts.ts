import { Account } from '../../domain/account.js';

type SeedRow = { code: string; name: string; nature?: 'DEBITO' | 'CREDITO' };

const ROWS: SeedRow[] = [
  { code: '1', name: 'Activo', nature: 'DEBITO' },
  { code: '11', name: 'Disponible' },
  { code: '1105', name: 'Caja' },
  { code: '110505', name: 'Caja general' },
  { code: '110510', name: 'Cajas menores' },
  { code: '1110', name: 'Bancos' },
  { code: '111005', name: 'Moneda nacional' },
  { code: '13', name: 'Deudores' },
  { code: '1305', name: 'Clientes' },
  { code: '2', name: 'Pasivo', nature: 'CREDITO' },
  { code: '21', name: 'Obligaciones financieras' },
  { code: '2105', name: 'Bancos nacionales' },
  { code: '3', name: 'Patrimonio', nature: 'CREDITO' },
  { code: '31', name: 'Capital social' },
  { code: '4', name: 'Ingresos', nature: 'CREDITO' },
  { code: '41', name: 'Operacionales' },
  { code: '5', name: 'Gastos', nature: 'DEBITO' },
  { code: '51', name: 'Operacionales de administración' },
];

export function seedAccounts(): Account[] {
  const byCode = new Map<string, Account>();
  for (const row of ROWS) {
    const parentCode = row.code.length === 1 ? null : row.code.slice(0, row.code.length === 2 ? 1 : row.code.length - 2);
    const parent = parentCode ? byCode.get(parentCode) ?? null : null;
    const account = Account.create({ ...row, parent });
    byCode.set(row.code, account);
  }
  return [...byCode.values()];
}