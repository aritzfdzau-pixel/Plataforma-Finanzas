// Tests de la fase 4: series oficiales (lectura BCE / Banco de España), CSV del usuario,
// estadísticos de series y escalas de las gráficas. Muestras inventadas en tests/fixtures/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsearCsvBce, parsearJsonBde, construirHistoricos, necesitaDescarga, normalizarFecha, celdasCsv } from '../scripts/historicos.js';
import { SERIES_OFICIALES } from '../scripts/series-oficiales.js';
import { leerCsvSerie, leerFecha, periodosPorAnio, alinear, analizar, correlacionSeries, desde, mediasMoviles } from '../web/js/lib/series.js';
import { pasoRedondo, marcasY, marcasX, indiceCercano, submuestrear, decimalesDePaso } from '../web/js/lib/escalas.js';
import * as F from '../operativa/lib/finanzas.js';

const REF = JSON.parse(readFileSync(new URL('../operativa/tests/referencias/referencias.json', import.meta.url), 'utf8')).valores;
const cerca = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) <= Math.max(Math.abs(b) * tol, 1e-12), `obtenido ${a}, esperado ${b}`);

// --- Series oficiales ---
test('parsearCsvBce: TIME_PERIOD y OBS_VALUE, comillas con comas, sin vacíos y ordenado', () => {
  const p = parsearCsvBce(readFileSync(new URL('./fixtures/bce-serie.csv', import.meta.url), 'utf8'));
  assert.deepEqual(p, [['2026-11-18', 2], ['2026-11-19', 2], ['2026-11-20', 1.75]]);
  assert.throws(() => parsearCsvBce('a,b\n1,2'));
  assert.throws(() => parsearCsvBce(''));
  assert.deepEqual(celdasCsv('a,"b,c",d'), ['a', 'b,c', 'd']);
});

test('parsearJsonBde: las dos formas descritas (fechas/valores o fechaValor/valor), orden ascendente', () => {
  const a = parsearJsonBde([{ serie: 'D_1NBAF472', fechas: ['2026-10-01T08:00:00', '2026-09-01T08:00:00'], valores: [2.2, 2.17] }]);
  assert.deepEqual(a, [['2026-09-01', 2.17], ['2026-10-01', 2.2]]);
  const b = parsearJsonBde(JSON.stringify([{ fechaValor: '2026-10', valor: 2.2 }]));
  assert.deepEqual(b, [['2026-10-01', 2.2]]);
  assert.throws(() => parsearJsonBde({ errNum: 412 }));
  assert.equal(normalizarFecha('2026-11'), '2026-11-01');
  assert.equal(normalizarFecha('2026-11-24T08:00:00'), '2026-11-24');
  assert.equal(normalizarFecha('nov 2026'), null);
});

test('construirHistoricos: una serie caída conserva los datos anteriores y queda marcada', () => {
  const [dfr, estr] = SERIES_OFICIALES;
  const d = construirHistoricos([
    { serie: dfr, puntos: [['2026-11-20', 2]] },
    { serie: estr, error: 'HTTP 500' },
  ], [{ id: estr.id, actualizado: '2026-11-23T10:00:00Z', puntos: [['2026-11-20', 1.92]] }], '2026-11-24T10:00:00Z');
  assert.equal(d.series[0].estado, 'ok');
  assert.equal(d.series[1].estado, 'error');
  assert.deepEqual(d.series[1].puntos, [['2026-11-20', 1.92]]);
  assert.equal(d.series[1].etiqueta, 'referencia BCE');
});

test('necesitaDescarga: una vez al día a partir de las 08:00 de Madrid (D-041), salvo series con error', () => {
  assert.equal(necesitaDescarga(null, '2026-11-24T10:00:00Z'), true);
  // 08:00 de Madrid en invierno = 07:00 UTC.
  assert.equal(necesitaDescarga({ generado: '2026-11-24T07:01:00Z', series: [{ estado: 'ok' }] }, '2026-11-24T10:00:00Z'), false);
  assert.equal(necesitaDescarga({ generado: '2026-11-24T02:00:00Z', series: [{ estado: 'ok' }] }, '2026-11-24T10:00:00Z'), true);
  assert.equal(necesitaDescarga({ generado: '2026-11-23T22:00:00Z', series: [{ estado: 'ok' }] }, '2026-11-24T06:45:00Z'), false);
  assert.equal(necesitaDescarga({ generado: '2026-11-24T07:01:00Z', series: [{ estado: 'error' }] }, '2026-11-24T10:00:00Z'), true);
});

test('series oficiales configuradas: las del plan (tipos BCE, €STR, Euribor medio BdE) con etiqueta y https', () => {
  const ids = SERIES_OFICIALES.map((s) => s.id);
  for (const id of ['dfr', 'mro', 'mlf', 'estr', 'euribor-12m']) assert.ok(ids.includes(id), id);
  for (const s of SERIES_OFICIALES) {
    // Solo organismos oficiales (fase 8 añade Bundesbank, Banco de Inglaterra y FRED, D-036).
    assert.match(s.url, /^https:\/\/(data-api\.ecb\.europa\.eu|app\.bde\.es|api\.statistiken\.bundesbank\.de|www\.bankofengland\.co\.uk|fred\.stlouisfed\.org)\//);
    assert.ok(['referencia BCE', 'referencia Banco de España'].includes(s.etiqueta) || /^referencia oficial \(.+\)$/.test(s.etiqueta), s.etiqueta);
    assert.ok(['tipo', 'precio'].includes(s.tipo));
  }
  assert.equal(SERIES_OFICIALES.find((s) => s.id === 'euribor-12m').etiqueta, 'referencia Banco de España');
});

// --- CSV del usuario ---
test('leerFecha: formatos admitidos y fechas imposibles', () => {
  assert.equal(leerFecha('24/11/2026'), '2026-11-24');
  assert.equal(leerFecha('2026-11-24'), '2026-11-24');
  assert.equal(leerFecha('2026/1/5'), '2026-01-05');
  assert.equal(leerFecha('"5-1-2026"'), '2026-01-05');
  assert.equal(leerFecha('31/02/2026'), null);
  assert.equal(leerFecha('Fecha'), null);
});

test('leerCsvSerie: formato español sin cabecera (fecha;valor con coma decimal)', () => {
  const r = leerCsvSerie('03/01/2026;1.234,50\n02/01/2026;1.230,00\n05/01/2026;1.240,25\n', 'mi-serie.csv');
  assert.equal(r.nombre, 'mi-serie');
  assert.deepEqual(r.puntos, [['2026-01-02', 1230], ['2026-01-03', 1234.5], ['2026-01-05', 1240.25]]);
});

test('leerCsvSerie: exportación con cabecera Date,…,Close,Adj Close (punto decimal) y filas nulas', () => {
  const csv = 'Date,Open,High,Low,Close,Adj Close,Volume\n2026-01-02,10,11,9,10.5,10.4,100\n2026-01-03,null,null,null,null,null,0\n2026-01-05,10.5,11,10,10.8,10.7,120\n2026-01-06,10.8,11,10,11.0,10.9,90\n';
  const r = leerCsvSerie(csv, 'accion.csv');
  assert.equal(r.nombre, 'accion (Adj Close)');
  assert.deepEqual(r.puntos.map((p) => p[1]), [10.4, 10.7, 10.9]);
  assert.ok(r.avisos.some((a) => a.includes('sin valor')));
});

test('leerCsvSerie: errores claros con número de línea; vacío, pocas filas y columna desconocida', () => {
  assert.throws(() => leerCsvSerie('01/01/2026;1\n32/01/2026;2\n03/01/2026;abc\n'), /línea 2: fecha no válida.*línea 3: valor no válido/);
  assert.throws(() => leerCsvSerie(''), /vacío/);
  assert.throws(() => leerCsvSerie('01/01/2026;1\n02/01/2026;2\n'), /al menos 3/);
  assert.throws(() => leerCsvSerie('fecha;a;b\n01/01/2026;1;2\n'), /columna de valores/);
});

test('leerCsvSerie: fechas repetidas (queda la última) con aviso', () => {
  const r = leerCsvSerie('01/01/2026;1\n01/01/2026;2\n02/01/2026;3\n03/01/2026;4\n');
  assert.deepEqual(r.puntos[0], ['2026-01-01', 2]);
  assert.ok(r.avisos.some((a) => a.includes('repetidas')));
});

// --- Estadísticos de series (reutilizan P-006 y P-011 a P-014) ---
const fechasDiarias = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-12'];
const PRECIOS = REF.precios.valor; // [100, 102, 101, 105, 104, 108]
const puntos = fechasDiarias.map((f, k) => [f, PRECIOS[k]]);

test('periodosPorAnio: diaria, semanal, mensual', () => {
  assert.equal(periodosPorAnio(fechasDiarias), 252);
  assert.equal(periodosPorAnio(['2026-01-02', '2026-01-09', '2026-01-16']), 52);
  assert.equal(periodosPorAnio(['2026-01-01', '2026-02-01', '2026-03-01']), 12);
});

test('analizar (precio): volatilidad, EWMA y drawdown = valores de LibreOffice', () => {
  const st = analizar(puntos, 'precio');
  assert.equal(st.periodosPorAnio, 252);
  cerca(st.volatilidadAnual, REF.vol_l_252.valor);
  cerca(st.ewmaAnual, REF.ewma_vol_252.valor);
  cerca(st.rentabilidadTotal, REF.rent_total.valor);
  cerca(st.varianzaLog, REF.var_l.valor);
  cerca(st.drawdown, 101 / 102 - 1);
  assert.equal(st.fechaPico, '2026-01-06');
  assert.equal(st.fechaValle, '2026-01-07');
});

test('analizar (tipo de interés): variaciones en puntos básicos', () => {
  const st = analizar([['2026-01-01', 2], ['2026-02-01', 2.25], ['2026-03-01', 2.15], ['2026-04-01', 2.15]], 'tipo');
  assert.equal(st.periodosPorAnio, 12);
  cerca(st.cambioTotalPb, 15);
  cerca(st.mediaCambioPb, 5);
  cerca(st.desviacionCambioPb, F.desviacionMuestral([25, -10, 0]));
});

test('alinear y correlacionSeries: fechas comunes y Pearson de las variaciones', () => {
  const b = [['2026-01-05', 50], ['2026-01-06', 51], ['2026-01-08', 52], ['2026-01-09', 51], ['2026-01-12', 53], ['2026-01-13', 54]];
  const al = alinear(puntos, b);
  assert.deepEqual(al.fechas, ['2026-01-05', '2026-01-06', '2026-01-08', '2026-01-09', '2026-01-12']);
  const c = correlacionSeries(puntos, 'precio', b, 'precio');
  cerca(c.correlacion, F.correlacion(F.rentabilidadesLog(al.x), F.rentabilidadesLog(al.y)));
  assert.equal(c.comunes, 5);
  assert.throws(() => correlacionSeries(puntos, 'precio', [['2030-01-01', 1]], 'precio'));
});

test('desde y mediasMoviles', () => {
  assert.equal(desde(puntos, '2026-01-08').length, 3);
  const mm = mediasMoviles(puntos, [3, 50]);
  assert.equal(mm.length, 1); // la ventana de 50 no cabe
  cerca(mm[0].valores[5], REF.mm3_ultima.valor);
});

// --- Escalas de las gráficas ---
test('escalas: pasos redondos, marcas, decimales, cursor y submuestreo', () => {
  assert.equal(pasoRedondo(10, 5), 2);
  assert.equal(pasoRedondo(1, 4), 0.25);
  const m = marcasY(1.0712, 1.1189);
  assert.ok(m.min <= 1.0712 && m.max >= 1.1189);
  assert.equal(m.marcas[0], m.min);
  assert.equal(decimalesDePaso(0.25), 2);
  assert.equal(decimalesDePaso(5), 0);
  assert.equal(decimalesDePaso(0.01), 2);
  assert.deepEqual(marcasX(3), [0, 1, 2]);
  assert.deepEqual(marcasX(11, 3), [0, 5, 10]);
  assert.equal(indiceCercano(50, 100, 11), 5);
  assert.equal(indiceCercano(-5, 100, 11), 0);
  const s = submuestrear(5000, 800);
  assert.equal(s.length, 800);
  assert.equal(s.at(-1), 4999);
  assert.deepEqual(marcasY(2, 2).marcas.length > 1, true);
});
