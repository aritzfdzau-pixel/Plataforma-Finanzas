// Tests de scripts/bce.js (lectura de los tipos de referencia del BCE).
// Muestra: tests/fixtures/bce-90d.xml (estructura del XML público del BCE, valores inventados).
// Variaciones de referencia: LibreOffice Calc (operativa/tests/referencias, ids bce_var_*).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsearXmlBce, construirDatosBce, variacionRelativa, validarDatosBce } from '../scripts/bce.js';

const XML = readFileSync(new URL('./fixtures/bce-90d.xml', import.meta.url), 'utf8');
const REF = JSON.parse(readFileSync(new URL('../operativa/tests/referencias/referencias.json', import.meta.url), 'utf8')).valores;
const cerca = (a, b) => assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-11, `obtenido ${a}, esperado ${b}`);

test('parsearXmlBce: lee días y tipos, del más reciente al más antiguo', () => {
  const dias = parsearXmlBce(XML);
  assert.deepEqual(dias.map((d) => d.fecha), ['2026-11-23', '2026-11-20', '2026-11-19']);
  assert.deepEqual(dias[0].tipos, { USD: 1.085, JPY: 161.2, GBP: 0.85, CNY: 7.8125 });
});

test('parsearXmlBce: rechaza contenido que no es del BCE o con tipos no válidos', () => {
  assert.throws(() => parsearXmlBce('<html>error</html>'));
  assert.throws(() => parsearXmlBce('<Cube></Cube>'));
  assert.throws(() => parsearXmlBce('<Cube><Cube time="2026-11-23"><Cube currency="USD" rate="-1"/></Cube></Cube>'));
  assert.throws(() => parsearXmlBce('<Cube><Cube time="ayer"><Cube currency="USD" rate="1.1"/></Cube></Cube>'));
});

test('variacionRelativa = hoy/anterior − 1 (LibreOffice: bce_var_usd, bce_var_jpy)', () => {
  cerca(variacionRelativa(1.085, 1.08), REF.bce_var_usd.valor);
  cerca(variacionRelativa(161.2, 162.35), REF.bce_var_jpy.valor);
  assert.equal(variacionRelativa(1.1, null), null);
});

test('construirDatosBce: último día, día anterior, variación y etiqueta "referencia BCE"', () => {
  const d = construirDatosBce(parsearXmlBce(XML), '2026-11-23T15:40:00Z');
  assert.equal(d.etiqueta, 'referencia BCE');
  assert.equal(d.fecha, '2026-11-23');
  assert.equal(d.fechaAnterior, '2026-11-20');
  assert.deepEqual(d.tipos.map((t) => t.divisa), ['CNY', 'GBP', 'JPY', 'USD']);
  const usd = d.tipos.find((t) => t.divisa === 'USD');
  assert.equal(usd.anterior, 1.08);
  cerca(usd.variacion, REF.bce_var_usd.valor);
  assert.equal(d.tipos.find((t) => t.divisa === 'GBP').variacion, 0);
  assert.equal(d.tipos.find((t) => t.divisa === 'CNY').variacion, null); // sin dato el día anterior
  assert.equal(validarDatosBce(d), d);
});

test('validarDatosBce: rechaza un respaldo con formato incorrecto', () => {
  assert.throws(() => validarDatosBce({}));
  assert.throws(() => validarDatosBce({ etiqueta: 'referencia BCE', fecha: '2026-11-23', tipos: [{ divisa: 'USD', tipo: 0 }] }));
});
