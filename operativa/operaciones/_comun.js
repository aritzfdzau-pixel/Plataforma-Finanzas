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

/**
 * Lee movimientos de cuenta, uno por línea: «fecha valor; importe[; concepto]» (también con
 * tabulador). Importe en es-ES, negativo para cargos. Devuelve [{ fecha, importe, concepto, linea }].
 * Las líneas vacías o que empiezan por «#» se ignoran.
 */
export function leerMovimientos(texto, leerFecha, leerNumero) {
  const movimientos = [];
  String(texto ?? '').split(/\r?\n/).forEach((bruta, k) => {
    const linea = bruta.trim();
    if (!linea || linea.startsWith('#')) return;
    const partes = linea.split(/\s*[;\t]\s*/);
    const fecha = leerFecha(partes[0]);
    exigir(fecha, `Línea ${k + 1}: fecha no válida «${partes[0]}» (dd/mm/aaaa)`);
    const importe = leerNumero(partes[1] ?? '');
    exigir(Number.isFinite(importe), `Línea ${k + 1}: importe no válido «${partes[1] ?? ''}»`);
    movimientos.push({ fecha, importe, concepto: partes.slice(2).join(' ').trim(), linea: k + 1 });
  });
  return movimientos;
}

export const BASES_OPCIONES = [
  { valor: 'ACT/365', etiqueta: 'Act/365 (días reales / 365)' },
  { valor: 'ACT/360', etiqueta: 'Act/360 (días reales / 360)' },
];
