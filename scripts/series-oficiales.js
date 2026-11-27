// Series oficiales que descarga la tarea diaria de Históricos (fase 4). Sin claves.
// tipo: 'tipo' (tipo de interés en %, se analiza en variaciones en pb) o 'precio' (tipo de cambio).
//
// BCE — API del Portal de Datos del BCE (formato csvdata, documentado en
//   https://data.ecb.europa.eu/help/api/data). lastNObservations limita el tamaño (~3 años hábiles).
// Banco de España — API de estadísticas (BIEST): D_1NBAF472 = Euribor a un año, media mensual.
//   Comprobado el 2026-11-24 desde GitHub Actions: octubre de 2026 = 3,239 %, el dato oficial
//   publicado (D-026). La tarea publica el estado de cada serie.

const BCE = (clave) => `https://data-api.ecb.europa.eu/service/data/${clave}?format=csvdata&lastNObservations=780`;

// --- Renta fija soberana (fase 8, D-036). Solo fuentes oficiales, gratuitas y sin clave. ---
// Rentabilidades (yield) en %, nunca precios. tipo 'tipo' → se analizan en variaciones en pb y
// las Proyecciones usan el modelo aditivo.
// Bundesbank — API SDMX (formato SDMX-CSV con TIME_PERIOD y OBS_VALUE): estructura temporal de
//   tipos de los valores federales cotizados (método Svensson), vencimiento residual N años.
// Banco de Inglaterra — IADB, CSV: rentabilidades nominales a la par (par yields), diarias.
// Reserva Federal (FRED, Fed de San Luis) — fredgraph.csv sin clave: rentabilidades a vencimiento
//   constante del Tesoro de EE. UU. (H.15). Dato público del Tesoro.
// BCE — curva AAA del área del euro (YC, diaria) y tipos a largo plazo por país (IRS, criterio
//   de convergencia, media mensual del bono a 10 años).
const BBK = (plazo) => `https://api.statistiken.bundesbank.de/rest/data/BBSIS/D.I.ZST.ZI.EUR.S1311.B.A604.R${plazo}XX.R.A.A._Z._Z.A?format=sdmx_csv&lastNObservations=780`;
const hace3Anios = () => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - 3); return d; };
const MESES_BOE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BOE = (codigo) => {
  const d = hace3Anios();
  const desde = `${String(d.getUTCDate()).padStart(2, '0')}/${MESES_BOE[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
  return `https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=${desde}&Dateto=now&SeriesCodes=${codigo}&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N`;
};
const FRED = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${hace3Anios().toISOString().slice(0, 10)}`;
const ETQ_OFICIAL = (org) => `referencia oficial (${org})`;
const bono = (id, pais, plazo, nombre, etiqueta, formato, url, extra = {}) => ({
  id, nombre, tipo: 'tipo', unidad: '%', etiqueta, formato, url, grupo: 'renta-fija', pais, plazo, ...extra,
});

export const SERIES_OFICIALES = Object.freeze([
  { id: 'dfr', nombre: 'Facilidad de depósito del BCE (DFR)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.DFR.LEV') },
  { id: 'mro', nombre: 'Operaciones principales de financiación del BCE (MRO)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.MRR_FR.LEV') },
  { id: 'mlf', nombre: 'Facilidad marginal de crédito del BCE (MLF)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('FM/B.U2.EUR.4F.KR.MLFR.LEV') },
  { id: 'estr', nombre: '€STR (tipo a un día del euro)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EST/B.EU000A2X2A25.WT') },
  { id: 'euribor-12m', nombre: 'Euribor a un año, media mensual (índice oficial hipotecario)', tipo: 'tipo', unidad: '%', etiqueta: 'referencia Banco de España', formato: 'bde-json', url: 'https://app.bde.es/bierest/resources/srdatosapp/listaSeries?idioma=es&series=D_1NBAF472&rango=60M' },
  // --- Tipos de interés (D-044): Euribor por plazos (media mensual, BCE), bancos centrales y
  // tipos a un día de EE. UU. y Reino Unido. Sin claves. Comprobado el 2026-11-27 desde GitHub
  // Actions: las 10 series descargan; Euribor 12m del BCE (oct. 2026) = 3,2386 %, igual que el
  // índice oficial del Banco de España (3,239 %).
  ...[['1m', '1 mes', 'EURIBOR1MD_'], ['3m', '3 meses', 'EURIBOR3MD_'], ['6m', '6 meses', 'EURIBOR6MD_'], ['12m-bce', '12 meses', 'EURIBOR1YD_']].map(([id, plazo, clave]) =>
    ({ id: `euribor-${id}`, nombre: `Euribor a ${plazo}, media mensual (BCE)`, tipo: 'tipo', unidad: '%', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE(`FM/M.U2.EUR.RT.MM.${clave}.HSTA`), grupo: 'monetario' })),
  { id: 'fed-sup', nombre: 'Fondos federales de la Reserva Federal, límite superior del objetivo', tipo: 'tipo', unidad: '%', etiqueta: ETQ_OFICIAL('Reserva Federal'), formato: 'fred-csv', url: FRED('DFEDTARU'), grupo: 'monetario' },
  { id: 'fed-inf', nombre: 'Fondos federales de la Reserva Federal, límite inferior del objetivo', tipo: 'tipo', unidad: '%', etiqueta: ETQ_OFICIAL('Reserva Federal'), formato: 'fred-csv', url: FRED('DFEDTARL'), grupo: 'monetario' },
  { id: 'sofr', nombre: 'SOFR (tipo a un día garantizado del dólar)', tipo: 'tipo', unidad: '%', etiqueta: ETQ_OFICIAL('Reserva Federal'), formato: 'fred-csv', url: FRED('SOFR'), grupo: 'monetario' },
  { id: 'boe-bank-rate', nombre: 'Bank Rate del Banco de Inglaterra', tipo: 'tipo', unidad: '%', etiqueta: ETQ_OFICIAL('Banco de Inglaterra'), formato: 'boe-csv', url: BOE('IUDBEDR'), grupo: 'monetario' },
  { id: 'sonia', nombre: 'SONIA (tipo a un día de la libra)', tipo: 'tipo', unidad: '%', etiqueta: ETQ_OFICIAL('Banco de Inglaterra'), formato: 'boe-csv', url: BOE('IUDSOIA'), grupo: 'monetario' },
  { id: 'eurusd', nombre: 'EUR/USD (tipo de referencia BCE)', tipo: 'precio', unidad: 'USD por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.USD.EUR.SP00.A') },
  { id: 'eurgbp', nombre: 'EUR/GBP (tipo de referencia BCE)', tipo: 'precio', unidad: 'GBP por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.GBP.EUR.SP00.A') },
  { id: 'eurjpy', nombre: 'EUR/JPY (tipo de referencia BCE)', tipo: 'precio', unidad: 'JPY por EUR', etiqueta: 'referencia BCE', formato: 'bce-csv', url: BCE('EXR/D.JPY.EUR.SP00.A') },
  // Alemania (Bund) — Bundesbank, diaria.
  ...[2, 5, 10, 30].map((n) => bono(`de${n}y`, 'DE', n, `Alemania ${n} años (Bund, yield)`, ETQ_OFICIAL('Bundesbank'), 'sdmx-csv', BBK(String(n).padStart(2, '0')))),
  // Reino Unido (Gilt) — Banco de Inglaterra, diaria. ⚠️ Pendiente de verificar los códigos IADB.
  bono('gb5y', 'GB', 5, 'Reino Unido 5 años (Gilt, par yield)', ETQ_OFICIAL('Banco de Inglaterra'), 'boe-csv', BOE('IUDSNPY')),
  bono('gb10y', 'GB', 10, 'Reino Unido 10 años (Gilt, par yield)', ETQ_OFICIAL('Banco de Inglaterra'), 'boe-csv', BOE('IUDMNPY')),
  // EE. UU. (Treasury) — Reserva Federal (FRED), diaria.
  ...[2, 5, 10, 30].map((n) => bono(`us${n}y`, 'US', n, `EE. UU. ${n} años (Treasury, yield)`, ETQ_OFICIAL('Reserva Federal'), 'fred-csv', FRED(`DGS${n}`))),
  // Zona euro, curva AAA — BCE, diaria (tipo cupón cero, Svensson).
  ...[2, 5, 10, 30].map((n) => bono(`eaaaa${n}y`, 'EA', n, `Zona euro AAA ${n} años (curva BCE, cupón cero)`, 'referencia BCE', 'bce-csv', BCE(`YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_${n}Y`))),
  // Bono a 10 años por país — BCE (IRS, media mensual): base común para las primas de riesgo.
  ...[['ES', 'España'], ['DE', 'Alemania'], ['FR', 'Francia'], ['IT', 'Italia']].map(([c, n]) =>
    bono(`${c.toLowerCase()}10y-m`, c, 10, `${n} 10 años (media mensual, BCE)`, 'referencia BCE', 'bce-csv', BCE(`IRS/M.${c}.L.L40.CI.0000.EUR.N.Z`))),
]);

// Primas de riesgo frente al Bund (P-023): diferencial del bono a 10 años en pb, misma fuente y
// frecuencia (BCE, mensual). Se calculan al descargar y se guardan como series propias.
export const PRIMAS_RIESGO = Object.freeze([
  { id: 'prima-es', pais: 'ES', nombre: 'Prima de riesgo España–Alemania (10 años)', de: 'es10y-m', frente: 'de10y-m' },
  { id: 'prima-it', pais: 'IT', nombre: 'Prima de riesgo Italia–Alemania (10 años)', de: 'it10y-m', frente: 'de10y-m' },
  { id: 'prima-fr', pais: 'FR', nombre: 'Prima de riesgo Francia–Alemania (10 años)', de: 'fr10y-m', frente: 'de10y-m' },
]);
