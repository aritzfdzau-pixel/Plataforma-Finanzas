// Descarga las series oficiales de Históricos y escribe datos/historicos.json.
// Uso: node scripts/descargar-historicos.js <salida.json> [url-del-último-publicado]
// Corre en cada publicación (cada hora), pero solo descarga una vez al día: si el último
// archivo publicado es de hoy y todas las series estaban bien, lo reutiliza.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { SERIES_OFICIALES } from './series-oficiales.js';
import { parsearCsvBce, parsearJsonBde, construirHistoricos, necesitaDescarga } from './historicos.js';

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
if (!necesitaDescarga(anterior, ahora)) {
  datos = anterior;
  console.log(`Históricos: se reutiliza la descarga de hoy (${anterior.generado}).`);
} else {
  const resultados = [];
  for (const serie of SERIES_OFICIALES) {
    try {
      const texto = await descargar(serie.url);
      const puntos = serie.formato === 'bde-json' ? parsearJsonBde(texto) : parsearCsvBce(texto);
      console.log(`OK     ${serie.id}: ${puntos.length} observaciones (${puntos[0][0]} → ${puntos.at(-1)[0]})`);
      resultados.push({ serie, puntos });
    } catch (e) {
      const error = e.name === 'TimeoutError' ? 'Tiempo de espera agotado' : e.message;
      console.log(`::warning::Serie ${serie.id}: ${error}`);
      resultados.push({ serie, error });
    }
  }
  datos = construirHistoricos(resultados, anterior?.series, ahora);
}

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(datos) + '\n');
