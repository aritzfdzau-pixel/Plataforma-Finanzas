// Tests de operativa/lib/finanzas.js.
// Valores de referencia: operativa/tests/referencias/referencias.json, calculados por
// LibreOffice Calc 24.2 a partir de las fórmulas de referencias.fods (ábrelo para verlas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as F from '../lib/finanzas.js';

const REF = JSON.parse(readFileSync(new URL('./referencias/referencias.json', import.meta.url), 'utf8')).valores;
const ref = (id) => {
  if (!(id in REF)) throw new Error(`Referencia inexistente: ${id}`);
  return REF[id].valor;
};
/** Igualdad con tolerancia relativa (LibreOffice exporta 15 cifras significativas). */
export function cerca(real, esperado, tolRel = 1e-11) {
  const tol = Math.max(Math.abs(esperado) * tolRel, 1e-12);
  assert.ok(Math.abs(real - esperado) <= tol, `obtenido ${real}, esperado ${esperado}`);
}

// --- P-001 / P-002 ---------------------------------------------------------
test('P-001 fraccionAnio: Act/360 y Act/365', () => {
  assert.equal(F.fraccionAnio(90), 0.25);            // definición: 90/360
  assert.equal(F.fraccionAnio(73, 'ACT/365'), 0.2);  // definición: 73/365
  assert.throws(() => F.fraccionAnio(10, '30/360'));
  assert.throws(() => F.fraccionAnio(-1));
});

test('P-002 interesSimple: 20.000 € al 6 % durante 60 días Act/360 (LibreOffice: dto_int)', () => {
  cerca(F.interesSimple(20000, 0.06, 60), ref('dto_int'));
});

// --- P-003 -----------------------------------------------------------------
test('P-003 tinATae = EFECTIVO()/EFFECT() de LibreOffice', () => {
  cerca(F.tinATae(0.06, 12), ref('tae_6_12'));
  cerca(F.tinATae(0.12, 12), ref('tae_12_12'));
  cerca(F.tinATae(0.05, 4), ref('tae_5_4'));
  cerca(F.tinATae(0.05, 1), 0.05, 1e-12); // definición: anual → TAE = TIN
});

test('P-003 taeATin = NOMINAL() de LibreOffice, y es la inversa de tinATae', () => {
  cerca(F.taeATin(0.06, 12), ref('tin_6_12'));
  cerca(F.taeATin(F.tinATae(0.0345, 12), 12), 0.0345, 1e-12);
});

// --- P-004 -----------------------------------------------------------------
test('P-004 van = VNA()/NPV() de LibreOffice + flujo inicial', () => {
  cerca(F.van(0.1, [-100, 39, 59, 55, 20]), ref('van_a'));
  cerca(F.van(0.08, [-1000, 300, 400, 500]), ref('van_b'));
  assert.equal(F.van(0, [-100, 50, 50]), 0);
});

test('P-004 tir = TIR()/IRR() de LibreOffice (Newton-Raphson)', () => {
  for (const [id, flujos] of [
    ['tir_a', [-100, 39, 59, 55, 20]],
    ['tir_b', [-1000, 300, 400, 500]],
    ['tir_c', [-50000, 12000, 12000, 12000, 12000, 12000, 12000]],
    ['tir_d', [-1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5000]],
  ]) {
    const r = F.tir(flujos);
    assert.equal(r.metodo, 'Newton-Raphson', id);
    cerca(r.tir, ref(id), 1e-9);
  }
});

test('P-004 tir: el respaldo por bisección da el mismo resultado', () => {
  const r = F.tir([-100, 39, 59, 55, 20], { forzarBiseccion: true });
  assert.equal(r.metodo, 'bisección');
  cerca(r.tir, ref('tir_a'), 1e-9);
});

test('P-004 tir: si Newton no converge, entra la bisección', () => {
  // Estimación inicial muy mala y solo 2 iteraciones: Newton no llega y se usa bisección.
  const r = F.tir([-1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5000], { estimacion: 50, maxIter: 2 });
  assert.equal(r.metodo, 'bisección');
  cerca(r.tir, ref('tir_d'), 1e-9);
});

test('P-004 tir: sin cambio de signo no hay TIR', () => {
  assert.equal(F.tir([100, 50, 50]).tir, null);
  assert.equal(F.cambiosDeSigno([-100, 50, -20, 80]), 3);
  assert.equal(F.cambiosDeSigno([-100, 0, 50]), 1);
});

// --- P-005 -----------------------------------------------------------------
test('P-005 cuotaFrancesa = PAGO()/PMT() de LibreOffice', () => {
  cerca(F.cuotaFrancesa(100000, 0.05 / 12, 60), ref('fr_cuota_60'));
  cerca(F.cuotaFrancesa(50000, 0.06 / 4, 12), ref('fr_trim_cuota'));
  assert.equal(F.cuotaFrancesa(1200, 0, 12), 100); // tipo 0: capital / n
});

test('P-005 pendienteFrances = −VF()/FV() de LibreOffice', () => {
  cerca(F.pendienteFrances(100000, 0.05 / 12, 60, 12), ref('fr_pend_12'), 1e-10);
});

test('P-005 cuadro francés sin carencia: intereses = −PAGO.INT.ENTRE()/CUMIPMT()', () => {
  const { filas, totales } = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60 });
  assert.equal(filas.length, 60);
  cerca(filas[0].cuota, ref('fr_cuota_60'));
  cerca(filas[11].pendiente, ref('fr_pend_12'), 1e-10);
  cerca(totales.intereses, ref('fr_int_60'), 1e-10);
  assert.equal(filas.at(-1).pendiente, 0);
});

test('P-005 cuadro francés con 6 periodos de carencia parcial', () => {
  const { filas, totales } = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60, carencia: 6 });
  cerca(filas[0].cuota, 100000 * 0.05 / 12);    // solo intereses
  assert.equal(filas[5].pendiente, 100000);       // el capital no baja en carencia
  cerca(filas[6].cuota, ref('fr_carp_cuota'));
  cerca(totales.intereses, ref('fr_carp_int'), 1e-10);
});

test('P-005 cuadro francés con 6 periodos de carencia total (intereses capitalizados)', () => {
  const { filas, totales } = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60, carencia: 6, tipoCarencia: 'total' });
  assert.equal(filas[0].cuota, 0);
  cerca(filas[5].pendiente, ref('fr_cart_cap'));
  cerca(filas[6].cuota, ref('fr_cart_cuota'));
  cerca(totales.intereses, ref('fr_cart_int'), 1e-10);
});

test('P-005 cuadro alemán: amortización constante', () => {
  const { filas, totales } = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60, sistema: 'aleman' });
  cerca(filas[0].cuota, ref('al_cuota1'));
  cerca(filas[10].amortizacion, 100000 / 60);
  cerca(totales.intereses, ref('al_int'), 1e-10);
  const c = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60, carencia: 6, sistema: 'aleman' });
  cerca(c.totales.intereses, ref('al_carp_int'), 1e-10);
});

test('P-005 validaciones del cuadro', () => {
  assert.throws(() => F.cuadroAmortizacion({ capital: 1000, tipoPeriodo: 0.01, periodos: 12, carencia: 12 }));
  assert.throws(() => F.cuadroAmortizacion({ capital: -1, tipoPeriodo: 0.01, periodos: 12 }));
  assert.throws(() => F.cuadroAmortizacion({ capital: 1000, tipoPeriodo: 0.01, periodos: 12.5 }));
});

// --- P-006 -----------------------------------------------------------------
const PRECIOS = ref('precios');

test('P-006 rentabilidades simples y logarítmicas = celdas de LibreOffice (LN)', () => {
  F.rentabilidadesSimples(PRECIOS).forEach((r, k) => cerca(r, ref('r_simples')[k], 1e-10));
  F.rentabilidadesLog(PRECIOS).forEach((r, k) => cerca(r, ref('r_log')[k], 1e-10));
  assert.throws(() => F.rentabilidadesLog([100, 0, 101]));
});

test('P-006 media, VAR.S, DESVEST.M y volatilidad anualizada = LibreOffice', () => {
  const s = F.rentabilidadesSimples(PRECIOS);
  const l = F.rentabilidadesLog(PRECIOS);
  cerca(F.media(s), ref('media_s'), 1e-10);
  cerca(F.media(l), ref('media_l'), 1e-10);
  cerca(F.varianzaMuestral(s), ref('var_s'), 1e-10);
  cerca(F.varianzaMuestral(l), ref('var_l'), 1e-10);
  cerca(F.desviacionMuestral(s), ref('sd_s'), 1e-10);
  cerca(F.desviacionMuestral(l), ref('sd_l'), 1e-10);
  cerca(F.volatilidadAnualizada(s, 252), ref('vol_s_252'), 1e-10);
  cerca(F.volatilidadAnualizada(l, 252), ref('vol_l_252'), 1e-10);
  cerca(F.volatilidadAnualizada(l, 12), ref('vol_l_12'), 1e-10);
});

// --- P-007 -----------------------------------------------------------------
test('P-007 forwardParidad = fórmula de paridad cubierta en LibreOffice', () => {
  cerca(F.forwardParidad({ spot: 1.085, tipoEur: 0.03, tipoDivisa: 0.045, dias: 90 }), ref('fwd_usd'));
  cerca(F.forwardParidad({ spot: 0.85, tipoEur: 0.03, tipoDivisa: 0.0475, dias: 180, baseDivisa: 'ACT/365' }), ref('fwd_gbp'));
  cerca(F.forwardParidad({ spot: 162.35, tipoEur: 0.03, tipoDivisa: 0.005, dias: 90, baseDivisa: 'ACT/365' }), ref('fwd_jpy'));
  // Con tipos iguales y misma base, el forward es el spot.
  cerca(F.forwardParidad({ spot: 1.1, tipoEur: 0.02, tipoDivisa: 0.02, dias: 180 }), 1.1);
});

// --- P-008 -----------------------------------------------------------------
test('P-008 redondear se comporta como REDONDEAR() (mitad lejos de cero)', () => {
  assert.equal(F.redondear(1.005, 2), 1.01);   // 1.005 no es exacto en binario: aun así 1,01
  assert.equal(F.redondear(2.5, 0), 3);
  assert.equal(F.redondear(-2.5, 0), -3);
  assert.equal(F.redondear(1234.5678, 2), 1234.57);
});

test('P-008 convertirConReferencia = REDONDEAR(importe × / ÷ tipo) en LibreOffice', () => {
  assert.equal(F.convertirConReferencia(10000, 1.085, 'EUR->DIV'), ref('conv_eur_usd'));
  assert.equal(F.convertirConReferencia(5000, 1.085, 'DIV->EUR'), ref('conv_usd_eur'));
  assert.equal(F.convertirConReferencia(1000, 162.35, 'EUR->DIV', 0), ref('conv_eur_jpy'));
  assert.equal(F.convertirConReferencia(250000, 162.35, 'DIV->EUR'), ref('conv_jpy_eur'));
  assert.throws(() => F.convertirConReferencia(1, 0, 'EUR->DIV'));
});

// --- P-009 -----------------------------------------------------------------
test('P-009 costeEfectivoAnual = (N/E)^(365/d) − 1 en LibreOffice', () => {
  cerca(F.costeEfectivoAnual(19697, 20000, 60), ref('dto_tae'), 1e-10);
  cerca(F.costeEfectivoAnual(787, 800, 30), ref('dto2_tae'), 1e-10);
  cerca(F.costeEfectivoAnual(49312.5, 50000, 90), ref('conf_tae'), 1e-10);
});
