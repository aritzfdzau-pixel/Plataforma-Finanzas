// Tests de la fase 5 (interfaz): fechas futuras, horizontes, parámetros del paseo aleatorio y
// el vocabulario obligatorio («Proyecciones y escenarios», nunca «predicciones»).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fechasFuturas, horizontes, parametrosPaseo } from '../web/js/lib/series.js';
import * as F from '../operativa/lib/finanzas.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

test('fechasFuturas: días hábiles (salta fines de semana), meses y semanas', () => {
  assert.deepEqual(fechasFuturas('2026-11-20', 3, 252), ['2026-11-23', '2026-11-24', '2026-11-25']); // viernes → lunes
  assert.deepEqual(fechasFuturas('2026-10-01', 3, 12), ['2026-11-01', '2026-12-01', '2027-01-01']);
  assert.deepEqual(fechasFuturas('2026-11-02', 2, 52), ['2026-11-09', '2026-11-16']);
});

test('horizontes según periodicidad', () => {
  assert.deepEqual(horizontes(252).map(([h]) => h), [21, 63, 126, 252]);
  assert.deepEqual(horizontes(12).map(([h]) => h), [3, 6, 12, 24]);
});

test('parametrosPaseo: μ y σ de las últimas variaciones (log en precios, diferencias en tipos)', () => {
  const precios = [100, 102, 101, 105, 104, 108];
  const p = parametrosPaseo(precios, 'precio', 3);
  const log3 = F.rentabilidadesLog(precios.slice(-4));
  assert.equal(p.n, 3);
  assert.equal(p.modelo, 'log');
  assert.equal(p.media, F.media(log3));
  assert.equal(p.desviacion, F.desviacionMuestral(log3));
  const t = parametrosPaseo([2, 2.25, 2.15, 2.4], 'tipo');
  assert.equal(t.modelo, 'aditivo');
  assert.equal(t.n, 3);
});

test('la interfaz dice «Proyecciones y escenarios» y nunca presenta «predicciones» (solo negadas)', () => {
  const archivos = [join(RAIZ, 'web/index.html'), ...readdirSync(join(RAIZ, 'web/js/ui')).map((n) => join(RAIZ, 'web/js/ui', n))];
  const html = readFileSync(join(RAIZ, 'web/index.html'), 'utf8');
  assert.match(html, />Proyecciones y escenarios</);
  for (const f of archivos) {
    const texto = readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/predicci[oó]n(es)?/gi)) {
      const antes = texto.slice(Math.max(0, m.index - 25), m.index).toLowerCase();
      assert.ok(/\b(no|nunca)\s+(una\s+|es\s+|son\s+)?«?$/.test(antes), `«${m[0]}» sin negar en ${f}: …${antes}${m[0]}`);
    }
  }
});
