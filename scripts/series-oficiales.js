// Series oficiales que descarga la tarea diaria de Históricos (fase 4). Sin claves.
// tipo: 'tipo' (tipo de interés en %, se analiza en variaciones en pb) o 'precio' (tipo de cambio).
//
// BCE — API del Portal de Datos del BCE (formato csvdata, documentado en
//   https://data.ecb.europa.eu/help/api/data). lastNObservations limita el tamaño (~3 años hábiles).
// Banco de España — API de estadísticas (BIEST): D_1NBAF472 = Euribor a un año, media mensual.
//   Comprobado el 2026-11-24 desde GitHub Actions: octubre de 2026 = 3,239 %, el dato oficial
//   publicado (D-026). La tarea publica el estado de cada serie.

const BCE = (clave) => `https://data-api.ecb.europa.eu/service/data/${clave}?format=csvdata&lastNObservations=780`;

export const SERIES_OFICIALES = Object.freeze([
  { id: 'dfr', nombre: 'Facilidad de depósito del BCE (DFR)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.DFR.LEV') },
  { id: 'mro', nombre: 'Operaciones principales de financiación del BCE (MRO)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.MRR_FR.LEV') },
  { id: 'mlf', nombre: 'Facilidad marginal de crédito del BCE (MLF)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.MLFR.LEV') },
  { id: 'estr', nombre: '€STR (tipo a un día del euro)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EST/B.EU000A2X2A25.WT') },
  { id: 'euribor-12m', nombre: 'Euribor a un año, media mensual (índice oficial hipotecario)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia Banco de España', formato: 'bde-json', url: 'https://app.bde.es/bierest/resources/srdatosapp/listaSeries?idioma=es&series=D_1NBAF472&rango=60M' },
  { id: 'eurusd', nombre: 'EUR/USD (tipo de referencia BCE)', tipo: 'precio', unidad: 'USD por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.USD.EUR.SP00.A') },
  { id: 'eurgbp', nombre: 'EUR/GBP (tipo de referencia BCE)', tipo: 'precio', unidad: 'GBP por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.GBP.EUR.SP00.A') },
  { id: 'eurjpy', nombre: 'EUR/JPY (tipo de referencia BCE)', tipo: 'precio', unidad: 'JPY por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.JPY.EUR.SP00.A') },
]);
