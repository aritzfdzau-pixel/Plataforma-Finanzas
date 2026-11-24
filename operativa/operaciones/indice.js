// Registro de módulos de operación (id → ruta). El listado visible se genera desde las
// fichas (conocimiento/indice.json); este registro solo dice dónde está el código.
export const OPERACIONES = [
  'fx-forward',
  'fx-conversion-bce',
  'prestamo-amortizacion',
  'descuento-comercial',
  'tin-tae',
  'rentabilidad-volatilidad',
  'van-tir',
  'hipoteca-variable',
];

export async function cargarOperacion(id) {
  if (!OPERACIONES.includes(id)) throw new Error(`Operación desconocida: ${id}`);
  return (await import(`./${id}.js`)).default;
}
