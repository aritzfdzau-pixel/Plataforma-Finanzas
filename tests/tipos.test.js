// Zona «Tipos de interés» (D-044): último dato, cambio en pb y vigencia de los tipos oficiales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BLOQUES_TIPOS, resumenTipo, filasTipos } from '../web/js/lib/tipos.js';
import { SERIES_OFICIALES } from '../scripts/series-oficiales.js';

test('resumenTipo: vigencia del nivel actual, nivel anterior y cambios en pb', () => {
  const dfr = { puntos: [['2026-05-01', 2.25], ['2026-06-11', 2.25], ['2026-06-12', 2], ['2026-06-13', 2], ['2026-11-26', 2]] };
  assert.deepEqual(resumenTipo(dfr), { fecha: '2026-11-26', valor: 2, cambioPb: 0, vigenteDesde: '2026-06-12', anterior: 2.25, cambioUltimoPb: -25 });
  const sube = resumenTipo({ puntos: [['2026-01-01', 3.1], ['2026-01-02', 3.165]] });
  assert.equal(sube.cambioPb, 6.5);
  assert.deepEqual(resumenTipo({ puntos: [['2026-01-01', 4], ['2026-01-02', 4]] }), { fecha: '2026-01-02', valor: 4, cambioPb: 0, vigenteDesde: null, anterior: null, cambioUltimoPb: null });
  assert.equal(resumenTipo({ puntos: [] }), null);
  assert.equal(resumenTipo(undefined), null);
});

test('filasTipos: una fila por tipo, con etiqueta y rango de la Fed; sin datos → null', () => {
  const series = [{ id: 'fed-sup', etiqueta: 'referencia oficial (Reserva Federal)', puntos: [['2026-11-25', 4]] }, { id: 'fed-inf', puntos: [['2026-11-25', 3.75]] }];
  const b = filasTipos(series);
  const fed = b[0].filas.find((f) => f.serie === 'fed-sup');
  assert.equal(fed.resumen.valor, 4);
  assert.equal(fed.resumenInferior.valor, 3.75);
  assert.equal(fed.etiqueta, 'referencia oficial (Reserva Federal)');
  assert.equal(b[0].filas.find((f) => f.serie === 'dfr').resumen, null);
});

test('cada tipo de la zona es una serie oficial configurada (o de mercado monetario) con etiqueta válida', () => {
  const ids = new Set(SERIES_OFICIALES.map((s) => s.id));
  for (const b of BLOQUES_TIPOS) for (const f of b.filas) {
    assert.ok(ids.has(f.serie), f.serie);
    if (f.inferior) assert.ok(ids.has(f.inferior), f.inferior);
  }
  for (const s of SERIES_OFICIALES.filter((x) => x.grupo === 'monetario')) {
    assert.equal(s.tipo, 'tipo'); assert.equal(s.unidad, '%');
  }
});

test('portada: la zona de tipos va bajo Noticias, y en móvil entre Noticias y Divisas', () => {
  const css = readFileSync(new URL('../web/css/layout.css', import.meta.url), 'utf8');
  assert.match(css, /"noticias\s+divisas"\s*\n\s*"tipos\s+mercados"/);
  assert.match(css, /"noticias"\s*\n\s*"tipos"\s*\n\s*"divisas"/);
  const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('id="zona-tipos"') > html.indexOf('zona--noticias'));
});
