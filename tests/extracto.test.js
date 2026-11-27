// Importación de extractos (Excel .xlsx y CSV) para el saldo medio (D-045). Muestras inventadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  importarExtracto, interpretarExtracto, PLANTILLA_EXTRACTO, leerFilasCsv, leerFilasXlsx, fechaSerieExcel, textosDesdeExtracto,
} from '../web/js/lib/extracto.js';
import { cargarOperacion } from '../operativa/operaciones/indice.js';
import { leerCampos } from '../web/js/lib/campos.js';

const leer = (n) => new Uint8Array(readFileSync(new URL(`./fixtures/${n}`, import.meta.url)));
const REF = JSON.parse(readFileSync(new URL('../operativa/tests/referencias/referencias.json', import.meta.url), 'utf8')).valores;

/** Ejecuta saldos-medios con los textos importados y el resto por defecto (1 %, 7 %, Act/365, 19 %). */
async function saldoMedio(textos) {
  const op = await cargarOperacion('saldos-medios');
  const { valores, errores } = leerCampos(op.campos, textos);
  assert.deepEqual(errores, {});
  return op.calcular(valores).resultados.find((r) => r.id === 'saldoMedio').valor;
}
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('fechaSerieExcel: sistema 1900 de Excel', () => {
  assert.equal(fechaSerieExcel(46023), '2026-01-01'); // =FECHA(2026;1;1) en LibreOffice/Excel
  assert.equal(fechaSerieExcel(45351), '2024-02-29');
  assert.equal(fechaSerieExcel(0), null);
});

test('CSV de banco (Windows-1252, «;», preámbulo, orden descendente, fila de total): movimientos y saldo inicial', async () => {
  const r = await importarExtracto('extracto-es.csv', leer('extracto-es.csv'));
  assert.equal(r.textos.entrada, 'movimientos');
  assert.equal(r.textos.movimientos, '15/01/2026; 3.000,00\n10/02/2026; -9.000,00\n01/03/2026; 4.000,00'); // por fecha valor
  assert.equal(r.textos.saldoInicial, '5.000,00');
  assert.equal(r.textos.desde, '01/01/2026'); // meses completos
  assert.equal(r.textos.hasta, '31/03/2026');
  assert.ok(r.avisos.some((a) => /más reciente/.test(a)));
  assert.ok(r.avisos.some((a) => /todos los saldos cuadran/.test(a)));
  assert.ok(r.avisos.some((a) => /1 fila sin fecha/.test(a)));
  // Ni el concepto ni el preámbulo llegan al formulario.
  assert.ok(!JSON.stringify(r.textos).includes('ejemplo'));
  cerca(await saldoMedio(r.textos), REF.sm_medio.valor);
});

test('CSV con «,», punto decimal y columnas Debit/Credit (cargo y abono)', async () => {
  const r = await importarExtracto('x.csv', leer('extracto-cargo-abono.csv'));
  assert.equal(r.textos.movimientos, '15/01/2026; 3.000,00\n10/02/2026; -9.000,00\n01/03/2026; 4.000,00');
  assert.equal(r.textos.saldoInicial, undefined);
  assert.ok(r.avisos.some((a) => /no trae saldos/.test(a)));
  cerca(await saldoMedio({ ...r.textos, saldoInicial: '5.000' }), REF.sm_medio.valor);
});

test('CSV de saldos sin cabecera', async () => {
  const r = await importarExtracto('s.csv', leer('saldos-sin-cabecera.csv'), { porDefecto: 'saldos' });
  assert.equal(r.textos.entrada, 'saldos');
  assert.equal(r.textos.saldos, '15/01/2026; 8.000,00\n10/02/2026; -1.000,00\n01/03/2026; 3.000,00');
  cerca(await saldoMedio({ ...r.textos, saldoInicial: '5.000' }), REF.sm_medio.valor);
});

test('XLSX (LibreOffice): fechas como número de serie, cadenas compartidas y decimales', async () => {
  const filas = await leerFilasXlsx(leer('extracto.xlsx'));
  assert.equal(filas[1][1], 'Fecha valor');
  assert.equal(filas[2][1], 46037); // 15/01/2026
  const r = await importarExtracto('extracto.xlsx', leer('extracto.xlsx'));
  assert.equal(r.textos.movimientos, '15/01/2026; 3.000,00\n10/02/2026; -9.000,00\n01/03/2026; 4.000,50');
  assert.equal(r.textos.saldoInicial, '5.000,00');
  assert.equal(r.textos.hasta, '31/03/2026');
});

test('interpretarExtracto: saldos que no cuadran, columnas no reconocidas y .xls', async () => {
  const ext = interpretarExtracto([['Fecha', 'Importe', 'Saldo'], ['01/01/2026', '100', '100'], ['02/01/2026', '50', '999']]);
  assert.ok(textosDesdeExtracto(ext).avisos.some((a) => /no cuadra/.test(a)));
  assert.throws(() => interpretarExtracto([['Nombre', 'Cuenta'], ['x', 'y']]), /No se reconoce el formato/);
  await assert.rejects(importarExtracto('viejo.xls', new Uint8Array([1, 2, 3])), /\.xls antiguos/);
  assert.deepEqual(leerFilasCsv('a;"b;c";"d ""e"""\n').filas[0], ['a', 'b;c', 'd "e"']);
  // Importes con signo al final y entre paréntesis.
  const e2 = interpretarExtracto([['Fecha', 'Importe'], ['01/01/26', '1.234,56-'], ['02/01/26', '(10,00)']]);
  assert.deepEqual(e2.filas.map((f) => [f.fecha, f.importe]), [['2026-01-01', -1234.56], ['2026-01-02', -10]]);
});

test('la plantilla descargable se importa y da el ejemplo de la ficha', async () => {
  const r = await importarExtracto('plantilla-extracto.csv', new TextEncoder().encode(`\ufeff${PLANTILLA_EXTRACTO}`));
  assert.equal(r.textos.saldoInicial, '5.000,00');
  cerca(await saldoMedio(r.textos), REF.sm_medio.valor);
});
