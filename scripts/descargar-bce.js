// Descarga los tipos de referencia del BCE y escribe el JSON que publica la web.
// Uso (tarea programada de GitHub Actions, sin claves):
//   node scripts/descargar-bce.js <salida.json> [url-de-respaldo]
// Si el BCE no responde, intenta recuperar el último archivo publicado (url-de-respaldo)
// para no dejar la web sin datos; si tampoco puede, termina con error y la web lo indica.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { URL_BCE_90D, parsearXmlBce, construirDatosBce, validarDatosBce } from './bce.js';
import { tocaDescargaDiaria } from './horario.js';

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

// Dato diario (D-041): se descarga en la primera publicación a partir de las 08:00 de Madrid;
// el resto del día se reutiliza el último archivo publicado.
let publicado = null;
if (respaldo) {
  try { publicado = validarDatosBce(JSON.parse(await descargar(respaldo))); } catch { publicado = null; }
}
const ahora = new Date().toISOString();
if (publicado && !tocaDescargaDiaria(publicado.descargado, ahora)) {
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, JSON.stringify(publicado, null, 1) + '\n');
  console.log(`BCE: se reutiliza la descarga diaria de las 08:00 (${publicado.descargado}; tipos del ${publicado.fecha}).`);
  process.exit(0);
}

let datos;
try {
  datos = construirDatosBce(parsearXmlBce(await descargar(URL_BCE_90D)), ahora);
  console.log(`BCE: ${datos.tipos.length} divisas del ${datos.fecha} (anterior: ${datos.fechaAnterior}).`);
} catch (e) {
  console.error(`No se ha podido descargar el BCE: ${e.message}`);
  if (!respaldo) process.exit(1);
  try {
    datos = publicado ?? validarDatosBce(JSON.parse(await descargar(respaldo)));
    console.log(`Se reutiliza el último archivo publicado (${datos.fecha}).`);
  } catch (e2) {
    console.error(`Tampoco hay respaldo: ${e2.message}`);
    process.exit(1);
  }
}

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(datos, null, 1) + '\n');
