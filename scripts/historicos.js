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

/** Divide una línea CSV respetando comillas dobles. */
export function celdasCsv(linea) {
  const out = [];
  let actual = '', comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i++; } else if (c === '"') comillas = false; else actual += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { out.push(actual); actual = ''; } else actual += c;
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
  if (lineas.length < 2) throw new Error('CSV del BCE vacío');
  const cab = celdasCsv(lineas[0]).map((c) => c.trim().toUpperCase());
  const iF = cab.indexOf('TIME_PERIOD');
  const iV = cab.indexOf('OBS_VALUE');
  if (iF < 0 || iV < 0) throw new Error('El CSV del BCE no tiene TIME_PERIOD y OBS_VALUE');
  const puntos = [];
  for (const l of lineas.slice(1)) {
    const c = celdasCsv(l);
    const f = normalizarFecha(c[iF]);
    const v = Number(c[iV]);
    if (f && c[iV]?.trim() !== '' && Number.isFinite(v)) puntos.push([f, v]);
  }
  if (!puntos.length) throw new Error('El CSV del BCE no tiene observaciones');
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

function ordenar(puntos) {
  const m = new Map(puntos);
  return [...m].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** Contenido de datos/historicos.json. `resultados`: { serie, puntos? , error? } por serie. */
export function construirHistoricos(resultados, anteriores, ahora) {
  const previas = new Map((anteriores ?? []).map((s) => [s.id, s]));
  const series = resultados.map(({ serie, puntos, error }) => {
    const base = { id: serie.id, nombre: serie.nombre, tipo: serie.tipo, unidad: serie.unidad, etiqueta: serie.etiqueta, fuenteUrl: serie.url };
    if (!error) return { ...base, estado: 'ok', actualizado: ahora, puntos };
    const previa = previas.get(serie.id);
    if (previa?.puntos?.length) return { ...base, estado: 'error', error, actualizado: previa.actualizado ?? null, puntos: previa.puntos };
    return { ...base, estado: 'error', error, actualizado: null, puntos: [] };
  });
  return { generado: ahora, series };
}

/** ¿Hace falta descargar otra vez? Solo una vez al día (tarea diaria): si el último es de hoy, no. */
export function necesitaDescarga(anterior, ahora) {
  if (!anterior?.generado) return true;
  if (anterior.series?.some((s) => s.estado !== 'ok')) return true;
  return anterior.generado.slice(0, 10) !== ahora.slice(0, 10);
}
