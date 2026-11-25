// Descarga las series oficiales de Históricos y escribe datos/historicos.json.
// Uso: node scripts/descargar-historicos.js <salida.json> [url-del-último-publicado]
// Corre en cada publicación (cada hora), pero solo descarga una vez al día: si el último
// archivo publicado es de hoy y todas las series estaban bien, lo reutiliza.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { SERIES_OFICIALES, PRIMAS_RIESGO } from './series-oficiales.js';
import { parsearSerie, construirHistoricos, necesitaDescarga, resultadosPrimas } from './historicos.js';
import { serieDiferencial } from '../operativa/lib/finanzas.js';

const [salida, respaldo] = process.argv.slice(2);
if (!salida) { console.error('Uso: node scripts/descargar-historicos.js <salida.json> [url]'); process.exit(2); }

const CABECERAS = { 'User-Agent': 'terminal-financiero-estudio (GitHub Actions)', Accept: 'text/csv, application/json, */*' };
async function descargar(url) {
  const r = await fetch(url, { headers: CABECERAS, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const ahora = new Date().toISOString();
let anterior = null;
if (respaldo) {
  try { anterior = JSON.parse(await descargar(respaldo)); } catch (e) { console.log(`Sin archivo anterior (${e.message}).`); }
}

let datos;
if (!necesitaDescarga(anterior, ahora, [...SERIES_OFICIALES, ...PRIMAS_RIESGO].map((s) => s.id))) {
  datos = anterior;
  console.log(`Históricos: se reutiliza la descarga de hoy (${anterior.generado}).`);
} else {
  const resultados = [];
  for (const serie of SERIES_OFICIALES) {
    try {
      const texto = await descargar(serie.url);
      let puntos;
      try { puntos = parsearSerie(serie.formato, texto); } catch (e) { throw new Error(`${e.message} · inicio de la respuesta: ${JSON.stringify(texto.slice(0, 160))}`); }
      console.log(`OK     ${serie.id}: ${puntos.length} observaciones (${puntos[0][0]} → ${puntos.at(-1)[0]})`);
      resultados.push({ serie, puntos });
    } catch (e) {
      const error = e.name === 'TimeoutError' ? 'Tiempo de espera agotado' : e.message;
      console.log(`::warning::Serie ${serie.id}: ${error}`);
      resultados.push({ serie, error });
    }
  }
  resultados.push(...resultadosPrimas(PRIMAS_RIESGO, resultados, serieDiferencial));
  datos = construirHistoricos(resultados, anterior?.series, ahora);
}

// Último dato de cada serie en el registro de Actions (para contrastarlo con la fuente oficial).
for (const s of datos.series) {
  const u = s.puntos?.at(-1);
  console.log(`Último ${s.id}: ${u ? `${u[1]} ${s.unidad ?? ''} (${u[0]})` : 'sin datos'}`);
}

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(datos) + '\n');
