// D-043: buscador de empresas en fuentes externas. NIF de ejemplo inventados (dígito de control
// calculado a mano con el algoritmo público; no corresponden a empresas reales conocidas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FUENTES_EMPRESAS, esCifValido, normalizarNif, enlacesEmpresa } from '../web/js/lib/empresas.js';
import { leerRuta } from '../web/js/ui/rutas.js';

const leer = (r) => readFileSync(new URL(`../${r}`, import.meta.url), 'utf8');

test('esCifValido: dígito de control numérico y con letra; formatos no válidos', () => {
  assert.equal(esCifValido('B12345674'), true); // 1234567 → control 4
  assert.equal(esCifValido('b-1234567 4'), true); // se normaliza
  assert.equal(esCifValido('B12345675'), false);
  assert.equal(esCifValido('P1234567D'), true); // P: control con letra (4 → D)
  assert.equal(esCifValido('P12345674'), false);
  assert.equal(esCifValido('12345678Z'), false); // NIF de persona física: no se trata como sociedad
  assert.equal(esCifValido('Talleres del Norte'), false);
  assert.equal(normalizarNif(' b-12.345.674 '), 'B12345674');
});

test('enlacesEmpresa: las cinco fuentes; por NIF añade la ficha directa de eInforma', () => {
  assert.deepEqual(FUENTES_EMPRESAS.map((f) => f.id), ['einforma', 'axesor', 'borme', 'cnmv', 'registradores']);
  assert.deepEqual(enlacesEmpresa(' a '), []);
  const nombre = enlacesEmpresa('Talleres   del Norte');
  assert.equal(nombre.length, 5);
  assert.ok(nombre.every((e) => e.modo === 'copiar' && e.termino === 'Talleres del Norte'));
  const nif = enlacesEmpresa('b-12345674');
  assert.equal(nif[0].id, 'einforma-nif');
  assert.equal(nif[0].modo, 'directo');
  assert.match(nif[0].url, /\/nif\/B12345674$/);
  for (const e of [...nombre, ...nif]) assert.match(e.url, /^https:\/\//);
  // El nombre nunca viaja en la URL: solo se copia al portapapeles al pulsar.
  assert.ok(nombre.every((e) => !e.url.includes('Talleres')));
});

test('el buscador no descarga datos: sin fetch ni envíos; ruta #empresa y entrada en Operativa', () => {
  for (const f of ['web/js/lib/empresas.js', 'web/js/ui/empresas.js']) assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon/.test(leer(f)), f);
  assert.match(leer('web/js/ui/empresas.js'), /noopener/);
  assert.deepEqual(leerRuta('#empresa=B12345674'), { tipo: 'empresa', termino: 'B12345674' });
  assert.deepEqual(leerRuta('#empresa'), { tipo: 'empresa', termino: '' });
  assert.match(leer('web/index.html'), /href="#empresa"/);
});
