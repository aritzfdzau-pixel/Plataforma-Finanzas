import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

test('existen los archivos y carpetas base', () => {
  for (const p of [
    'AGENTS.md', 'CLAUDE.md', 'PLAN.md', 'decisiones.md', 'package.json',
    'conocimiento/_plantilla.md', 'conocimiento/fx', 'conocimiento/empresas',
    'conocimiento/bolsa-inversion', 'conocimiento/real-estate',
    'patrones/README.md', 'operativa/lib', 'operativa/operaciones', 'operativa/tests',
    'datos', 'web/index.html', 'web/css/tokens.css',
    '.github/workflows/tests.yml', '.github/workflows/pages.yml',
    '.github/pull_request_template.md',
  ]) {
    assert.ok(existsSync(join(RAIZ, p)), `falta ${p}`);
  }
});

test('CLAUDE.md remite a AGENTS.md', () => {
  assert.equal(leer('CLAUDE.md').trim(), 'Sigue AGENTS.md');
});

test('package.json no declara dependencias', () => {
  const pkg = JSON.parse(leer('package.json'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.type, 'module');
});

test('PLAN.md lista las fases 0 a 6 con un estado válido', () => {
  const plan = leer('PLAN.md');
  const estados = ['Pendiente', 'En curso', 'En revisión', 'Cerrada'];
  for (let n = 0; n <= 6; n++) {
    const fila = plan.split('\n').find((l) => l.startsWith(`| ${n} |`));
    assert.ok(fila, `falta la fase ${n} en la tabla`);
    assert.ok(estados.some((e) => fila.includes(`| ${e} |`)), `estado no válido en fase ${n}`);
  }
});

// --- Plantilla de ficha ---
const CAMPOS = ['titulo', 'idioma', 'traduccion', 'categoria', 'etiquetas', 'operaciones',
  'patrones', 'fecha_creacion', 'ultima_revision', 'fuentes'];
const SECCIONES = ['Qué es', 'Para qué se usa', 'Cómo funciona', 'Fórmulas', 'Ejemplo resuelto',
  'Ventajas e inconvenientes', 'Riesgos', 'Operaciones relacionadas', 'Fuentes'];

test('la plantilla de ficha tiene todos los campos de cabecera', () => {
  const md = leer('conocimiento/_plantilla.md');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  assert.ok(m, 'falta la cabecera YAML');
  const claves = m[1].split('\n').map((l) => /^([a-z_]+):/.exec(l)?.[1]).filter(Boolean);
  assert.deepEqual(claves, CAMPOS);
});

test('la plantilla de ficha tiene las secciones en orden', () => {
  const md = leer('conocimiento/_plantilla.md');
  const h2 = [...md.matchAll(/^## (.+)$/gm)].map((x) => x[1].trim());
  assert.deepEqual(h2, SECCIONES);
});

// --- Sin recursos externos en la web (única excepción futura: componente TradingView) ---
function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : [p];
  });
}

test('la web no carga recursos externos (sin CDN ni scripts de terceros)', () => {
  const web = join(RAIZ, 'web');
  const externos = /(src|href)\s*=\s*["']\s*(https?:)?\/\/|url\(\s*["']?\s*(https?:)?\/\/|@import\s+["']?(https?:)?\/\/|from\s+["'](https?:)?\/\/|import\(\s*["'](https?:)?\/\//i;
  for (const f of archivos(web).filter((p) => ['.html', '.css', '.js'].includes(extname(p)))) {
    assert.ok(!externos.test(readFileSync(f, 'utf8')), `recurso externo en ${f}`);
  }
});

test('ningún CSS salvo tokens.css usa colores literales', () => {
  const dir = join(RAIZ, 'web/css');
  for (const n of readdirSync(dir).filter((x) => x.endsWith('.css') && x !== 'tokens.css')) {
    const css = readFileSync(join(dir, n), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(css), `color literal en ${n}`);
  }
});

test('las fuentes alojadas llevan su licencia', () => {
  const dir = join(RAIZ, 'web/fuentes');
  const f = readdirSync(dir);
  assert.ok(f.some((x) => x.endsWith('.woff2')));
  assert.ok(f.includes('LICENSE-Inter.txt') && f.includes('LICENSE-JetBrainsMono.txt'));
});
