// Tests de la fase 6: revisión mensual (resumen) y mapa de conocimiento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { rangoMes, mesAnterior, fusionesDelMes, decisionesDelMes, pendientes, cuerpoRevision } from '../scripts/revision.js';
import { leerCatalogoPatrones, construirIndice } from '../scripts/indice.js';
import { grafo, disponer, vecinos, huecos, cruces } from '../web/js/lib/mapa.js';

const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// --- Revisión mensual ---
test('rangoMes y mesAnterior (cambio de año incluido)', () => {
  assert.deepEqual(rangoMes('2026-11'), { desde: '2026-11-01', hasta: '2026-12-01' });
  assert.deepEqual(rangoMes('2026-12'), { desde: '2026-12-01', hasta: '2027-01-01' });
  assert.throws(() => rangoMes('2026-13'));
  assert.equal(mesAnterior('2027-01-01T07:23:00Z'), '2026-12');
  assert.equal(mesAnterior('2026-12-01'), '2026-11');
});

test('fusionesDelMes: títulos «… (#N)» y «Merge pull request #N», solo del mes', () => {
  const log = [
    'aaa\t2026-12-02\tFase 6 — Aprendizaje (#7)',
    'bbb\t2026-11-24\tFase 1 — Operativa (#2)',
    'ccc\t2026-11-20\tMerge pull request #1 from x/y',
    'ddd\t2026-11-21\tCommit suelto sin PR',
    'eee\t2026-10-31\tAntigua (#0)',
  ].join('\n');
  assert.deepEqual(fusionesDelMes(log, '2026-11'), [
    { sha: 'ccc', fecha: '2026-11-20', pr: 1, titulo: 'Merge pull request #1 from x/y' },
    { sha: 'bbb', fecha: '2026-11-24', pr: 2, titulo: 'Fase 1 — Operativa' },
  ]);
});

test('decisionesDelMes lee los encabezados reales de decisiones.md', () => {
  const md = leer('../decisiones.md');
  const nov = decisionesDelMes(md, '2026-11');
  assert.ok(nov.length >= 24);
  assert.equal(nov[0].id, 'D-001');
  assert.deepEqual(decisionesDelMes('## D-100 · 2027-01-05 · Fase 6 · X\n', '2026-11'), []);
});

test('pendientes: cuenta la marca ⚠️ por archivo, de mayor a menor', () => {
  assert.deepEqual(pendientes([
    { ruta: 'a.md', texto: '⚠️ Pendiente de verificar x\n⚠️ Pendiente de verificar y' },
    { ruta: 'b.js', texto: 'nada' },
    { ruta: 'c.md', texto: '⚠️  Pendiente de verificar' },
  ]), [{ ruta: 'a.md', n: 2 }, { ruta: 'c.md', n: 1 }]);
});

test('cuerpoRevision: secciones, enlaces a PR y checklist', () => {
  const md = cuerpoRevision({
    mes: '2026-11', repo: 'dueño/repo',
    fusiones: [{ pr: 2, fecha: '2026-11-24', titulo: 'Fase 1' }],
    decisiones: [{ id: 'D-001', fecha: '2026-11-24', titulo: 'Algo' }],
    listaPendientes: [{ ruta: 'x.md', n: 1 }],
    huecos: { patronesSinFicha: ['P-010'], fichasSinCalculo: [], operacionesSinPatron: [] },
    totales: { fichas: 1, operaciones: 2, patrones: 3, decisiones: 4 },
  });
  assert.match(md, /^# Revisión mensual 2026-11/);
  assert.match(md, /\[#2\]\(https:\/\/github\.com\/dueño\/repo\/pull\/2\)/);
  for (const s of ['## 1.', '## 2.', '## 3.', '## 4.', '## 5.']) assert.ok(md.includes(s), s);
  assert.match(md, /P-010/);
  assert.match(md, /Haz la revisión mensual de 2026-11/);
});

test('existen el procedimiento, la plantilla de issue y el workflow mensual (sin claves)', () => {
  for (const p of ['../revisiones/README.md', '../.github/ISSUE_TEMPLATE/revision-mensual.md', '../.github/workflows/revision-mensual.yml']) {
    assert.ok(existsSync(new URL(p, import.meta.url)), p);
  }
  const wf = leer('../.github/workflows/revision-mensual.yml');
  assert.match(wf, /cron: '23 7 1 \* \*'/);
  assert.match(wf, /issues: write/);
  assert.ok(!/secrets\./.test(wf), 'no usa secretos');
});

// --- Mapa de conocimiento ---
test('leerCatalogoPatrones: id, nombre, funciones y operaciones que lo usan', () => {
  const p = leerCatalogoPatrones(leer('../patrones/README.md'));
  assert.ok(p.length >= 17);
  const p5 = p.find((x) => x.id === 'P-005');
  assert.ok(p5.funciones.includes('cuadroAmortizacion'));
  assert.ok(p5.operaciones.includes('prestamo-amortizacion'));
  assert.ok(p.find((x) => x.id === 'P-011').otros.includes('históricos'));
});

test('mapa: todas las relaciones de las fichas y del catálogo son aristas válidas', async () => {
  const indice = await construirIndice();
  const g = grafo(indice);
  const ids = new Set(g.nodos.map((n) => n.id));
  assert.equal(g.nodos.filter((n) => n.tipo === 'ficha').length, indice.fichas.length);
  assert.equal(g.nodos.filter((n) => n.tipo === 'operacion').length, indice.operaciones.length);
  for (const a of g.aristas) assert.ok(ids.has(a.de) && ids.has(a.a));
  for (const f of indice.fichas) {
    for (const p of f.patrones) assert.ok(g.aristas.some((a) => a.de === `ficha:${f.ruta}` && a.a === `patron:${p}`), `${f.ruta} → ${p}`);
    for (const o of f.operaciones) assert.ok(g.aristas.some((a) => a.de === `ficha:${f.ruta}` && a.a === `op:${o}`), `${f.ruta} → ${o}`);
  }
  assert.ok(vecinos(g.aristas, 'patron:P-005').has('op:prestamo-amortizacion'));
});

test('mapa: disposición determinista, dentro del lienzo, sin solapes y con menos cruces que sin ordenar', async () => {
  const g = grafo(await construirIndice());
  const a = disponer(g, { ancho: 1000 });
  const b = disponer(g, { ancho: 1000 });
  assert.deepEqual(a.nodos.map((n) => [n.id, n.x, n.y]), b.nodos.map((n) => [n.id, n.x, n.y]));
  for (const n of a.nodos) assert.ok(n.x > 0 && n.x < 1000 && n.y > 0 && n.y < a.alto, n.id);
  const porColumna = Object.groupBy(a.nodos, (n) => n.x);
  for (const lista of Object.values(porColumna)) {
    const ys = lista.map((n) => n.y).sort((p, q) => p - q);
    for (let k = 1; k < ys.length; k++) assert.ok(ys[k] - ys[k - 1] >= 20, 'nodos demasiado juntos');
  }
  assert.ok(cruces(a) < cruces(disponer(g, { ancho: 1000, iteraciones: 0 })));
  // Las fichas siguen agrupadas por categoría (de arriba abajo).
  const cats = a.nodos.filter((n) => n.tipo === 'ficha').sort((p, q) => p.y - q.y).map((n) => n.categoria);
  assert.deepEqual(cats, [...cats].sort((p, q) => ['fx', 'empresas', 'bolsa-inversion', 'real-estate', 'macroeconomia', 'tipos-interes'].indexOf(p) - ['fx', 'empresas', 'bolsa-inversion', 'real-estate', 'macroeconomia', 'tipos-interes'].indexOf(q)));
});

test('huecos: detecta patrones sin ficha, fichas sin cálculo y operaciones sin patrón', () => {
  const indice = {
    fichas: [{ ruta: 'a.md', titulo: 'A', categoria: 'fx', patrones: ['P-001'], operaciones: ['op1'] }, { ruta: 'b.md', titulo: 'B', categoria: 'fx', patrones: [], operaciones: [] }],
    operaciones: [{ id: 'op1', titulo: 'Op 1', categoria: 'fx' }],
    patrones: [{ id: 'P-001', nombre: 'Uno', operaciones: [], otros: [] }, { id: 'P-002', nombre: 'Dos', operaciones: [], otros: [] }],
  };
  assert.deepEqual(huecos(disponer(grafo(indice))), { patronesSinFicha: ['P-002'], fichasSinCalculo: ['B'], operacionesSinPatron: ['Op 1'] });
});
