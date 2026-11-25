// Lectura de series oficiales (BCE csvdata y Banco de España JSON) y construcción de
// datos/historicos.json. Funciones puras: las usan scripts/descargar-historicos.js y los tests.

const FECHA_DIA = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_MES = /^\d{4}-\d{2}$/;

/** "2026-11" → "2026-11-01"; "2026-11-24" igual; otra cosa → null. */
export function normalizarFecha(t) {
  const s = String(t ?? '').trim().slice(0, 10);
  if (FECHA_DIA.test(s)) return s;
  if (FECHA_MES.test(s.slice(0, 7)) && s.length === 7) return `${s}-01`;
  return null;
}

/** Divide una línea CSV respetando comillas dobles (separador «,» o «;»). */
export function celdasCsv(linea, sep = ',') {
  const out = [];
  let actual = '', comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i++; } else if (c === '"') comillas = false; else actual += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { out.push(actual); actual = ''; } else actual += c;
  }
  out.push(actual);
  return out;
}

/**
 * CSV del Portal de Datos del BCE (format=csvdata): cabecera con TIME_PERIOD y OBS_VALUE.
 * @returns {Array<[string, number]>} puntos ordenados por fecha
 */
export function parsearCsvBce(texto) {
  const lineas = String(texto).replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) throw new Error('CSV SDMX vacío');
  // SDMX-CSV: el BCE separa con «,»; el Bundesbank, con «;» (y puede usar coma decimal).
  const sep = lineas[0].includes(';') && !lineas[0].includes(',') ? ';' : ',';
  const cab = celdasCsv(lineas[0], sep).map((c) => c.trim().toUpperCase());
  const iF = cab.indexOf('TIME_PERIOD');
  const iV = cab.indexOf('OBS_VALUE');
  if (iF < 0 || iV < 0) throw new Error('El CSV SDMX no tiene TIME_PERIOD y OBS_VALUE');
  const puntos = [];
  for (const l of lineas.slice(1)) {
    const c = celdasCsv(l, sep);
    const f = normalizarFecha(c[iF]);
    const v = Number(sep === ';' ? String(c[iV]).replace(',', '.') : c[iV]);
    if (f && c[iV]?.trim() !== '' && Number.isFinite(v)) puntos.push([f, v]);
  }
  if (!puntos.length) throw new Error('El CSV SDMX no tiene observaciones');
  return ordenar(puntos);
}

/**
 * JSON de la API del Banco de España (listaSeries). Acepta las dos formas documentadas por
 * terceros (⚠️ pendiente de verificar): [{ fechas: [...], valores: [...] }] o
 * [{ fechaValor, valor }, …]. Las fechas pueden venir con hora.
 */
export function parsearJsonBde(json) {
  const datos = typeof json === 'string' ? JSON.parse(json) : json;
  const lista = Array.isArray(datos) ? datos : [datos];
  const puntos = [];
  for (const s of lista) {
    if (Array.isArray(s?.fechas) && Array.isArray(s?.valores)) {
      s.fechas.forEach((f, k) => { const v = Number(s.valores[k]); const ff = normalizarFecha(f); if (ff && Number.isFinite(v)) puntos.push([ff, v]); });
    } else if (s && 'fechaValor' in s && 'valor' in s) {
      const ff = normalizarFecha(s.fechaValor); const v = Number(s.valor);
      if (ff && Number.isFinite(v)) puntos.push([ff, v]);
    }
  }
  if (!puntos.length) throw new Error('Respuesta del Banco de España sin datos reconocibles');
  return ordenar(puntos);
}

/**
 * CSV de FRED (fredgraph.csv): cabecera "observation_date,ID" (o "DATE,ID"); "." = sin dato.
 */
export function parsearCsvFred(texto) {
  const lineas = String(texto).replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) throw new Error('CSV de FRED vacío');
  const cab = celdasCsv(lineas[0]).map((c) => c.trim().toUpperCase());
  if (!['DATE', 'OBSERVATION_DATE'].includes(cab[0]) || cab.length < 2) throw new Error('El CSV de FRED no tiene la cabecera esperada');
  const puntos = [];
  for (const l of lineas.slice(1)) {
    const [f, v] = celdasCsv(l);
    const ff = normalizarFecha(f); const n = Number(v);
    if (ff && v?.trim() !== '.' && v?.trim() !== '' && Number.isFinite(n)) puntos.push([ff, n]);
  }
  if (!puntos.length) throw new Error('El CSV de FRED no tiene observaciones');
  return ordenar(puntos);
}

const MESES_EN = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
/** CSV de la IADB del Banco de Inglaterra: "DATE,CODIGO" y fechas "24 Nov 2026". */
export function parsearCsvBoe(texto) {
  const lineas = String(texto).replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2 || !/^"?DATE"?\s*,/i.test(lineas[0])) throw new Error('El CSV del Banco de Inglaterra no tiene la cabecera esperada');
  const puntos = [];
  for (const l of lineas.slice(1)) {
    const [f, v] = celdasCsv(l);
    const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(String(f).trim());
    const n = Number(v);
    if (m && MESES_EN[m[2].toUpperCase()] && v?.trim() !== '' && Number.isFinite(n)) {
      puntos.push([`${m[3]}-${MESES_EN[m[2].toUpperCase()]}-${m[1].padStart(2, '0')}`, n]);
    }
  }
  if (!puntos.length) throw new Error('El CSV del Banco de Inglaterra no tiene observaciones');
  return ordenar(puntos);
}

/** Lector según el formato de la serie (bce-csv y sdmx-csv comparten TIME_PERIOD / OBS_VALUE). */
export function parsearSerie(formato, texto) {
  switch (formato) {
    case 'bce-csv': case 'sdmx-csv': return parsearCsvBce(texto);
    case 'bde-json': return parsearJsonBde(texto);
    case 'fred-csv': return parsearCsvFred(texto);
    case 'boe-csv': return parsearCsvBoe(texto);
    default: throw new Error(`Formato de serie desconocido: ${formato}`);
  }
}

function ordenar(puntos) {
  const m = new Map(puntos);
  return [...m].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** Contenido de datos/historicos.json. `resultados`: { serie, puntos? , error? } por serie. */
export function construirHistoricos(resultados, anteriores, ahora) {
  const previas = new Map((anteriores ?? []).map((s) => [s.id, s]));
  const series = resultados.map(({ serie, puntos, error }) => {
    const base = { id: serie.id, nombre: serie.nombre, tipo: serie.tipo, unidad: serie.unidad, etiqueta: serie.etiqueta, fuenteUrl: serie.url };
    for (const k of ['grupo', 'pais', 'plazo', 'derivada']) if (serie[k] !== undefined) base[k] = serie[k];
    if (!error) return { ...base, estado: 'ok', actualizado: ahora, puntos };
    const previa = previas.get(serie.id);
    if (previa?.puntos?.length) return { ...base, estado: 'error', error, actualizado: previa.actualizado ?? null, puntos: previa.puntos };
    return { ...base, estado: 'error', error, actualizado: null, puntos: [] };
  });
  return { generado: ahora, series };
}

/**
 * Primas de riesgo (P-023): diferencial en pb del bono de cada país frente al Bund, en las fechas
 * comunes. Se guardan como series de tipo 'tipo' con unidad "pb"… pero en puntos porcentuales,
 * para que Históricos y Proyecciones las traten igual que un tipo (variaciones en pb, modelo
 * aditivo). `resultados`: los de las series descargadas.
 */
export function resultadosPrimas(primas, resultados, diferencial) {
  const porId = new Map(resultados.map((r) => [r.serie.id, r]));
  return primas.map((p) => {
    const a = porId.get(p.de); const b = porId.get(p.frente);
    const serie = { id: p.id, nombre: p.nombre, tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', url: a?.serie?.url ?? '',
      grupo: 'renta-fija', pais: p.pais, derivada: 'prima', de: p.de, frente: p.frente };
    if (!a?.puntos || !b?.puntos) return { serie, error: 'Falta alguna de las dos series del diferencial' };
    const puntos = diferencial(a.puntos, b.puntos).map(([f, pb]) => [f, pb / 100]);
    return puntos.length ? { serie, puntos } : { serie, error: 'Sin fechas comunes' };
  });
}

/** ¿Hace falta descargar otra vez? Solo una vez al día (tarea diaria): si el último es de hoy, no. */
export function necesitaDescarga(anterior, ahora, ids = []) {
  if (!anterior?.generado) return true;
  if (ids.some((id) => !anterior.series?.some((s) => s.id === id))) return true; // serie nueva en la configuración
  if (anterior.series?.some((s) => s.estado !== 'ok')) return true;
  return anterior.generado.slice(0, 10) !== ahora.slice(0, 10);
}
