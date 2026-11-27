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
  'escenario-tipo-cambio',
  'escenario-euribor',
  'analisis-estados-financieros',
  'circulante-nof',
  'poliza-credito',
  'factoring',
  'confirming',
  'avales',
  'bono-precio-rentabilidad',
  'rentabilidad-indice',
  'saldos-medios',
  'deposito-plazo',
  'capitalizacion',
  'equivalencia-tipos',
  'forward-tipos',
  'intereses-demora',
  'tipo-real',
];

export async function cargarOperacion(id) {
  if (!OPERACIONES.includes(id)) throw new Error(`Operación desconocida: ${id}`);
  return (await import(`./${id}.js`)).default;
}
