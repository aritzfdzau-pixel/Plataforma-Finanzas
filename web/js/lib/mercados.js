// Renta variable y renta fija (fase 8): configuración editable de símbolos e índices y
// funciones puras (sin DOM). Es el ÚNICO sitio donde se eligen los símbolos de los widgets
// (D-037): para cambiar uno basta con editar este archivo.
//
// Etiquetas (AGENTS §7):
// - "tiempo real (indicativo)": CFD o índice de TradingView que el widget gratuito sirve en tiempo real.
// - "con retraso": índice oficial de la bolsa, que los widgets gratuitos sirven con demora.
// Si el símbolo oficial no se muestra en el widget, se usa una alternativa (CFD o índice de
// TradingView) y se dice en `tipoSimbolo`. ⚠️ Pendiente de verificar en la web publicada:
// desde el entorno de desarrollo no se llega a TradingView (D-028, D-037).
import { diferencialPb } from '../../../operativa/lib/finanzas.js';

export const ETIQUETA_TR = 'tiempo real (indicativo)';
export const ETIQUETA_RETRASO = 'con retraso';

/**
 * Índices de la zona. `simbolo`: el que usa el widget; `oficial`: el del índice en su bolsa;
 * `mapaCalor`: dataSource del widget de mapa de calor (null si no lo admite).
 */
export const INDICES = Object.freeze([
  { id: 'SPX', nombre: 'S&P 500', mercado: 'EE. UU.', simbolo: 'FOREXCOM:SPXUSD', oficial: 'SP:SPX', tipoSimbolo: 'CFD sobre el índice (FOREX.com)', etiqueta: ETIQUETA_TR, mapaCalor: 'SPX500' },
  { id: 'NDX', nombre: 'Nasdaq 100', mercado: 'EE. UU.', simbolo: 'FOREXCOM:NSXUSD', oficial: 'NASDAQ:NDX', tipoSimbolo: 'CFD sobre el índice (FOREX.com)', etiqueta: ETIQUETA_TR, mapaCalor: 'NASDAQ100' },
  { id: 'DJI', nombre: 'Dow Jones', mercado: 'EE. UU.', simbolo: 'FOREXCOM:DJI', oficial: 'DJ:DJI', tipoSimbolo: 'CFD sobre el índice (FOREX.com)', etiqueta: ETIQUETA_TR, mapaCalor: 'DJDJI' },
  { id: 'IBEX35', nombre: 'IBEX 35', mercado: 'España', simbolo: 'BME:IBC', oficial: 'BME:IBC', tipoSimbolo: 'índice oficial (BME)', etiqueta: ETIQUETA_RETRASO, mapaCalor: 'IBEX35', alternativa: 'TVC:IBEX35' },
  { id: 'UKX', nombre: 'FTSE 100', mercado: 'Reino Unido', simbolo: 'FOREXCOM:UKXGBP', oficial: 'TVC:UKX', tipoSimbolo: 'CFD sobre el índice (FOREX.com)', etiqueta: ETIQUETA_TR, mapaCalor: 'UK100' },
  { id: 'DAX40', nombre: 'DAX 40', mercado: 'Alemania', simbolo: 'INDEX:DEU40', oficial: 'XETR:DAX', tipoSimbolo: 'índice de TradingView que replica el DAX', etiqueta: ETIQUETA_TR, mapaCalor: 'DAX' },
  { id: 'SX5E', nombre: 'Euro Stoxx 50', mercado: 'Zona euro', simbolo: 'TVC:SX5E', oficial: 'STOXX:SX5E', tipoSimbolo: 'índice de TradingView (TVC)', etiqueta: ETIQUETA_RETRASO, mapaCalor: 'SX5E' },
  { id: 'CAC40', nombre: 'CAC 40', mercado: 'Francia', simbolo: 'EURONEXT:PX1', oficial: 'EURONEXT:PX1', tipoSimbolo: 'índice oficial (Euronext)', etiqueta: ETIQUETA_RETRASO, mapaCalor: 'CAC40', alternativa: 'TVC:CAC40' },
  { id: 'NI225', nombre: 'Nikkei 225', mercado: 'Japón', simbolo: 'INDEX:NKY', oficial: 'TVC:NI225', tipoSimbolo: 'índice de TradingView que replica el Nikkei', etiqueta: ETIQUETA_TR, mapaCalor: null },
]);

/** Mercados en el orden de la tabla del panel. */
export const MERCADOS = ['EE. UU.', 'España', 'Reino Unido', 'Alemania', 'Zona euro', 'Francia', 'Japón'];

export const indicePorId = (id) => INDICES.find((i) => i.id === String(id ?? '').toUpperCase()) ?? null;

/** Grupos para el widget de cotizaciones, por mercado. */
export function gruposIndices() {
  return MERCADOS.map((m) => ({
    nombre: m,
    simbolos: INDICES.filter((i) => i.mercado === m).map((i) => ({ simbolo: i.simbolo, nombre: i.nombre })),
  })).filter((g) => g.simbolos.length);
}

// --- Renta fija soberana ----------------------------------------------------
// Series de datos/historicos.json (scripts/series-oficiales.js). Rentabilidad (yield) en %.
export const PAISES_RF = Object.freeze([
  { codigo: 'ES', nombre: 'España', plazos: { 10: 'es10y-m' }, prima: 'prima-es', nota: 'Solo 10 años (media mensual del BCE): no hay curva diaria oficial sin clave (D-036).' },
  { codigo: 'DE', nombre: 'Alemania', plazos: { 2: 'de2y', 5: 'de5y', 10: 'de10y', 30: 'de30y' }, prima: null, nota: 'Curva del Bundesbank (valores federales cotizados), diaria. El Bund es la referencia de las primas.' },
  { codigo: 'FR', nombre: 'Francia', plazos: { 10: 'fr10y-m' }, prima: 'prima-fr', nota: 'Solo 10 años (media mensual del BCE).' },
  { codigo: 'IT', nombre: 'Italia', plazos: { 10: 'it10y-m' }, prima: 'prima-it', nota: 'Solo 10 años (media mensual del BCE).' },
  { codigo: 'GB', nombre: 'Reino Unido', plazos: { 5: 'gb5y', 10: 'gb10y' }, prima: null, nota: 'Rentabilidades a la par del Banco de Inglaterra, diarias.' },
  { codigo: 'US', nombre: 'EE. UU.', plazos: { 2: 'us2y', 5: 'us5y', 10: 'us10y', 30: 'us30y' }, prima: null, nota: 'Treasury a vencimiento constante (Reserva Federal, FRED), diaria.' },
  { codigo: 'EA', nombre: 'Zona euro (curva AAA)', plazos: { 2: 'eaaaa2y', 5: 'eaaaa5y', 10: 'eaaaa10y', 30: 'eaaaa30y' }, prima: null, nota: 'Curva cupón cero de los bonos AAA del área del euro (BCE), diaria.' },
]);

/** Línea compacta de la portada: bono a 10 años de ES, DE, GB y US y prima ES–DE. */
export const LINEA_RF = Object.freeze([
  { codigo: 'ES10Y', nombre: 'España 10a', serie: 'es10y-m' },
  { codigo: 'DE10Y', nombre: 'Alemania 10a', serie: 'de10y' },
  { codigo: 'GB10Y', nombre: 'R. Unido 10a', serie: 'gb10y' },
  { codigo: 'US10Y', nombre: 'EE. UU. 10a', serie: 'us10y' },
  { codigo: 'PRIMA-ES', nombre: 'Prima ES–DE', serie: 'prima-es', enPb: true },
]);

/** Código de ruta (#rf=ES10Y) → id de serie; también admite PRIMA-ES, PRIMA-IT, PRIMA-FR. */
export function seriePorCodigo(codigo) {
  const c = String(codigo ?? '').toUpperCase();
  const m = /^PRIMA-(ES|IT|FR)$/.exec(c);
  if (m) return `prima-${m[1].toLowerCase()}`;
  const b = /^([A-Z]{2})(\d{1,2})Y$/.exec(c);
  if (!b) return null;
  return PAISES_RF.find((p) => p.codigo === b[1])?.plazos[Number(b[2])] ?? null;
}

/** Último dato de una serie y su cambio en pb frente al anterior (rentabilidades en %). */
export function ultimoYCambio(serie) {
  const p = serie?.puntos ?? [];
  if (!p.length) return null;
  const [fecha, valor] = p.at(-1);
  const cambioPb = p.length > 1 ? diferencialPb(valor, p.at(-2)[1]) : null; // P-023
  return { fecha, valor, cambioPb, fechaAnterior: p.length > 1 ? p.at(-2)[0] : null };
}

/** Curva de un país: [{ plazo, id, valor, fecha }] y pendiente 10a–2a en pb si hay ambos. */
export function curvaPais(series, codigo) {
  const pais = PAISES_RF.find((p) => p.codigo === codigo);
  if (!pais) return null;
  const porId = new Map((series ?? []).map((s) => [s.id, s]));
  const puntos = Object.entries(pais.plazos).map(([plazo, id]) => {
    const u = ultimoYCambio(porId.get(id));
    return { plazo: Number(plazo), id, valor: u?.valor ?? null, fecha: u?.fecha ?? null, cambioPb: u?.cambioPb ?? null };
  }).sort((a, b) => a.plazo - b.plazo);
  const p2 = puntos.find((x) => x.plazo === 2); const p10 = puntos.find((x) => x.plazo === 10);
  const pendientePb = p2?.valor != null && p10?.valor != null && p2.fecha === p10.fecha ? diferencialPb(p10.valor, p2.valor) : null;
  return { pais, puntos, pendientePb };
}

// --- Composición de índices -----------------------------------------------------
/** Errores de validación del JSON de composición (vacío si es válido). */
export function validarComposicion(json) {
  const errores = [];
  if (!Array.isArray(json?.indices)) return ['Falta la lista "indices"'];
  const ids = new Set();
  for (const ind of json.indices) {
    const et = ind?.id ?? '(sin id)';
    if (!ind?.id || ids.has(ind.id)) errores.push(`${et}: id vacío o repetido`);
    ids.add(ind?.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ind?.fecha_composicion ?? '')) errores.push(`${et}: falta fecha_composicion (AAAA-MM-DD)`);
    if (!ind?.fuente || !/^https:\/\//.test(ind?.fuente_url ?? '')) errores.push(`${et}: falta la fuente pública (fuente y fuente_url https)`);
    if (!Array.isArray(ind?.valores) || !ind.valores.length) { errores.push(`${et}: sin valores`); continue; }
    const vistos = new Set();
    for (const v of ind.valores) {
      if (!v?.nombre || !v?.ticker || !v?.sector || !/^[A-Z_]+:[A-Z0-9._]+$/.test(v?.tv ?? '')) errores.push(`${et}: valor incompleto ${JSON.stringify(v)}`);
      if (vistos.has(v?.tv)) errores.push(`${et}: valor duplicado ${v?.tv}`);
      vistos.add(v?.tv);
    }
  }
  return errores;
}

/** Índices cuya fecha de composición tiene más de `meses` meses respecto a `hoy` (ISO). */
export function composicionDesfasada(json, hoy, meses = 3) {
  const limite = new Date(`${String(hoy).slice(0, 10)}T00:00:00Z`);
  limite.setUTCMonth(limite.getUTCMonth() - meses);
  const corte = limite.toISOString().slice(0, 10);
  return (json?.indices ?? []).filter((i) => !i.fecha_composicion || i.fecha_composicion < corte)
    .map((i) => ({ id: i.id, nombre: i.nombre, fecha: i.fecha_composicion ?? null }));
}

/** Elementos para la barra de comandos («/»): índices, valores y bonos. */
export function elementosBusqueda(composicion) {
  const indices = INDICES.map((i) => ({
    titulo: `${i.nombre} (índice)`, descripcion: `${i.mercado} · renta variable`, categoria: 'bolsa-inversion',
    tipo: 'Índice', hash: `#rv=${i.id}`, etiquetas: [i.id, i.mercado, 'equities'],
  }));
  const valores = (composicion?.indices ?? []).flatMap((ind) => ind.valores.map((v) => ({
    titulo: `${v.nombre} (${v.ticker}) · ${ind.nombre}`, descripcion: `${ind.nombre} · ${v.sector}`, categoria: 'bolsa-inversion',
    tipo: 'Valor', hash: `#rv=${ind.id}&valor=${encodeURIComponent(v.ticker)}`, etiquetas: [v.ticker, ind.nombre, v.sector],
  })));
  const bonos = PAISES_RF.flatMap((p) => Object.keys(p.plazos).map((n) => ({
    titulo: `${p.nombre} ${n} años (yield)`, descripcion: 'Renta fija soberana', categoria: 'bolsa-inversion',
    tipo: 'Bono', hash: `#rf=${p.codigo}${n}Y`, etiquetas: ['bono', 'fixed income', `${p.codigo}${n}Y`],
  })));
  // Varios índices comparten valores (p. ej. Santander en el IBEX 35 y el Euro Stoxx 50): se dejan los dos.
  return [...indices, ...valores, ...bonos];
}

/** Traduce la ruta (#rv=… / #rf=…) a un destino del panel. */
export function destinoDeRuta(ruta) {
  if (ruta.tipo === 'rv') {
    if (!ruta.indice) return { pestana: 'indices' };
    return { pestana: 'componentes', indice: ruta.indice.toUpperCase(), valor: ruta.valor ?? null };
  }
  if (ruta.tipo === 'rf') {
    const serie = seriePorCodigo(ruta.codigo);
    const pais = /^PRIMA-/i.test(ruta.codigo ?? '') ? String(ruta.codigo).slice(6).toUpperCase() : String(ruta.codigo ?? '').slice(0, 2).toUpperCase();
    return { pestana: 'renta-fija', pais: PAISES_RF.some((p) => p.codigo === pais) ? pais : 'ES', serie };
  }
  return null;
}
