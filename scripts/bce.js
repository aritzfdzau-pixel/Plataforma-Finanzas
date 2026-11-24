// Tipos de cambio de referencia del euro publicados por el BCE.
// Funciones puras (sin red ni disco): las usa scripts/descargar-bce.js y las prueban los tests.
//
// Formato de origen (XML público del BCE, eurofxref-hist-90d.xml / eurofxref-daily.xml):
//   <Cube><Cube time="AAAA-MM-DD"><Cube currency="USD" rate="1.0850"/>…</Cube>…</Cube>
// El tipo se expresa en unidades de divisa por 1 EUR.

export const URL_BCE_90D = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';
export const URL_BCE_PAGINA = 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.es.html';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DIVISA = /^[A-Z]{3}$/;

/**
 * Lee el XML del BCE y devuelve los días ordenados del más reciente al más antiguo.
 * @returns {Array<{fecha: string, tipos: Record<string, number>}>}
 */
export function parsearXmlBce(xml) {
  if (typeof xml !== 'string' || !xml.includes('Cube')) throw new Error('El XML no tiene el formato del BCE');
  const dias = [];
  // Cada bloque de día: <Cube time="…"> … </Cube> (los tipos son <Cube …/> autocerrados).
  for (const m of xml.matchAll(/<Cube\s+time=["']([^"']+)["']\s*>([\s\S]*?)<\/Cube>/g)) {
    const fecha = m[1];
    if (!FECHA.test(fecha)) throw new Error(`Fecha no válida en el XML del BCE: ${fecha}`);
    const tipos = {};
    for (const t of m[2].matchAll(/<Cube\s+currency=["']([^"']+)["']\s+rate=["']([^"']+)["']\s*\/>/g)) {
      const [, divisa, texto] = t;
      const tipo = Number(texto);
      if (!DIVISA.test(divisa) || !Number.isFinite(tipo) || tipo <= 0) {
        throw new Error(`Tipo no válido en el XML del BCE: ${divisa}=${texto}`);
      }
      tipos[divisa] = tipo;
    }
    if (Object.keys(tipos).length === 0) throw new Error(`Día sin tipos en el XML del BCE: ${fecha}`);
    dias.push({ fecha, tipos });
  }
  if (dias.length === 0) throw new Error('El XML del BCE no contiene ningún día');
  return dias.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

/** Variación relativa entre dos tipos (hoy / anterior − 1). null si falta el anterior. */
export function variacionRelativa(hoy, anterior) {
  if (!Number.isFinite(anterior) || anterior <= 0) return null;
  return hoy / anterior - 1;
}

/**
 * Construye el contenido de datos/tipos-bce.json a partir de los días leídos.
 * @param {Array<{fecha: string, tipos: Record<string, number>}>} dias  Más reciente primero.
 * @param {string} descargado  Marca de tiempo ISO de la descarga.
 */
export function construirDatosBce(dias, descargado) {
  if (!Array.isArray(dias) || dias.length === 0) throw new Error('No hay días del BCE');
  const [hoy, anterior] = dias;
  const tipos = Object.entries(hoy.tipos)
    .map(([divisa, tipo]) => {
      const previo = anterior?.tipos[divisa] ?? null;
      return { divisa, tipo, anterior: previo, variacion: variacionRelativa(tipo, previo) };
    })
    .sort((a, b) => a.divisa.localeCompare(b.divisa));
  return {
    fuente: 'Banco Central Europeo — tipos de cambio de referencia del euro',
    url: URL_BCE_PAGINA,
    etiqueta: 'referencia BCE',
    unidades: 'Unidades de divisa por 1 EUR',
    fecha: hoy.fecha,
    fechaAnterior: anterior?.fecha ?? null,
    descargado,
    tipos,
  };
}

/** Comprueba que un objeto tiene la forma de datos/tipos-bce.json (para el respaldo). */
export function validarDatosBce(d) {
  if (!d || d.etiqueta !== 'referencia BCE' || !FECHA.test(d.fecha) || !Array.isArray(d.tipos) || d.tipos.length === 0) {
    throw new Error('Datos BCE con formato no válido');
  }
  for (const t of d.tipos) {
    if (!DIVISA.test(t.divisa) || !Number.isFinite(t.tipo) || t.tipo <= 0) throw new Error(`Tipo no válido: ${t.divisa}`);
  }
  return d;
}
