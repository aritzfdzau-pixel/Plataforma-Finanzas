// Lectura y formato de números en convención es-ES. Módulo puro (sin DOM).

/**
 * Convierte texto en número. Acepta "1.234,56", "1234,56", "1234.56", "1,085", "-3,5".
 * Regla (convención es-ES):
 *  - Si aparecen coma y punto, el que va último es el decimal ("1.234,56" o "1,234.56").
 *  - Si solo hay una coma, es el decimal ("1,085").
 *  - Si solo hay puntos y forman grupos de 3 cifras, son miles ("100.000", "1.085" → 1085).
 *  - Si hay un único punto que no forma grupos de 3 cifras, es el decimal ("1.0850", "4.5").
 * La interfaz muestra siempre el valor interpretado para evitar errores.
 * Devuelve NaN si el texto no es un número válido.
 */
export function leerNumero(texto) {
  if (typeof texto === 'number') return texto;
  if (typeof texto !== 'string') return NaN;
  let t = texto.trim().replace(/[\s  ]/g, '').replace(/^−/, '-').replace(/[€%]$/, '');
  if (t === '' || !/^[-+]?[\d.,]+$/.test(t)) return NaN;
  const ultComa = t.lastIndexOf(',');
  const ultPunto = t.lastIndexOf('.');
  if (ultComa >= 0 && ultPunto >= 0) {
    const decimal = ultComa > ultPunto ? ',' : '.';
    const miles = decimal === ',' ? '.' : ',';
    if (t.split(decimal).length > 2) return NaN;
    t = t.split(miles).join('').replace(decimal, '.');
  } else if (ultComa >= 0) {
    if (t.split(',').length > 2) return NaN;
    t = t.replace(',', '.');
  } else if (ultPunto >= 0) {
    if (esMilesConPunto(t)) t = t.split('.').join('');
    else if (t.split('.').length > 2) return NaN;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** true si el texto solo usa puntos como separador de miles: "1.085", "100.000". */
export function esMilesConPunto(texto) {
  return /^[-+]?\d{1,3}(\.\d{3})+$/.test(String(texto).trim());
}

/**
 * Lee una serie de números separados por saltos de línea, tabuladores, espacios o ";".
 * (La coma no separa: es el decimal en es-ES.) Lanza un error indicando la posición inválida.
 */
export function leerSerie(texto) {
  const trozos = String(texto ?? '').split(/[\s;]+/).filter((x) => x !== '');
  return trozos.map((t, k) => {
    const n = leerNumero(t);
    if (Number.isNaN(n)) throw new Error(`Valor no válido en la posición ${k + 1}: «${t}»`);
    return n;
  });
}

const cache = new Map();
function nf(min, max) {
  const clave = `${min}-${max}`;
  if (!cache.has(clave)) {
    cache.set(clave, new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: 'always',
    }));
  }
  return cache.get(clave);
}

/** Número con separador de miles y decimales es-ES: 1234.5 → "1.234,50". */
export function numero(x, decimales = 2, maxDecimales = decimales) {
  if (!Number.isFinite(x)) return '—';
  const v = Math.abs(x) < 0.5 * 10 ** -maxDecimales ? 0 : x; // evita "-0,00"
  return nf(decimales, maxDecimales).format(v);
}

/** Importe en euros: 1234.5 → "1.234,50 €". */
export function eur(x, decimales = 2) {
  return Number.isFinite(x) ? `${numero(x, decimales)} €` : '—';
}

/** Importe en otra divisa: (162350, 'JPY', 0) → "162.350 JPY". */
export function divisa(x, codigo, decimales = 2) {
  return Number.isFinite(x) ? `${numero(x, decimales)} ${codigo}` : '—';
}

/** Porcentaje a partir de tanto por uno: 0.034 → "3,40 %". */
export function pct(x, decimales = 2) {
  return Number.isFinite(x) ? `${numero(x * 100, decimales)} %` : '—';
}

/**
 * Variación con flecha y color (D-013). La flecha ▲ ▼ indica siempre la dirección; el color,
 * si es favorable: por defecto subir es verde, y con sentido 'coste' (cuota, intereses…)
 * subir es rojo y bajar verde. Devuelve null si no hay variación (0 o no finita).
 */
export function sentidoVariacion(valor, sentido) {
  if (!Number.isFinite(valor) || valor === 0) return null;
  const sube = valor > 0;
  const coste = sentido === 'coste';
  return {
    clase: `${sube ? 'var-up' : 'var-down'}${coste ? ' var--coste' : ''}`,
    texto: `${sube ? 'sube' : 'baja'}${coste ? (sube ? ' (desfavorable)' : ' (favorable)') : ''} `,
  };
}

/**
 * Formatea un resultado según su código de formato:
 * 'eur' · 'entero' · 'texto' · 'pct' · 'pct:N' · 'num:N' · 'divisa:COD:N'.
 */
export function formatear(valor, formato) {
  if (formato === 'texto') return String(valor);
  if (formato === 'eur') return eur(valor);
  if (formato === 'entero') return numero(valor, 0);
  let m = /^pct(?::(\d+))?$/.exec(formato);
  if (m) return pct(valor, m[1] ? Number(m[1]) : 2);
  m = /^num:(\d+)$/.exec(formato);
  if (m) return numero(valor, Number(m[1]));
  m = /^veces:(\d+)$/.exec(formato);
  if (m) return `${numero(valor, Number(m[1]))}x`;
  m = /^pp:(\d+)$/.exec(formato); // diferencia de dos porcentajes, en puntos porcentuales
  if (m) return `${numero(valor * 100, Number(m[1]))} p. p.`;
  m = /^dias:(\d+)$/.exec(formato);
  if (m) return `${numero(valor, Number(m[1]))} días`;
  m = /^divisa:([A-Z]{3}):(\d+)$/.exec(formato);
  if (m) return divisa(valor, m[1], Number(m[2]));
  throw new Error(`Formato desconocido: ${formato}`);
}
