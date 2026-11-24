// Coherencia entre fichas, operaciones, patrones e índice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { construirIndice, rutasFichas, RAIZ } from '../scripts/indice.js';
import { leerFicha } from '../web/js/lib/frontmatter.js';
import { OPERACIONES, cargarOperacion } from '../operativa/operaciones/indice.js';
import { CATEGORIAS } from '../web/js/lib/categorias.js';

const CAMPOS = ['titulo', 'idioma', 'traduccion', 'categoria', 'etiquetas', 'operaciones',
  'patrones', 'fecha_creacion', 'ultima_revision', 'fuentes'];
const SECCIONES = ['Qué es', 'Para qué se usa', 'Cómo funciona', 'Fórmulas', 'Ejemplo resuelto',
  'Ventajas e inconvenientes', 'Riesgos', 'Operaciones relacionadas', 'Fuentes'];
const catalogo = readFileSync(join(RAIZ, 'patrones/README.md'), 'utf8');

test('conocimiento/indice.json está al día (ejecuta node scripts/generar-indice.js)', async () => {
  const guardado = JSON.parse(readFileSync(join(RAIZ, 'conocimiento/indice.json'), 'utf8'));
  assert.deepEqual(guardado, await construirIndice());
});

for (const ruta of rutasFichas()) {
  test(`ficha ${ruta}: cabecera, secciones y referencias`, () => {
    const md = readFileSync(join(RAIZ, ruta), 'utf8');
    const { cabecera, cuerpo } = leerFicha(md);
    for (const c of CAMPOS) assert.ok(c in cabecera, `falta el campo ${c}`);
    assert.ok(['es', 'en'].includes(cabecera.idioma));
    assert.ok(CATEGORIAS.some((c) => c.slug === cabecera.categoria));
    assert.ok(ruta.startsWith(`conocimiento/${cabecera.categoria}/`), 'la carpeta debe coincidir con la categoría');
    assert.match(cabecera.fecha_creacion, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(cabecera.ultima_revision, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(cabecera.fuentes.length > 0, 'debe citar fuentes');
    const h2 = [...cuerpo.matchAll(/^## (.+)$/gm)].map((x) => x[1].trim());
    assert.deepEqual(h2, SECCIONES);
    for (const p of cabecera.patrones) assert.ok(catalogo.includes(`| ${p} |`), `patrón ${p} no registrado en el catálogo`);
    for (const op of cabecera.operaciones) {
      assert.ok(OPERACIONES.includes(op), `operación ${op} sin módulo`);
      assert.ok(cuerpo.includes(`(#op=${op})`), `la ficha debe enlazar a #op=${op}`);
    }
    if (cabecera.traduccion) assert.ok(rutasFichas().some((r) => r.endsWith(cabecera.traduccion.replace(/^\.\//, ''))));
  });
}

test('cada operación la genera exactamente una ficha y apunta a ella', async () => {
  const fichas = rutasFichas().map((r) => ({ r, c: leerFicha(readFileSync(join(RAIZ, r), 'utf8')).cabecera }));
  for (const id of OPERACIONES) {
    const duenas = fichas.filter((f) => f.c.operaciones.includes(id));
    assert.equal(duenas.length, 1, `${id}: fichas que la generan = ${duenas.length}`);
    const op = await cargarOperacion(id);
    assert.equal(op.ficha, duenas[0].r);
    assert.equal(op.categoria, duenas[0].c.categoria);
  }
});

test('los patrones del catálogo apuntan a funciones existentes de la librería', async () => {
  // P-001…P-009 en la librería financiera; P-010 en scripts/bce.js (tarea programada).
  const lib = { ...(await import('../operativa/lib/finanzas.js')), ...(await import('../scripts/bce.js')) };
  const filas = catalogo.split('\n').filter((l) => /^\| P-\d{3} \|/.test(l));
  assert.ok(filas.length >= 9);
  for (const f of filas) {
    const funciones = f.split('|')[3].match(/`(\w+)`/g).map((x) => x.slice(1, -1));
    for (const fn of funciones) assert.equal(typeof lib[fn], 'function', `${fn} no existe`);
  }
});

test('ninguna ficha contiene marcadores de privacidad prohibidos', () => {
  for (const ruta of rutasFichas()) {
    const md = readFileSync(join(RAIZ, ruta), 'utf8').toLowerCase();
    for (const p of ['cliente real', 'confidencial', 'uso interno']) assert.ok(!md.includes(p), `${ruta}: «${p}»`);
  }
});
