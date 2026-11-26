// D-041: reloj cada 15 minutos y datos diarios a las 08:00 de Madrid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ultimoCorte, tocaDescargaDiaria } from '../scripts/horario.js';

const leer = (r) => readFileSync(new URL(`../${r}`, import.meta.url), 'utf8');

test('ultimoCorte: 08:00 de Madrid en invierno (07:00 UTC), en verano (06:00 UTC) y el día del cambio de hora', () => {
  assert.equal(ultimoCorte('2026-11-26T06:59:00Z'), '2026-11-25T07:00:00.000Z');
  assert.equal(ultimoCorte('2026-11-26T07:00:00Z'), '2026-11-26T07:00:00.000Z');
  assert.equal(ultimoCorte('2026-11-26T22:30:00Z'), '2026-11-26T07:00:00.000Z');
  assert.equal(ultimoCorte('2026-07-15T05:59:00Z'), '2026-07-14T06:00:00.000Z');
  assert.equal(ultimoCorte('2026-07-15T06:00:00Z'), '2026-07-15T06:00:00.000Z');
  assert.equal(ultimoCorte('2026-03-29T07:00:00Z'), '2026-03-29T06:00:00.000Z'); // 29-mar-2026: pasa a horario de verano
  assert.equal(ultimoCorte('2026-10-25T07:30:00Z'), '2026-10-25T07:00:00.000Z'); // 25-oct-2026: vuelve al de invierno
  assert.throws(() => ultimoCorte('no es una fecha'));
});

test('tocaDescargaDiaria: solo si lo descargado es anterior al último corte', () => {
  assert.equal(tocaDescargaDiaria(null, '2026-11-26T10:00:00Z'), true);
  assert.equal(tocaDescargaDiaria('2026-11-26T07:00:30Z', '2026-11-26T18:45:00Z'), false);
  assert.equal(tocaDescargaDiaria('2026-11-25T16:00:00Z', '2026-11-26T07:00:20Z'), true);
  assert.equal(tocaDescargaDiaria('2026-11-25T16:00:00Z', '2026-11-26T06:45:00Z'), false);
});

test('reloj: cada cuarto de hora lanza pages.yml y se relanza a sí mismo; una sola cadena; sin claves', () => {
  const r = leer('.github/workflows/reloj.yml');
  assert.match(r, /workflow_dispatch:/);
  assert.match(r, /actions: write/);
  assert.match(r, /group: reloj\n\s+cancel-in-progress: false/);
  assert.match(r, /% 900/); // espera hasta el siguiente múltiplo de 15 minutos
  assert.match(r, /gh workflow run pages\.yml --ref main/);
  assert.match(r, /gh workflow run reloj\.yml --ref main/);
  assert.ok(!/secrets\./.test(r), 'sin secretos: basta GITHUB_TOKEN');
  const p = leer('.github/workflows/pages.yml');
  assert.ok(!/^\s*schedule:/m.test(p), 'pages.yml ya no depende de los horarios de GitHub');
  assert.match(p, /workflow_dispatch:/);
});
