// Utilidades comunes a las operaciones. Puro (sin DOM).
export const AVISO_ESTUDIO = 'Herramienta de estudio; resultados orientativos.';

export const PERIODICIDADES = [
  { valor: '12', etiqueta: 'Mensual (12/año)' },
  { valor: '4', etiqueta: 'Trimestral (4/año)' },
  { valor: '2', etiqueta: 'Semestral (2/año)' },
  { valor: '1', etiqueta: 'Anual (1/año)' },
];
export const NOMBRE_PERIODICIDAD = { 12: 'mensual', 4: 'trimestral', 2: 'semestral', 1: 'anual' };

/** Lanza un error legible si no se cumple la condición. */
export function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}
export function positivo(x, nombre) {
  exigir(Number.isFinite(x) && x > 0, `${nombre}: debe ser un número mayor que 0`);
  return x;
}
export function noNegativo(x, nombre) {
  exigir(Number.isFinite(x) && x >= 0, `${nombre}: debe ser un número mayor o igual que 0`);
  return x;
}
export function entero(x, nombre, min = 1) {
  exigir(Number.isInteger(x) && x >= min, `${nombre}: debe ser un entero mayor o igual que ${min}`);
  return x;
}
