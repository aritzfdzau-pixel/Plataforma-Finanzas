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

test('P-005 cuadro americano (bullet): solo intereses y capital al final', () => {
  const { filas, totales } = F.cuadroAmortizacion({ capital: 100000, tipoPeriodo: 0.05 / 12, periodos: 60, sistema: 'americano' });
  cerca(filas[0].cuota, ref('am_cuota'));
  cerca(filas.at(-1).cuota, ref('am_ultima'));
  cerca(totales.intereses, ref('am_int'), 1e-10);
  assert.throws(() => F.cuadroAmortizacion({ capital: 1000, tipoPeriodo: 0.01, periodos: 12, sistema: 'ingles' }));
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

// --- P-011 a P-014 (fase 4: históricos) -----------------------------------
test('P-011 mediaMovil = PROMEDIO() deslizante de LibreOffice; null al principio', () => {
  const mm = F.mediaMovil(PRECIOS, 3);
  assert.deepEqual(mm.slice(0, 2), [null, null]);
  cerca(mm[2], ref('mm3_primera'));
  cerca(mm[5], ref('mm3_ultima'));
  assert.deepEqual(F.mediaMovil([1, 2, 3], 1), [1, 2, 3]);
  assert.throws(() => F.mediaMovil([1, 2], 0));
});

test('P-011 diferencias: x_t − x_{t−1} (definición)', () => {
  assert.deepEqual(F.diferencias([4, 4.25, 4.1]).map((d) => F.redondear(d, 10)), [0.25, -0.15]);
  assert.throws(() => F.diferencias([1]));
});

test('P-012 volatilidadEWMA (λ = 0,94) = recursión escrita en LibreOffice', () => {
  const r = F.volatilidadEWMA(F.rentabilidadesLog(PRECIOS), 0.94, 252);
  assert.equal(r.varianzas.length, 5);
  cerca(r.varianzas.at(-1), ref('ewma_var'), 1e-10);
  cerca(r.anualizada, ref('ewma_vol_252'), 1e-10);
  cerca(r.volatilidad, Math.sqrt(ref('ewma_var')), 1e-10);
  assert.equal(F.volatilidadEWMA([0.01, 0.02]).anualizada, null);
  assert.throws(() => F.volatilidadEWMA([0.01, 0.02], 1));
});

test('P-013 correlacion = COEF.DE.CORREL()/CORREL() de LibreOffice', () => {
  cerca(F.correlacion([0.02, -0.0098, 0.0396, -0.0095, 0.0385], [0.01, -0.005, 0.03, -0.02, 0.025]), ref('correl_xy'), 1e-10);
  cerca(F.correlacion([1, 2, 3], [2, 4, 6]), 1);
  cerca(F.correlacion([1, 2, 3], [3, 2, 1]), -1);
  assert.throws(() => F.correlacion([1, 2], [1, 2, 3]));
  assert.throws(() => F.correlacion([1, 1, 1], [1, 2, 3]));
});

test('P-014 maximoDrawdown = MIN(P_t / MAX(P_1..P_t) − 1) en LibreOffice; pico y valle', () => {
  const d = F.maximoDrawdown([100, 110, 105, 95, 120, 90, 100]);
  cerca(d.drawdown, ref('mdd_q'));
  assert.equal(d.pico, 4);
  assert.equal(d.valle, 5);
  assert.deepEqual(F.maximoDrawdown([1, 2, 3]), { drawdown: 0, pico: 0, valle: 0 });
});

// --- P-015 a P-017 (fase 5: proyecciones y escenarios) --------------------
test('P-015 cuantil = PERCENTIL.INC()/PERCENTILE() de LibreOffice', () => {
  const x = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
  cerca(F.cuantil(x, 0.05), ref('pct_05'));
  cerca(F.cuantil(x, 0.95), ref('pct_95'));
  cerca(F.cuantil(x, 0.5), ref('pct_50'));
  assert.equal(F.cuantil([7], 0.3), 7);
  assert.throws(() => F.cuantil(x, 1.2));
});

test('P-015 Z_95 = DISTR.NORM.INV(0,95; 0; 1) de LibreOffice', () => {
  cerca(F.Z_95, ref('z_95'), 1e-12);
});

test('P-015 bandaAnalitica = fórmula lognormal y aditiva en LibreOffice', () => {
  const b = F.bandaAnalitica({ inicial: 100, media: 0.0002, desviacion: 0.01, horizonte: 20 });
  cerca(b.inferior, ref('banda_log_inf'), 1e-10);
  cerca(b.superior, ref('banda_log_sup'), 1e-10);
  cerca(b.mediana, 100 * Math.exp(0.004));
  cerca(F.bandaAnalitica({ inicial: 2.5, media: 0.001, desviacion: 0.05, horizonte: 12, modelo: 'aditivo' }).superior, ref('banda_adi_sup'), 1e-10);
});

test('P-015 generador reproducible y normal estándar con media ≈ 0 y desviación ≈ 1', () => {
  const a = F.generadorAleatorio(42), b = F.generadorAleatorio(42);
  for (let k = 0; k < 5; k++) assert.equal(a(), b());
  const z = F.generadorNormal(F.generadorAleatorio(7));
  const m = Array.from({ length: 50000 }, () => z());
  assert.ok(Math.abs(F.media(m)) < 0.02);
  assert.ok(Math.abs(F.desviacionMuestral(m) - 1) < 0.02);
});

test('P-015 simularMontecarlo: percentiles 5/50/95 cerca de la banda analítica de LibreOffice', () => {
  const r = F.simularMontecarlo({ inicial: 100, media: 0.0002, desviacion: 0.01, horizonte: 20, trayectorias: 20000, semilla: 3 });
  assert.equal(r.percentiles[50].length, 21);
  assert.equal(r.percentiles[5][0], 100);
  // Error de muestreo con 20.000 trayectorias: tolerancia del 0,5 %.
  cerca(r.percentiles[5].at(-1), ref('banda_log_inf'), 5e-3);
  cerca(r.percentiles[95].at(-1), ref('banda_log_sup'), 5e-3);
  cerca(r.percentiles[50].at(-1), 100 * Math.exp(0.004), 5e-3);
  for (let t = 1; t <= 20; t++) assert.ok(r.percentiles[5][t] < r.percentiles[50][t] && r.percentiles[50][t] < r.percentiles[95][t]);
  // Misma semilla → mismo resultado.
  const r2 = F.simularMontecarlo({ inicial: 100, media: 0.0002, desviacion: 0.01, horizonte: 20, trayectorias: 20000, semilla: 3 });
  assert.equal(r2.percentiles[95].at(-1), r.percentiles[95].at(-1));
  const a = F.simularMontecarlo({ inicial: 2.5, media: 0.001, desviacion: 0.05, horizonte: 12, trayectorias: 20000, modelo: 'aditivo', semilla: 5 });
  cerca(a.percentiles[95].at(-1), ref('banda_adi_sup'), 5e-3);
  assert.throws(() => F.simularMontecarlo({ inicial: -1, media: 0, desviacion: 0.01, horizonte: 5 }));
});

test('P-016 errores: MAE y RMSE = fórmulas de LibreOffice (ABS, SUMXMY2)', () => {
  cerca(F.errorMedioAbsoluto([10, 12, 11, 13], [11, 11, 12, 12]), ref('mae_ej'));
  cerca(F.raizErrorCuadraticoMedio([10, 12, 11, 14], [11, 11, 12, 12]), ref('rmse_ej'));
  assert.throws(() => F.errorMedioAbsoluto([1, 2], [1]));
});

test('P-016 validarFrenteAPaseoAleatorio: serie con tendencia exacta (el modelo acierta) y sin tendencia', () => {
  const crecer = Array.from({ length: 60 }, (_, k) => 100 * 1.01 ** k); // rentabilidad log constante
  const v = F.validarFrenteAPaseoAleatorio(crecer, { horizonte: 5, ventana: 20 });
  assert.ok(v.origenes >= 3);
  assert.ok(v.rmseModelo < 1e-9, 'con tendencia constante la mediana acierta');
  assert.ok(v.rmsePaseo > 0);
  assert.equal(v.theilU < 1e-9, true);
  const sin = F.validarFrenteAPaseoAleatorio(crecer, { horizonte: 5, ventana: 20, conTendencia: false });
  cerca(sin.rmseModelo, sin.rmsePaseo); // sin tendencia, la mediana es el paseo aleatorio
  cerca(sin.theilU, 1);
  assert.throws(() => F.validarFrenteAPaseoAleatorio(crecer.slice(0, 10), { horizonte: 5, ventana: 20 }));
});

test('P-017 escenarioTipoCambio = contravalores de LibreOffice', () => {
  const e = F.escenarioTipoCambio({ importeDivisa: 100000, tipo: 1.085, movimiento: -0.05 });
  cerca(e.actual, ref('esc_fx_actual'));
  cerca(e.escenario, ref('esc_fx_menos5'));
  cerca(e.diferencia, ref('esc_fx_menos5') - ref('esc_fx_actual'));
  cerca(e.tipoEscenario, 1.085 * 0.95);
  assert.throws(() => F.escenarioTipoCambio({ importeDivisa: 1, tipo: 1, movimiento: -1 }));
});

// --- Fase 7: empresas -------------------------------------------------------
const DATOS_EF = {
  ventas: 2000000, ebit: 180000, amortizaciones: 70000, gastosFinancieros: 40000, beneficioNeto: 100000,
  deudaCorto: 150000, deudaLargo: 650000, caja: 120000, fondosPropios: 900000, activoTotal: 2400000,
  activoCorriente: 1000000, pasivoCorriente: 700000, flujoServicioDeuda: 260000, servicioDeuda: 200000,
};

test('P-018 ratiosFinancieros = fórmulas de LibreOffice (rat_*)', () => {
  const r = F.ratiosFinancieros(DATOS_EF);
  cerca(r.ebitda, ref('rat_ebitda')); cerca(r.margenEbitda, ref('rat_margen_ebitda')); cerca(r.margenNeto, ref('rat_margen_neto'));
  cerca(r.dfn, ref('rat_dfn')); cerca(r.dfnEbitda, ref('rat_dfn_ebitda')); cerca(r.autonomiaFinanciera, ref('rat_autonomia'));
  cerca(r.fondoManiobra, ref('rat_fm')); cerca(r.liquidez, ref('rat_liquidez')); cerca(r.tesoreriaNeta, ref('rat_tes_neta'));
  cerca(r.dscr, ref('rat_dscr')); cerca(r.coberturaIntereses, ref('rat_cobertura')); cerca(r.roe, ref('rat_roe')); cerca(r.roa, ref('rat_roa'));
  cerca(F.crecimiento(2000000, 1850000), ref('rat_crec_ventas'));
});

test('P-018 ratiosFinancieros: denominadores en 0 → null; EBITDA ≤ 0 y FP ≤ 0 → no significativo', () => {
  const r = F.ratiosFinancieros({ ...DATOS_EF, pasivoCorriente: 0, servicioDeuda: 0, gastosFinancieros: 0, ebit: -70000, fondosPropios: -10 });
  assert.equal(r.liquidez, null); assert.equal(r.dscr, null); assert.equal(r.coberturaIntereses, null);
  assert.equal(r.ebitda, 0); assert.equal(r.dfnEbitda, null); assert.equal(r.roe, null);
  assert.equal(F.crecimiento(100, 0), null);
  assert.throws(() => F.ratiosFinancieros({ ...DATOS_EF, ventas: Number.NaN }));
});

test('P-019 semáforos: umbrales DFN/EBITDA (3x, 5x) y DSCR (1,00x, 1,20x) por definición', () => {
  const s = (dfn, ebitda) => F.semaforoDfnEbitda({ dfn, ebitda });
  assert.deepEqual([s(2.99, 1).nivel, s(3, 1).nivel, s(4.99, 1).nivel, s(5, 1).nivel], ['ok', 'vigilancia', 'vigilancia', 'alto']);
  assert.equal(s(-1, 1).texto, 'caja neta positiva');
  assert.equal(s(100, 0).nivel, 'nd'); assert.equal(s(100, -5).nivel, 'nd');
  assert.deepEqual([F.semaforoDscr(1.2).texto, F.semaforoDscr(1.19).texto, F.semaforoDscr(1).texto, F.semaforoDscr(0.99).texto],
    ['aceptable', 'ajustado', 'ajustado', 'no cubre el servicio de la deuda']);
  assert.equal(F.semaforoDscr(null).nivel, 'nd');
});

test('P-020 periodosMedios y NOF = LibreOffice (circ_*), con y sin IVA', () => {
  const base = { ventas: 2400000, compras: 1500000, costeVentas: 1600000, clientes: 480000, proveedores: 300000, existencias: 250000, dias: 365 };
  const con = F.periodosMedios({ ...base, iva: 0.21 });
  cerca(con.pmc, ref('circ_pmc_iva')); cerca(con.pmp, ref('circ_pmp_iva')); cerca(con.pma, ref('circ_pma'));
  cerca(con.cicloCaja, ref('circ_ciclo_caja_iva'));
  const sin = F.periodosMedios(base);
  cerca(sin.pmc, ref('circ_pmc')); cerca(sin.cicloMaduracion, ref('circ_ciclo_mad'));
  cerca(F.necesidadesOperativas({ existencias: 250000, clientes: 480000, proveedores: 300000, tesoreriaOperativa: 20000, otrosAcreedores: 30000 }), ref('circ_nof'));
  assert.throws(() => F.periodosMedios({ ...base, ventas: 0 }), /ventas/);
  assert.throws(() => F.periodosMedios({ ...base, costeVentas: 0 }), /coste de ventas/);
});

test('P-021 costePolizaCredito = LibreOffice (pol_*): trimestral Act/360 y mensual Act/365 con excedido', () => {
  const p = F.costePolizaCredito({ limite: 200000, meses: 12, tipo: 0.05, saldoMedio: 120000, apertura: 0.005, estudio: 0.0025, noDisponibilidad: 0.001, periodosAnio: 4 });
  cerca(p.interesesPeriodo, ref('pol_int_trim')); cerca(p.intereses, ref('pol_int')); cerca(p.comisionNoDisponibilidad, ref('pol_nodisp'));
  cerca(p.costeTotal, ref('pol_total')); cerca(p.costeEfectivo, ref('pol_tae'), 1e-9);
  const q = F.costePolizaCredito({ limite: 200000, meses: 12, tipo: 0.06, saldoMedio: 150000, apertura: 0.005, noDisponibilidad: 0.0015,
    periodosAnio: 12, base: 'ACT/365', tipoExcedido: 0.12, saldoExcedido: 10000 });
  cerca(q.costeTotal, ref('pol2_total')); cerca(q.costeEfectivo, ref('pol2_tae'), 1e-9);
  assert.throws(() => F.costePolizaCredito({ limite: 100, meses: 12, tipo: 0.05, saldoMedio: 200 }), /límite/);
  assert.throws(() => F.costePolizaCredito({ limite: 100, meses: 5, tipo: 0.05, saldoMedio: 50, periodosAnio: 4 }), /plazo/);
});

test('P-022 comisionesPeriodicas = LibreOffice (ava_*): periodos iniciados y mínimo', () => {
  const a = F.comisionesPeriodicas({ importe: 100000, tasaAnual: 0.01, dias: 365, periodosAnio: 4, minimo: 30 });
  assert.equal(a.periodos, 4); assert.equal(a.aplicaMinimo, false);
  cerca(a.total + 500 + 50, ref('ava_total'));
  const b = F.comisionesPeriodicas({ importe: 10000, tasaAnual: 0.01, dias: 200, periodosAnio: 4, minimo: 30 });
  assert.equal(b.periodos, 3); assert.equal(b.aplicaMinimo, true);
  cerca(b.total + 50 + 50, ref('ava2_total'));
  // Un periodo exacto no cuenta como dos (por definición: 365/4 días × 4 = 365).
  assert.equal(F.comisionesPeriodicas({ importe: 1, tasaAnual: 0, dias: 365, periodosAnio: 1 }).periodos, 1);
  assert.throws(() => F.comisionesPeriodicas({ importe: 0, tasaAnual: 0.01, dias: 10 }));
});

// --- Fase 8: renta fija y renta variable -------------------------------------
test('P-023 diferencialPb y serieDiferencial = LibreOffice (rf_*)', () => {
  cerca(F.diferencialPb(4.066, 3.416), ref('rf_prima_es'));
  cerca(F.diferencialPb(3.3121, 3.0168), ref('rf_pendiente'));
  assert.deepEqual(F.serieDiferencial([['2026-09-01', 4], ['2026-10-01', 4.066]], [['2026-10-01', 3.416], ['2026-11-01', 3.3]]),
    [['2026-10-01', 65]]); // solo fechas comunes; 65 pb = rf_prima_es
});

test('P-024 precioBono y tirBono = LibreOffice (VA y TASA: bono_*)', () => {
  cerca(F.precioBono({ cupon: 0.03, tir: 0.035, anios: 10 }), ref('bono_precio_anual'));
  cerca(F.precioBono({ cupon: 0.03, tir: 0.045, anios: 10 }), ref('bono_precio_100pb'));
  cerca(F.precioBono({ cupon: 0.04, tir: 0.046, anios: 5, frecuencia: 2 }), ref('bono_precio_sem'));
  cerca(F.tirBono({ precio: 95.84, cupon: 0.03, anios: 10 }), ref('bono_tir_9584'), 1e-9);
  cerca(F.tirBono({ precio: 102, cupon: 0.04, anios: 5, frecuencia: 2 }), ref('bono_tir_sem'), 1e-9);
  // Por definición: si la TIR es igual al cupón, el bono cotiza a la par.
  cerca(F.precioBono({ cupon: 0.03, tir: 0.03, anios: 7 }), 100);
  assert.throws(() => F.precioBono({ cupon: 0.03, tir: 0.03, anios: 2.5 }));
});

test('P-025 rentabilidadAcumulada = LibreOffice (ind_*)', () => {
  const r = F.rentabilidadAcumulada(10000, 11500, 730);
  cerca(r.acumulada, ref('ind_acum')); cerca(r.anualizada, ref('ind_anual'));
  assert.throws(() => F.rentabilidadAcumulada(0, 1, 10));
});
