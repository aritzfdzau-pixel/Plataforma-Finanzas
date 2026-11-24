// Tests de los módulos puros de la interfaz (web/js/lib).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerNumero, leerSerie, numero, eur, pct, divisa, esMilesConPunto, formatear } from '../web/js/lib/formato.js';
import { leerFicha } from '../web/js/lib/frontmatter.js';
import { markdownAHtml, enLinea, quitarComentarios } from '../web/js/lib/markdown.js';
import { buscar, normalizar } from '../web/js/lib/buscar.js';
import { leerCampos } from '../web/js/lib/campos.js';
import { tablaACsv, celdaCsv } from '../web/js/lib/csv.js';

test('leerNumero: convención es-ES', () => {
  assert.equal(leerNumero('1.234,56'), 1234.56);
  assert.equal(leerNumero('1234,56'), 1234.56);
  assert.equal(leerNumero('1,0850'), 1.085);
  assert.equal(leerNumero('100.000'), 100000);
  assert.equal(leerNumero('1.085'), 1085);         // grupos de 3: miles (es-ES)
  assert.equal(leerNumero('1.0850'), 1.085);       // un punto sin grupo de 3: decimal
  assert.equal(leerNumero('4.5'), 4.5);
  assert.equal(leerNumero('1,234.56'), 1234.56);   // formato inglés pegado
  assert.equal(leerNumero('-3,5'), -3.5);
  assert.equal(leerNumero('−3,5'), -3.5);     // signo menos tipográfico
  assert.equal(leerNumero(' 2 500,00 € '), 2500);
  assert.ok(Number.isNaN(leerNumero('1,2,3')));
  assert.ok(Number.isNaN(leerNumero('abc')));
  assert.ok(Number.isNaN(leerNumero('')));
  assert.ok(esMilesConPunto('1.085') && !esMilesConPunto('1.0850'));
});

test('leerSerie: saltos de línea, tabuladores y «;»', () => {
  assert.deepEqual(leerSerie('100\n101,5\t102;103'), [100, 101.5, 102, 103]);
  assert.deepEqual(leerSerie('  \n'), []);
  assert.throws(() => leerSerie('1\nx'), /posición 2/);
});

test('formato es-ES con separador de miles siempre', () => {
  assert.equal(numero(1234.5), '1.234,50');
  assert.equal(numero(-0.004, 2), '0,00');
  assert.equal(eur(1234.5), '1.234,50 €');
  assert.equal(pct(0.034), '3,40 %');
  assert.equal(divisa(162350, 'JPY', 0), '162.350 JPY');
  assert.equal(numero(NaN), '—');
});

test('leerFicha: cabecera YAML sencilla', () => {
  const { cabecera, cuerpo } = leerFicha('---\ntitulo: "Hola: mundo"\nidioma: es # comentario\netiquetas: [a, b c]\nvacio: []\n---\n# T\n');
  assert.deepEqual(cabecera, { titulo: 'Hola: mundo', idioma: 'es', etiquetas: ['a', 'b c'], vacio: [] });
  assert.equal(cuerpo, '# T\n');
  assert.deepEqual(leerFicha('sin cabecera').cabecera, {});
});

test('markdownAHtml: bloques y escape de HTML', () => {
  const html = markdownAHtml('# Título\n\nTexto **fuerte** y <script>x</script> <SCRIPT>y</SCRIPT>\n\n- a\n- b\n\n$$\nF = S\n$$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n<!-- oculto -->');
  assert.match(html, /<h1>Título<\/h1>/);
  assert.match(html, /<strong>fuerte<\/strong>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<\s*script/i);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(html, /<pre class="formula"[^>]*>F = S<\/pre>/);
  assert.match(html, /<td>1<\/td><td>2<\/td>/);
  assert.doesNotMatch(html, /oculto/);
});

test('enLinea: enlaces seguros y fórmulas', () => {
  assert.doesNotMatch(enLinea('[x](javascript:alert(1))'), /<a /);
  assert.doesNotMatch(enLinea('[x](data:text/html,hola)'), /<a /);
  assert.match(enLinea('[op](#op=van-tir)'), /<a href="#op=van-tir">op<\/a>/);
  assert.match(enLinea('[w](https://example.org)'), /rel="noopener noreferrer"/);
  assert.match(enLinea('$a*b*c$'), /<code class="formula">a\*b\*c<\/code>/);
});

test('buscar: sin tildes, todas las palabras, título primero', () => {
  const el = [
    { titulo: 'VAN y TIR', etiquetas: ['inversion'], categoria: 'bolsa-inversion', categoriaNombre: 'Bolsa e Inversión' },
    { titulo: 'Hipoteca variable', etiquetas: ['euribor'], categoria: 'real-estate', categoriaNombre: 'Real Estate' },
  ];
  assert.equal(normalizar('Inversión'), 'inversion');
  assert.deepEqual(buscar(el, 'euríbor').map((e) => e.titulo), ['Hipoteca variable']);
  assert.deepEqual(buscar(el, 'inversion tir').map((e) => e.titulo), ['VAN y TIR']);
  assert.equal(buscar(el, '').length, 2);
  assert.equal(buscar(el, 'nada').length, 0);
});

test('leerCampos: porcentajes, enteros, selecciones y errores', () => {
  const campos = [
    { id: 'p', tipo: 'porcentaje', defecto: '3,40' },
    { id: 'n', tipo: 'entero', defecto: '12' },
    { id: 's', tipo: 'seleccion', defecto: 'a', opciones: [{ valor: 'a' }, { valor: 'b' }] },
  ];
  const ok = leerCampos(campos);
  assert.ok(Math.abs(ok.valores.p - 0.034) < 1e-15);
  assert.equal(ok.valores.n, 12);
  const mal = leerCampos(campos, { n: '1,5', s: 'z' });
  assert.ok(mal.errores.n && mal.errores.s);
});

test('CSV: «;», coma decimal, porcentajes y escape', () => {
  assert.equal(celdaCsv(1234.567, 'num:2'), '1234,57');
  assert.equal(celdaCsv(0.0198026, 'pct:4'), '1,9803');
  assert.equal(celdaCsv(NaN, 'num:2'), '');
  assert.equal(celdaCsv('a;b'), '"a;b"');
  const csv = tablaACsv({ columnas: [{ id: 'a', etiqueta: 'A', formato: 'entero' }, { id: 'b', etiqueta: 'B', formato: 'pct:2' }], filas: [{ a: 1, b: 0.5 }] });
  assert.equal(csv, '﻿A;B (%)\r\n1;50,00\r\n');
});

test('formatear: todos los códigos de formato', () => {
  assert.equal(formatear(1234.5, 'eur'), '1.234,50\u00a0€');
  assert.equal(formatear(5, 'entero'), '5');
  assert.equal(formatear(0.061678, 'pct:4'), '6,1678\u00a0%');
  assert.equal(formatear(0.08, 'pct'), '8,00\u00a0%');
  assert.equal(formatear(1.0890384, 'num:6'), '1,089038');
  assert.equal(formatear(108903.846, 'divisa:USD:2'), '108.903,85\u00a0USD');
  assert.equal(formatear('Newton', 'texto'), 'Newton');
  assert.throws(() => formatear(1, 'raro'));
});

test('markdownAHtml: elementos de lista que ocupan varias líneas', () => {
  const html = markdownAHtml('- uno que sigue\n  en otra línea\n- dos\n\nPárrafo');
  assert.match(html, /<ul><li>uno que sigue en otra línea<\/li><li>dos<\/li><\/ul>/);
  assert.match(html, /<p>Párrafo<\/p>/);
});

test('quitarComentarios y caracteres nulos', () => {
  assert.equal(quitarComentarios('a<!-- x -->b<!--y-->c'), 'abc');
  assert.equal(quitarComentarios('a<!-- sin cerrar'), 'a');
  assert.equal(quitarComentarios('<!<!-- x -->-- z -->'), '<!-- z -->');
  // Tras quitar comentarios, el resto se escapa: nunca queda HTML activo.
  assert.doesNotMatch(markdownAHtml('<!<!-- x -->-- z --><SCRIPT>'), /<\s*script|<!--/i);
  assert.doesNotMatch(markdownAHtml('texto \u00000\u0000 fin'), /\u0000/);
});

test('leerCampo: un número vacío es obligatorio (mensaje claro)', () => {
  const { errores } = leerCampos([{ id: 'x', tipo: 'porcentaje' }, { id: 'y', tipo: 'numero' }], { x: '', y: '  ' });
  assert.equal(errores.x, 'Obligatorio: introduce un valor');
  assert.equal(errores.y, 'Obligatorio: introduce un valor');
});
