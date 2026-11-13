export const NATURES = ['DEBITO', 'CREDITO'] as const;
export type Nature = (typeof NATURES)[number];

export function isNature(value: unknown): value is Nature {
  return typeof value === 'string' && (NATURES as readonly string[]).includes(value);
}