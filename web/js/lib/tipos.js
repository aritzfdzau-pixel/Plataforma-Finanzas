// Zona «Tipos de interés (Interest rates)» de la portada (D-044). Módulo puro (sin DOM).
// Datos: series oficiales de datos/historicos.json (BCE, Banco de España, Reserva Federal,
// Banco de Inglaterra). Ningún cálculo con IA: solo último dato, cambio en pb y fecha de vigencia.
import { diferencialPb } from '../../../operativa/lib/finanzas.js';

/** Bloques de la zona. `rango` une dos series en un intervalo (objetivo de la Fed). */
export const BLOQUES_TIPOS = Object.freeze([
  { id: 'bancos-centrales', titulo: 'Bancos centrales (tipos oficiales)', oficial: true, filas: [
    { serie: 'dfr', nombre: 'BCE · Facilidad de depósito (DFR)' },
    { serie: 'mro', nombre: 'BCE · Operaciones principales (MRO)' },
    { serie: 'mlf', nombre: 'BCE · Facilidad marginal de crédito (MLF)' },
    { serie: 'fed-sup', inferior: 'fed-inf', nombre: 'Reserva Federal · Fondos federales (objetivo)' },
    { serie: 'boe-bank-rate', nombre: 'Banco de Inglaterra · Bank Rate' },
  ] },
  { id: 'monetario', titulo: 'Mercado monetario', oficial: false, filas: [
    { serie: 'estr', nombre: '€STR (a un día)' },
    { serie: 'euribor-1m', nombre: 'Euribor 1 mes', mensual: true },
    { serie: 'euribor-3m', nombre: 'Euribor 3 meses', mensual: true },
    { serie: 'euribor-6m', nombre: 'Euribor 6 meses', mensual: true },
    { serie: 'euribor-12m', nombre: 'Euribor 12 meses (índice hipotecario oficial)', mensual: true },
    { serie: 'sofr', nombre: 'SOFR (dólar, a un día)' },
    { serie: 'sonia', nombre: 'SONIA (libra, a un día)' },
  ] },
]);

/**
 * Último dato de una serie de tipos, su cambio en pb frente a la observación anterior y, para
 * los tipos oficiales, desde cuándo está vigente el nivel actual y cuál era el anterior.
 * @returns {{ fecha, valor, cambioPb, vigenteDesde, anterior, cambioUltimoPb } | null}
 */
export function resumenTipo(serie) {
  const p = serie?.puntos ?? [];
  if (!p.length) return null;
  const [fecha, valor] = p.at(-1);
  let k = p.length - 1;
  while (k > 0 && p[k - 1][1] === valor) k--;
  const anterior = k > 0 ? p[k - 1][1] : null;
  return {
    fecha, valor,
    cambioPb: p.length > 1 ? diferencialPb(valor, p.at(-2)[1]) : null, // P-023
    vigenteDesde: k > 0 ? p[k][0] : null, // null: igual en toda la serie descargada
    anterior,
    cambioUltimoPb: anterior === null ? null : diferencialPb(valor, anterior),
  };
}

/** Filas listas para pintar: [{ bloque, filas: [{ nombre, serie, etiqueta, resumen, inferior }] }]. */
export function filasTipos(series) {
  const porId = new Map((series ?? []).map((s) => [s.id, s]));
  return BLOQUES_TIPOS.map((b) => ({
    ...b,
    filas: b.filas.map((f) => {
      const s = porId.get(f.serie);
      return { ...f, etiqueta: s?.etiqueta ?? null, resumen: resumenTipo(s), resumenInferior: f.inferior ? resumenTipo(porId.get(f.inferior)) : null };
    }),
  }));
}
