// Descarga los tipos de referencia del BCE y escribe el JSON que publica la web.
// Uso (tarea programada de GitHub Actions, sin claves):
//   node scripts/descargar-bce.js <salida.json> [url-de-respaldo]
// Si el BCE no responde, intenta recuperar el último archivo publicado (url-de-respaldo)
// para no dejar la web sin datos; si tampoco puede, termina con error y la web lo indica.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { URL_BCE_90D, parsearXmlBce, construirDatosBce, validarDatosBce } from './bce.js';

const [salida, respaldo] = process.argv.slice(2);
if (!salida) {
  console.error('Uso: node scripts/descargar-bce.js <salida.json> [url-de-respaldo]');
  process.exit(2);
}

async function descargar(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'terminal-financiero-estudio (GitHub Actions)' }, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.text();
}

let datos;
try {
  datos = construirDatosBce(parsearXmlBce(await descargar(URL_BCE_90D)), new Date().toISOString());
  console.log(`BCE: ${datos.tipos.length} divisas del ${datos.fecha} (anterior: ${datos.fechaAnterior}).`);
} catch (e) {
  console.error(`No se ha podido descargar el BCE: ${e.message}`);
  if (!respaldo) process.exit(1);
  try {
    datos = validarDatosBce(JSON.parse(await descargar(respaldo)));
    console.log(`Se reutiliza el último archivo publicado (${datos.fecha}).`);
  } catch (e2) {
    console.error(`Tampoco hay respaldo: ${e2.message}`);
    process.exit(1);
  }
}

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(datos, null, 1) + '\n');
