// Fase 8 — Renta variable y renta fija: estructura, widgets, composición, series oficiales.
// Muestras de series en tests/fixtures/ inventadas (formato de cada fuente, valores ficticios).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INDICES, gruposIndices, indicePorId, PAISES_RF, LINEA_RF, seriePorCodigo, ultimoYCambio, curvaPais,
  validarComposicion, composicionDesfasada, elementosBusqueda, destinoDeRuta, ETIQUETA_TR, ETIQUETA_RETRASO,
} from '../web/js/lib/mercados.js';
import { urlWidget, configMapaCalor, configGrafico, configGrupos, ORIGEN } from '../web/js/componentes/tradingview.js';
import { parsearCsvBce, parsearCsvBoe, parsearCsvFred, parsearSerie, resultadosPrimas, necesitaDescarga } from '../scripts/historicos.js';
import { SERIES_OFICIALES, PRIMAS_RIESGO } from '../scripts/series-oficiales.js';
import { serieDiferencial, validarFrenteAPaseoAleatorio } from '../operativa/lib/finanzas.js';
import { leerRuta } from '../web/js/ui/rutas.js';
import { cuerpoRevision } from '../scripts/revision.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const fixture = (n) => readFileSync(join(RAIZ, 'tests/fixtures', n), 'utf8');
const COMPOSICION = JSON.parse(leer('conocimiento/mercados/composicion-indices.json'));

// --- Estructura ---------------------------------------------------------------
test('la zona de Renta variable y renta fija va justo debajo de Divisas (HTML y rejilla)', () => {
  const html = leer('web/index.html');
  const zonas = [...html.matchAll(/<section class="zona zona--([a-z]+)"/g)].map((m) => m[1]);
  assert.equal(zonas[zonas.indexOf('divisas') + 1], 'mercados');
  assert.match(html, /<dialog id="panel-mercados" class="panel"/);
  assert.match(html, /Equities &amp; Fixed income/);
  const css = leer('web/css/layout.css');
  const filas = [...css.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim().split(/\s+/));
  const k = filas.findIndex((f) => f.includes('divisas'));
  assert.equal(filas[k + 1][filas[k].indexOf('divisas')], 'mercados', 'escritorio: mercados bajo divisas');
  const movil = filas.slice(filas.findIndex((f, i) => i > k + 1 && f.length === 1 && f[0] === 'topbar'));
  assert.equal(movil[movil.findIndex((f) => f[0] === 'divisas') + 1][0], 'mercados', 'móvil: apilada tras divisas');
});

test('los iframes nuevos solo se crean con el componente aislado (sandbox) y del dominio permitido por la CSP', () => {
  const archivos = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? archivos(p) : [p]; });
  for (const f of archivos(join(RAIZ, 'web')).filter((p) => extname(p) === '.js')) {
    if (f.endsWith('componentes/tradingview.js')) continue;
    assert.ok(!/createElement\(\s*['"]iframe/.test(readFileSync(f, 'utf8')), `iframe fuera del componente: ${f}`);
  }
  const tv = leer('web/js/componentes/tradingview.js');
  assert.match(tv, /setAttribute\('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'\)/);
  for (const [tipo, conf] of [['stock-heatmap', configMapaCalor('SPX500', 'dark')], ['symbol-overview', configGrafico('BME:SAN', 'Santander', 'dark')],
    ['market-quotes', configGrupos(gruposIndices(), 'dark')]]) {
    const u = new URL(urlWidget(tipo, conf));
    assert.equal(u.origin, ORIGEN); // el único de frame-src
    assert.ok(u.hash.length > 1 && !u.search.includes('symbol'), 'configuración en el fragmento');
  }
  const csp = /frame-src ([^;]+);/.exec(leer('web/index.html'))[1].trim();
  assert.equal(csp, ORIGEN);
});

// --- Índices y símbolos (módulo único de configuración) --------------------------------
test('índices: los 9 pedidos, con símbolo, etiqueta válida y tipo de símbolo; grupos por mercado', () => {
  assert.deepEqual(INDICES.map((i) => i.id).sort(), ['CAC40', 'DAX40', 'DJI', 'IBEX35', 'NDX', 'NI225', 'SPX', 'SX5E', 'UKX']);
  for (const i of INDICES) {
    assert.match(i.simbolo, /^[A-Z]+:[A-Z0-9]+$/, i.id);
    assert.ok([ETIQUETA_TR, ETIQUETA_RETRASO].includes(i.etiqueta), i.id);
    assert.ok(i.tipoSimbolo);
  }
  assert.equal(gruposIndices().flatMap((g) => g.simbolos).length, 9);
  assert.equal(indicePorId('ibex35').nombre, 'IBEX 35');
  // Ningún otro archivo de la web elige símbolos de índices (configuración centralizada).
  assert.ok(!/FOREXCOM:|BME:IBC|INDEX:DEU40/.test(leer('web/js/ui/mercados.js')));
});

// --- Composición ------------------------------------------------------------------
test('composición de índices: JSON válido, sin duplicados, con fecha y fuente pública por índice', () => {
  assert.deepEqual(validarComposicion(COMPOSICION), []);
  const n = Object.fromEntries(COMPOSICION.indices.map((i) => [i.id, i.valores.length]));
  assert.deepEqual(n, { IBEX35: 35, DAX40: 40, SX5E: 50, CAC40: 40, SPX: 30, NDX: 30, DJI: 30, UKX: 30 });
  for (const id of ['SPX', 'NDX', 'UKX']) assert.equal(COMPOSICION.indices.find((i) => i.id === id).completa, false);
  assert.ok(validarComposicion({ indices: [{ id: 'X', fecha_composicion: '2026-01-01', fuente: 'f', fuente_url: 'https://x',
    valores: [{ nombre: 'A', ticker: 'A', tv: 'BME:A', sector: 's' }, { nombre: 'A', ticker: 'A', tv: 'BME:A', sector: 's' }] }] })
    .some((e) => e.includes('duplicado')));
  assert.ok(validarComposicion({ indices: [{ id: 'X', valores: [] }] }).length >= 2);
});

test('composición desfasada: avisa si la fecha tiene más de 3 meses (y el resumen mensual lo incluye)', () => {
  const j = { indices: [{ id: 'A', nombre: 'A', fecha_composicion: '2026-08-24' }, { id: 'B', nombre: 'B', fecha_composicion: '2026-08-26' }] };
  assert.deepEqual(composicionDesfasada(j, '2026-11-25').map((x) => x.id), ['A']);
  const md = cuerpoRevision({ mes: '2026-11', repo: '', fusiones: [], decisiones: [], listaPendientes: [], huecos: {}, composicion: [{ id: 'A', nombre: 'Índice A', fecha: '2026-08-24' }] });
  assert.match(md, /Composición de índices[\s\S]*Índice A \(A\): composición del 2026-08-24/);
});

// --- Series oficiales de renta fija -----------------------------------------------------------
test('lectores: SDMX-CSV del Bundesbank («;»), IADB del Banco de Inglaterra y FRED (muestras inventadas)', () => {
  assert.deepEqual(parsearCsvBce(fixture('bundesbank-sdmx.csv')), [['2026-01-05', 2.61], ['2026-01-06', 2.63], ['2026-01-08', 2.66]]);
  assert.deepEqual(parsearCsvBoe(fixture('boe-iadb.csv')), [['2026-01-05', 4.4012], ['2026-01-06', 4.4213], ['2026-01-08', 4.45]]);
  assert.deepEqual(parsearCsvFred(fixture('fred.csv')), [['2026-01-05', 4.1], ['2026-01-06', 4.12], ['2026-01-08', 4.15]]);
  assert.deepEqual(parsearSerie('sdmx-csv', fixture('bundesbank-sdmx.csv')).length, 3);
  assert.throws(() => parsearCsvBoe('<html>error</html>'), /cabecera/);
  assert.throws(() => parsearCsvFred('DATE,DGS10\n2026-01-01,.'), /observaciones/);
  assert.throws(() => parsearSerie('xml', ''), /desconocido/);
});

test('series de renta fija: rentabilidades (tipo "tipo", %) de fuentes oficiales; primas derivadas con P-023', () => {
  const rf = SERIES_OFICIALES.filter((s) => s.grupo === 'renta-fija');
  assert.ok(rf.length >= 18);
  for (const s of rf) {
    assert.equal(s.tipo, 'tipo', `${s.id}: es una rentabilidad (se analiza en pb), no un precio`);
    assert.equal(s.unidad, '%');
    assert.ok(['ES', 'DE', 'FR', 'IT', 'GB', 'US', 'EA'].includes(s.pais));
  }
  for (const p of PAISES_RF) for (const id of [...Object.values(p.plazos), p.prima].filter(Boolean)) {
    assert.ok([...SERIES_OFICIALES, ...PRIMAS_RIESGO].some((s) => s.id === id), `serie ${id} sin configurar`);
  }
  const a = { serie: { id: 'es10y-m', url: 'https://x' }, puntos: [['2026-09-01', 4], ['2026-10-01', 4.066]] };
  const b = { serie: { id: 'de10y-m' }, puntos: [['2026-10-01', 3.416]] };
  const [es, it] = resultadosPrimas(PRIMAS_RIESGO.slice(0, 2), [a, b], serieDiferencial);
  assert.deepEqual(es.puntos, [['2026-10-01', 0.65]]); // 65 pb en puntos porcentuales (LibreOffice: rf_prima_es)
  assert.equal(es.serie.tipo, 'tipo');
  assert.match(it.error, /Falta/);
  // Una serie nueva en la configuración obliga a descargar aunque ya se descargara hoy.
  const hoy = '2026-11-25T08:00:00Z';
  assert.equal(necesitaDescarga({ generado: hoy, series: [{ id: 'a', estado: 'ok' }] }, hoy, ['a']), false);
  assert.equal(necesitaDescarga({ generado: hoy, series: [{ id: 'a', estado: 'ok' }] }, hoy, ['a', 'b']), true);
});

test('modelo aditivo para rentabilidades: la validación proyecta niveles en pb, no logaritmos', () => {
  // Rentabilidades que cruzan 0 %: el modelo log no podría (log de negativos); el aditivo sí.
  const valores = Array.from({ length: 60 }, (_, k) => 0.5 - k * 0.02);
  const v = validarFrenteAPaseoAleatorio(valores, { horizonte: 5, ventana: 20, modelo: 'aditivo', conTendencia: false });
  assert.ok(Number.isFinite(v.rmseModelo));
  assert.throws(() => validarFrenteAPaseoAleatorio(valores, { horizonte: 5, ventana: 20, modelo: 'log', conTendencia: false }));
  assert.match(leer('web/js/ui/proyecciones.js'), /serie\.tipo === 'tipo' \? 'aditivo' : 'log'/);
});

// --- Línea de la portada, curva y rutas ------------------------------------------------------
test('línea de renta fija: 10 años de ES, DE, GB y US y prima ES–DE; cambios en pb con ▲▼ desde el código', () => {
  assert.deepEqual(LINEA_RF.map((x) => x.codigo), ['ES10Y', 'DE10Y', 'GB10Y', 'US10Y', 'PRIMA-ES']);
  const u = ultimoYCambio({ puntos: [['2026-11-20', 3.30], ['2026-11-21', 3.335]] });
  assert.equal(u.cambioPb, 3.5); // por definición: (3,335 − 3,30) × 100
  const c = curvaPais([{ id: 'de2y', puntos: [['2026-11-25', 3.03]] }, { id: 'de10y', puntos: [['2026-11-25', 3.30]] }], 'DE');
  assert.equal(c.pendientePb, 27);
  assert.equal(curvaPais([], 'XX'), null);
});

test('rutas #rv y #rf, códigos de bonos y búsqueda de índices, valores y bonos', () => {
  assert.deepEqual(leerRuta('#rv=IBEX35&valor=SAN'), { tipo: 'rv', indice: 'IBEX35', valor: 'SAN' });
  assert.deepEqual(leerRuta('#rf=ES10Y'), { tipo: 'rf', codigo: 'ES10Y' });
  assert.deepEqual(destinoDeRuta({ tipo: 'rv', indice: 'ibex35', valor: 'SAN' }), { pestana: 'componentes', indice: 'IBEX35', valor: 'SAN' });
  assert.deepEqual(destinoDeRuta({ tipo: 'rv', indice: null }), { pestana: 'indices' });
  assert.deepEqual(destinoDeRuta({ tipo: 'rf', codigo: 'DE10Y' }), { pestana: 'renta-fija', pais: 'DE', serie: 'de10y' });
  assert.equal(destinoDeRuta({ tipo: 'rf', codigo: 'PRIMA-IT' }).pais, 'IT');
  assert.equal(seriePorCodigo('US30Y'), 'us30y');
  assert.equal(seriePorCodigo('ES2Y'), null);
  const el = elementosBusqueda(COMPOSICION);
  assert.ok(el.some((e) => e.hash === '#rv=IBEX35&valor=ITX'));
  assert.ok(el.some((e) => e.hash === '#rv=NI225'));
  assert.ok(el.some((e) => e.hash === '#rf=ES10Y'));
  assert.ok(el.every((e) => e.categoria === 'bolsa-inversion'));
});
