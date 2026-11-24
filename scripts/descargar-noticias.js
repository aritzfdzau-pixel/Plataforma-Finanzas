// Descarga los feeds RSS de noticias y escribe el JSON que publica la web.
// Uso (tarea programada de GitHub Actions, sin claves):
//   node scripts/descargar-noticias.js <salida.json> [url-del-último-publicado]
// Si un feed falla, se registra y se sigue con el resto. Los titulares del último archivo
// publicado se conservan (hasta 7 días) para no perderlos si una fuente cae un rato.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parsearFeed } from './rss.js';
import { leerPalabrasClave, construirNoticias } from './noticias.js';
import { FUENTES_NOTICIAS } from './fuentes-noticias.js';

const [salida, respaldo] = process.argv.slice(2);
if (!salida) {
  console.error('Uso: node scripts/descargar-noticias.js <salida.json> [url-del-último-publicado]');
  process.exit(2);
}

const CABECERAS = { 'User-Agent': 'terminal-financiero-estudio (GitHub Actions; lector RSS)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' };
async function descargar(url) {
  const r = await fetch(url, { headers: CABECERAS, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const palabras = leerPalabrasClave(readFileSync(new URL('../decisiones.md', import.meta.url), 'utf8'));
const ahora = new Date().toISOString();

const resultados = await Promise.all(FUENTES_NOTICIAS.map(async (feed) => {
  try {
    const items = parsearFeed(await descargar(feed.url));
    console.log(`OK     ${feed.id}: ${items.length} titulares`);
    return { feed, items };
  } catch (e) {
    const error = e.name === 'TimeoutError' ? 'Tiempo de espera agotado' : e.message;
    console.log(`::warning::Feed ${feed.id} (${feed.url}): ${error}`);
    return { feed, error };
  }
}));

let anteriores = [];
if (respaldo) {
  try {
    const previo = JSON.parse(await descargar(respaldo));
    if (Array.isArray(previo.noticias)) anteriores = previo.noticias;
  } catch (e) {
    console.log(`Sin archivo anterior (${e.message}); se empieza de cero.`);
  }
}

const datos = construirNoticias(resultados, anteriores, palabras, ahora);
for (const f of datos.fuentes) if (f.estado === 'sin-noticias-recientes') console.log(`::warning::Feed ${f.id}: sin noticias en los últimos 30 días`);
console.log(`Noticias: ${datos.noticias.length} titulares; feeds correctos: ${datos.fuentes.filter((f) => f.estado === 'ok').length}/${datos.fuentes.length}.`);

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(datos, null, 1) + '\n');
