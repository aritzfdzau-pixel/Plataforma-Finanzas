// Datos y utilidades puras del panel de divisas (sin DOM ni red).

/** Divisas del panel "Contra el euro" (orden de la pantalla). Tipo = unidades de divisa por 1 EUR. */
export const DIVISAS_PANEL = Object.freeze([
  { codigo: 'USD', nombre: 'Dólar estadounidense' },
  { codigo: 'GBP', nombre: 'Libra esterlina' },
  { codigo: 'JPY', nombre: 'Yen japonés' },
  { codigo: 'CHF', nombre: 'Franco suizo' },
  { codigo: 'CNY', nombre: 'Yuan renminbi (China continental, onshore)' },
  { codigo: 'AUD', nombre: 'Dólar australiano' },
  { codigo: 'CAD', nombre: 'Dólar canadiense' },
  { codigo: 'HKD', nombre: 'Dólar de Hong Kong' },
  { codigo: 'NZD', nombre: 'Dólar neozelandés' },
]);

/** Pares de la cabecera. */
export const CABECERA = Object.freeze(['USD', 'GBP', 'JPY']);

/** Majors contra el dólar (pestaña 2). CNH = renminbi offshore (Hong Kong). */
export const MAJORS = Object.freeze(['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCNH']);

export const AVISO_CNY_CNH = 'CNY ≠ CNH: el CNY es el renminbi de China continental (onshore, con control de cambios); ' +
  'el CNH es el renminbi que cotiza fuera (offshore, sobre todo en Hong Kong). Su precio puede diferir. ' +
  'El BCE publica el CNY.';

/** "EURUSD" → "EUR/USD" */
export function nombrePar(par) {
  if (!/^[A-Z]{6}$/.test(par)) throw new Error(`Par no válido: ${par}`);
  return `${par.slice(0, 3)}/${par.slice(3)}`;
}

/** Decimales con que se muestra un tipo (JPY: 2; resto: 4, como publica el BCE). */
export function decimalesTipo(codigo) {
  return codigo === 'JPY' ? 2 : 4;
}

/** Tipo de referencia BCE de una divisa en datos/tipos-bce.json, o null si no está. */
export function tipoBce(datos, codigo) {
  const t = datos?.tipos?.find((x) => x.divisa === codigo);
  return t && Number.isFinite(t.tipo) ? t : null;
}

/**
 * Número como texto en formato es-ES sin separador de miles ("1,085", "162,35"),
 * para rellenar campos (que interpretan el punto como separador de miles).
 */
export function aTextoCampo(x) {
  if (!Number.isFinite(x)) throw new Error('Número no válido');
  return String(x).replace('.', ',');
}

/** "2026-11-23" → "23/11/2026" */
export function fechaEs(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

/** Enlace a la operación de seguro de cambio con el par y, si hay, el spot de referencia. */
export function enlaceForward(codigo, datos) {
  const p = new URLSearchParams({ op: 'fx-forward', par: codigo });
  const t = tipoBce(datos, codigo);
  if (t) p.set('spot', aTextoCampo(t.tipo));
  return `#${p}`;
}

/** Enlace a la conversión con tipo BCE para una divisa. */
export function enlaceConversion(codigo) {
  return `#${new URLSearchParams({ op: 'fx-conversion-bce', divisa: codigo })}`;
}
