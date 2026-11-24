// Series temporales de la zona de Históricos: lectura de CSV, alineación y estadísticos.
// Puro (sin DOM ni red): el CSV se lee en el navegador y no sale de él.
// Los cálculos los hacen las funciones de operativa/lib/finanzas.js (P-006, P-011 a P-014).
import {
  rentabilidadesSimples, rentabilidadesLog, media, varianzaMuestral, desviacionMuestral,
  volatilidadAnualizada, volatilidadEWMA, correlacion, maximoDrawdown, mediaMovil, diferencias,
} from '../../../operativa/lib/finanzas.js';
import { leerNumero } from './formato.js';

export const MAX_FILAS_CSV = 20000;
export const MAX_BYTES_CSV = 5 * 1024 * 1024;

// Columnas reconocidas en la cabecera (en minúsculas y sin tildes), por prioridad.
const COLUMNAS_FECHA = ['fecha', 'date', 'time_period', 'periodo', 'dia'];
const COLUMNAS_VALOR = ['adj close', 'cierre ajustado', 'close', 'cierre', 'ultimo', 'precio', 'price', 'valor', 'value', 'obs_value'];

const sinTildes = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^"|"$/g, '').trim();

/** Fecha "dd/mm/aaaa", "dd-mm-aaaa", "aaaa-mm-dd" o "aaaa/mm/dd" → "aaaa-mm-dd" (o null). */
export function leerFecha(texto) {
  const t = String(texto).trim().replace(/^"|"$/g, '');
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T].*)?$/.exec(t);
  let a, mes, d;
  if (m) [, a, mes, d] = m;
  else {
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t);
    if (!m) return null;
    [, d, mes, a] = m;
  }
  const iso = `${a}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const f = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(f.getTime()) || f.toISOString().slice(0, 10) !== iso ? null : iso;
}

/** Separador de columnas: ";" (formato español), tabulador o ",". */
function separador(linea) {
  if (linea.includes(';')) return ';';
  if (linea.includes('\t')) return '\t';
  return ',';
}

/** Número de una celda: con ";" se lee en formato es-ES; con "," como separador, punto decimal. */
function leerValor(celda, sep) {
  const t = String(celda).trim().replace(/^"|"$/g, '');
  if (t === '' || /^(null|nan|n\/a|-)$/i.test(t)) return NaN;
  if (sep === ',') return /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t) ? Number(t) : NaN;
  return leerNumero(t);
}

/**
 * Lee un CSV de una serie (fecha + valor). Acepta:
 *   - dos columnas sin cabecera: fecha;valor (es-ES) o fecha,valor (punto decimal);
 *   - con cabecera: elige la columna de fecha y la de valor por su nombre
 *     (p. ej. Date / Adj Close / Close de los históricos de cotizaciones).
 * Devuelve los puntos ordenados por fecha, sin duplicados, y avisos; lanza un error con las
 * líneas problemáticas si el formato no es válido.
 * @returns {{ nombre: string, puntos: Array<[string, number]>, avisos: string[] }}
 */
export function leerCsvSerie(texto, nombreArchivo = 'Serie subida') {
  if (typeof texto !== 'string' || !texto.trim()) throw new Error('El archivo está vacío.');
  if (texto.length > MAX_BYTES_CSV) throw new Error('El archivo es demasiado grande (máximo 5 MB).');
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).map((l, k) => ({ l, n: k + 1 })).filter(({ l }) => l.trim());
  if (lineas.length > MAX_FILAS_CSV) throw new Error(`Demasiadas filas (máximo ${MAX_FILAS_CSV}).`);
  const sep = separador(lineas[0].l);
  const celdas = (l) => l.split(sep);

  let colF = 0, colV = 1, inicio = 0, nombre = nombreArchivo.replace(/\.[^.]+$/, '');
  const cab = celdas(lineas[0].l).map(sinTildes);
  if (!leerFecha(celdas(lineas[0].l)[0] ?? '')) {
    inicio = 1;
    colF = cab.findIndex((c) => COLUMNAS_FECHA.includes(c));
    if (colF < 0) colF = 0;
    colV = -1;
    for (const nombreCol of COLUMNAS_VALOR) { colV = cab.indexOf(nombreCol); if (colV >= 0) break; }
    if (colV < 0) {
      if (cab.length === 2) colV = 1 - colF;
      else throw new Error(`No se reconoce la columna de valores. Cabecera: ${cab.join(' | ')}. Usa dos columnas (fecha y valor) o una columna «Close»/«Cierre»/«Valor».`);
    }
    const original = celdas(lineas[0].l)[colV]?.trim().replace(/^"|"$/g, '');
    if (original) nombre = `${nombre} (${original})`;
  } else if (cab.length < 2) {
    throw new Error('Se necesitan al menos dos columnas: fecha y valor.');
  }

  const errores = [];
  const porFecha = new Map();
  let vacios = 0;
  for (const { l, n } of lineas.slice(inicio)) {
    const c = celdas(l);
    const fecha = leerFecha(c[colF] ?? '');
    if (!fecha) { errores.push(`línea ${n}: fecha no válida («${(c[colF] ?? '').trim()}»)`); continue; }
    const valor = leerValor(c[colV] ?? '', sep);
    if (Number.isNaN(valor)) {
      if ((c[colV] ?? '').trim() === '' || /^(null|nan|n\/a|-)$/i.test((c[colV] ?? '').trim())) { vacios++; continue; }
      errores.push(`línea ${n}: valor no válido («${(c[colV] ?? '').trim()}»)`);
      continue;
    }
    porFecha.set(fecha, valor);
    if (errores.length > 20) break;
  }
  if (errores.length) {
    throw new Error(`Formato no válido (${errores.length}${errores.length > 20 ? '+' : ''} ${errores.length === 1 ? 'error' : 'errores'}): ${errores.slice(0, 5).join('; ')}.`);
  }
  const puntos = [...porFecha].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (puntos.length < 3) throw new Error('Se necesitan al menos 3 observaciones con fecha y valor.');
  const avisos = [];
  if (vacios) avisos.push(`${vacios} filas sin valor se han ignorado.`);
  const filas = lineas.length - inicio - vacios;
  if (puntos.length < filas) avisos.push(`${filas - puntos.length} fechas repetidas: se queda el último valor.`);
  if (sep === ',') avisos.push('Separador «,»: los decimales se han leído con punto.');
  return { nombre, puntos, avisos };
}

/** Periodos por año según la separación mediana entre fechas (diaria hábil, semanal, mensual…). */
export function periodosPorAnio(fechas) {
  if (fechas.length < 2) return 252;
  const dias = fechas.slice(1).map((f, k) => (Date.parse(f) - Date.parse(fechas[k])) / 86_400_000).sort((a, b) => a - b);
  const mediana = dias[Math.floor(dias.length / 2)];
  if (mediana <= 4) return 252;
  if (mediana <= 10) return 52;
  if (mediana <= 45) return 12;
  if (mediana <= 120) return 4;
  return 1;
}

export const NOMBRE_PERIODICIDAD = { 252: 'diaria (252 días hábiles/año)', 52: 'semanal', 12: 'mensual', 4: 'trimestral', 1: 'anual' };

/** Puntos desde una fecha (inclusive). */
export function desde(puntos, fechaISO) {
  return fechaISO ? puntos.filter(([f]) => f >= fechaISO) : puntos;
}

/** Une dos series por fecha común. */
export function alinear(a, b) {
  const mb = new Map(b);
  const fechas = [], x = [], y = [];
  for (const [f, v] of a) if (mb.has(f)) { fechas.push(f); x.push(v); y.push(mb.get(f)); }
  return { fechas, x, y };
}

/**
 * Estadísticos de una serie.
 * - tipo 'precio' (cotizaciones, tipos de cambio): rentabilidades simples y log, volatilidad, EWMA, drawdown.
 * - tipo 'tipo' (tipos de interés en %): variaciones en puntos básicos; sin drawdown.
 */
export function analizar(puntos, tipo = 'precio', { lambda = 0.94 } = {}) {
  if (puntos.length < 3) throw new Error('Se necesitan al menos 3 observaciones');
  const fechas = puntos.map((p) => p[0]);
  const valores = puntos.map((p) => p[1]);
  const m = periodosPorAnio(fechas);
  const base = {
    n: valores.length, desde: fechas[0], hasta: fechas.at(-1), periodosPorAnio: m,
    ultimo: valores.at(-1), primero: valores[0], minimo: Math.min(...valores), maximo: Math.max(...valores),
  };
  if (tipo === 'tipo') {
    const d = diferencias(valores).map((x) => x * 100); // puntos porcentuales → pb
    return {
      ...base, tipo,
      cambioTotalPb: (base.ultimo - base.primero) * 100,
      mediaCambioPb: media(d),
      desviacionCambioPb: desviacionMuestral(d),
      volatilidadAnualPb: volatilidadAnualizada(d, m),
      ewmaAnualPb: volatilidadEWMA(d, lambda, m).anualizada,
    };
  }
  const simples = rentabilidadesSimples(valores);
  const logs = rentabilidadesLog(valores);
  const dd = maximoDrawdown(valores);
  return {
    ...base, tipo: 'precio',
    rentabilidadTotal: base.ultimo / base.primero - 1,
    mediaSimple: media(simples),
    mediaLog: media(logs),
    varianzaLog: varianzaMuestral(logs),
    volatilidadAnual: volatilidadAnualizada(logs, m),
    ewmaAnual: volatilidadEWMA(logs, lambda, m).anualizada,
    drawdown: dd.drawdown, fechaPico: fechas[dd.pico], fechaValle: fechas[dd.valle],
  };
}

/** Correlación de las variaciones de dos series en sus fechas comunes. */
export function correlacionSeries(a, tipoA, b, tipoB) {
  const { fechas, x, y } = alinear(a, b);
  if (fechas.length < 4) throw new Error('Menos de 4 fechas en común: no se puede calcular la correlación.');
  const varr = (v, t) => (t === 'tipo' ? diferencias(v) : rentabilidadesLog(v));
  return { correlacion: correlacion(varr(x, tipoA), varr(y, tipoB)), comunes: fechas.length, desde: fechas[0], hasta: fechas.at(-1) };
}

/** Medias móviles para la gráfica. */
export function mediasMoviles(puntos, ventanas) {
  const v = puntos.map((p) => p[1]);
  return ventanas.filter((n) => n < v.length).map((n) => ({ n, valores: mediaMovil(v, n) }));
}
