// Tests de las operaciones. Referencias: LibreOffice Calc (referencias/referencias.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OPERACIONES, cargarOperacion } from '../operaciones/indice.js';
import { leerCampos, TIPOS_CAMPO } from '../../web/js/lib/campos.js';
import { CATEGORIAS } from '../../web/js/lib/categorias.js';

const REF = JSON.parse(readFileSync(new URL('./referencias/referencias.json', import.meta.url), 'utf8')).valores;
const ref = (id) => REF[id].valor;
function cerca(real, esperado, tolRel = 1e-10) {
  assert.ok(Math.abs(real - esperado) <= Math.max(Math.abs(esperado) * tolRel, 1e-12), `obtenido ${real}, esperado ${esperado}`);
}
const valor = (res, id) => {
  const r = res.resultados.find((x) => x.id === id);
  assert.ok(r, `falta el resultado ${id}`);
  return r.valor;
};
/** Ejecuta la operación con sus valores por defecto modificados por `textos`. */
async function ejecutar(id, textos = {}) {
  const op = await cargarOperacion(id);
  const { valores, errores } = leerCampos(op.campos, textos);
  assert.deepEqual(errores, {});
  return op.calcular(valores);
}

// --- Contrato común --------------------------------------------------------
const FORMATO = /^(eur|entero|texto|pct(:\d+)?|num:\d+|veces:\d+|dias:\d+|divisa:[A-Z]{3}:\d+)$/;

for (const id of OPERACIONES) {
  test(`contrato: ${id}`, async () => {
    const op = await cargarOperacion(id);
    assert.equal(op.id, id);
    assert.ok(op.titulo && op.resumen && op.ficha);
    assert.ok(CATEGORIAS.some((c) => c.slug === op.categoria), 'categoría no válida');
    const ids = new Set();
    for (const c of op.campos) {
      assert.ok(TIPOS_CAMPO.includes(c.tipo), `tipo de campo no válido: ${c.tipo}`);
      assert.ok(!ids.has(c.id), `campo repetido ${c.id}`); ids.add(c.id);
    }
    const res = await ejecutar(id); // los valores por defecto deben funcionar
    assert.ok(res.resultados.length > 0);
    for (const r of res.resultados) assert.match(r.formato, FORMATO, `${r.id}: formato`);
    for (const k of ['base', 'periodicidad', 'nominalEfectivo', 'comisiones']) {
      assert.ok(res.convenciones[k], `falta convención ${k}`);
    }
    assert.ok(res.resultados.some((r) => r.destacado), 'debe haber un resultado destacado');
  });
}

// --- 1. Seguro de cambio ---------------------------------------------------
test('fx-forward: EUR/USD, EUR/GBP (Act/365 automático) y EUR/JPY', async () => {
  cerca(valor(await ejecutar('fx-forward', { spot: '1,0850', tipoEur: '3', tipoDivisa: '4,5', dias: '90' }), 'forward'), ref('fwd_usd'));
  cerca(valor(await ejecutar('fx-forward', { par: 'GBP', spot: '0,85', tipoEur: '3', tipoDivisa: '4,75', dias: '180' }), 'forward'), ref('fwd_gbp'));
  const jpy = await ejecutar('fx-forward', { par: 'JPY', spot: '162,35', tipoEur: '3', tipoDivisa: '0,5', dias: '90' });
  cerca(valor(jpy, 'forward'), ref('fwd_jpy'));
  cerca(valor(jpy, 'puntos'), (ref('fwd_jpy') - 162.35) * 100);
});

test('fx-forward: base de la divisa forzada a mano', async () => {
  // GBP forzado a Act/360 debe coincidir con USD-like: S·(1+r·d/360)/(1+r€·d/360)
  const r = await ejecutar('fx-forward', { par: 'GBP', spot: '0,85', tipoEur: '3', tipoDivisa: '4,75', dias: '180', baseDivisa: 'ACT/360' });
  cerca(valor(r, 'forward'), 0.85 * (1 + 0.0475 * 0.5) / (1 + 0.03 * 0.5));
});

// --- 2. Conversión BCE -----------------------------------------------------
test('fx-conversion-bce: conversiones y decimales del JPY', async () => {
  assert.equal(valor(await ejecutar('fx-conversion-bce', { importe: '10000', tipo: '1,085' }), 'resultado'), ref('conv_eur_usd'));
  assert.equal(valor(await ejecutar('fx-conversion-bce', { importe: '5000', tipo: '1,085', sentido: 'DIV->EUR' }), 'resultado'), ref('conv_usd_eur'));
  assert.equal(valor(await ejecutar('fx-conversion-bce', { divisa: 'JPY', importe: '1000', tipo: '162,35' }), 'resultado'), ref('conv_eur_jpy'));
  assert.equal(valor(await ejecutar('fx-conversion-bce', { divisa: 'JPY', importe: '250000', tipo: '162,35', sentido: 'DIV->EUR' }), 'resultado'), ref('conv_jpy_eur'));
});

// --- 3. Préstamo -----------------------------------------------------------
test('prestamo-amortizacion: francés con carencia parcial y total', async () => {
  const p = await ejecutar('prestamo-amortizacion');
  cerca(valor(p, 'cuota'), ref('fr_carp_cuota'));
  cerca(valor(p, 'intereses'), ref('fr_carp_int'));
  assert.equal(p.tabla.filas.length, 60);
  const t = await ejecutar('prestamo-amortizacion', { tipoCarencia: 'total' });
  cerca(valor(t, 'capitalTrasCarencia'), ref('fr_cart_cap'));
  cerca(valor(t, 'cuota'), ref('fr_cart_cuota'));
  cerca(valor(t, 'intereses'), ref('fr_cart_int'));
});

test('prestamo-amortizacion: alemán y periodicidad trimestral', async () => {
  const a = await ejecutar('prestamo-amortizacion', { sistema: 'aleman', carencia: '0' });
  cerca(valor(a, 'cuota'), ref('al_cuota1'));
  cerca(valor(a, 'intereses'), ref('al_int'));
  const q = await ejecutar('prestamo-amortizacion', { capital: '50000', tin: '6', periodicidad: '4', periodos: '12', carencia: '0' });
  cerca(valor(q, 'cuota'), ref('fr_trim_cuota'));
});

test('prestamo-amortizacion: americano (bullet), sin y con carencia total', async () => {
  const b = await ejecutar('prestamo-amortizacion', { sistema: 'americano', carencia: '0' });
  cerca(valor(b, 'cuota'), ref('am_cuota'));
  cerca(valor(b, 'ultima'), ref('am_ultima'));
  cerca(valor(b, 'intereses'), ref('am_int'));
  assert.ok(b.tabla.filas.slice(0, -1).every((f) => f.amortizacion === 0 && f.pendiente === 100000));
  assert.equal(b.tabla.filas.at(-1).pendiente, 0);
  assert.ok(b.avisos.some((a) => a.includes('Bullet')));
  const t = await ejecutar('prestamo-amortizacion', { sistema: 'americano', tipoCarencia: 'total' });
  cerca(valor(t, 'intereses'), ref('am_cart_int'), 1e-10);
});

// --- 4. Descuento / confirming --------------------------------------------
test('descuento-comercial: caso general, comisión mínima y confirming', async () => {
  const d = await ejecutar('descuento-comercial');
  cerca(valor(d, 'intereses'), ref('dto_int'));
  cerca(valor(d, 'comision'), ref('dto_com'));
  cerca(valor(d, 'efectivo'), ref('dto_efe'));
  cerca(valor(d, 'costeEfectivo'), ref('dto_tae'));
  const m = await ejecutar('descuento-comercial', { nominal: '800', dias: '30' });
  cerca(valor(m, 'efectivo'), ref('dto2_efe'));
  cerca(valor(m, 'costeEfectivo'), ref('dto2_tae'));
  assert.ok(m.avisos.some((a) => a.includes('mínima')));
  const c = await ejecutar('descuento-comercial', { modalidad: 'confirming', nominal: '50000', dias: '90', tipo: '4,5', comision: '0,25', comisionMinima: '0', gastos: '0' });
  cerca(valor(c, 'efectivo'), ref('conf_efe'));
  cerca(valor(c, 'costeEfectivo'), ref('conf_tae'));
});

// --- 5. TIN / TAE ----------------------------------------------------------
test('tin-tae: conversiones y TAE con comisión de apertura', async () => {
  cerca(valor(await ejecutar('tin-tae', { tipo: '6' }), 'tae'), ref('tae_6_12'));
  cerca(valor(await ejecutar('tin-tae', { tipo: '5', periodicidad: '4' }), 'tae'), ref('tae_5_4'));
  cerca(valor(await ejecutar('tin-tae', { tipo: '6', sentido: 'TAE->TIN' }), 'tin'), ref('tin_6_12'));
  cerca(valor(await ejecutar('tin-tae', { tipo: '6', comision: '1', capital: '10000', cuotas: '36' }), 'taeComision'), ref('tae_com'), 1e-9);
});

// --- 6. Rentabilidad y volatilidad ----------------------------------------
test('rentabilidad-volatilidad: serie de ejemplo', async () => {
  const r = await ejecutar('rentabilidad-volatilidad');
  cerca(valor(r, 'total'), ref('rent_total'));
  cerca(valor(r, 'volLog'), ref('vol_l_252'));
  cerca(valor(r, 'volSimple'), ref('vol_s_252'));
  cerca(valor(r, 'mediaLog'), ref('media_l'));
  cerca(valor(r, 'varLog'), ref('var_l'));
  cerca(valor(await ejecutar('rentabilidad-volatilidad', { periodosAnio: '12' }), 'volLog'), ref('vol_l_12'));
  assert.equal(r.tabla.filas.length, 6);
});

test('rentabilidad-volatilidad: acepta series pegadas con «;» y coma decimal', async () => {
  const r = await ejecutar('rentabilidad-volatilidad', { precios: '100;102;101;105;104;108' });
  cerca(valor(r, 'volLog'), ref('vol_l_252'));
  assert.match(leerCampos([{ id: 'p', tipo: 'serie' }], { p: '100\nabc' }).errores.p, /posición 2/);
});

// --- 7. VAN / TIR ----------------------------------------------------------
test('van-tir: VAN y TIR = LibreOffice', async () => {
  const r = await ejecutar('van-tir');
  cerca(valor(r, 'van'), ref('van_b'));
  cerca(valor(r, 'tir'), ref('tir_b'), 1e-9);
  const a = await ejecutar('van-tir', { flujos: '-100\n39\n59\n55\n20', tasa: '10' });
  cerca(valor(a, 'van'), ref('van_a'));
  cerca(valor(a, 'tir'), ref('tir_a'), 1e-9);
});

test('van-tir: aviso de varias TIR y caso sin TIR', async () => {
  const r = await ejecutar('van-tir', { flujos: '-100\n230\n-132' });
  assert.ok(r.avisos.some((a) => a.includes('varias TIR')));
  const s = await ejecutar('van-tir', { flujos: '100\n50' });
  assert.ok(Number.isNaN(valor(s, 'tir')));
});

// --- 8. Hipoteca variable --------------------------------------------------
test('hipoteca-variable: revisión anual', async () => {
  const r = await ejecutar('hipoteca-variable');
  cerca(valor(r, 'cuota1'), ref('hip_cuota'));
  cerca(valor(r, 'pendiente'), ref('hip_pend'));
  cerca(valor(r, 'cuota2'), ref('hip_cuota2'));
  assert.ok(valor(r, 'variacion') < 0);
});

test('hipoteca-variable: revisión semestral', async () => {
  const r = await ejecutar('hipoteca-variable', { capital: '150000', anios: '20', euribor: '3,75', diferencial: '1', mesesRevision: '6', euriborRevision: '3,25' });
  cerca(valor(r, 'pendiente'), ref('hip6_pend'));
  cerca(valor(r, 'cuota2'), ref('hip6_cuota2'));
});

test('hipoteca-variable: TIN negativo se fija en 0 % (cuota = capital / meses)', async () => {
  const r = await ejecutar('hipoteca-variable', { euribor: '-0,60', diferencial: '0,50' });
  assert.equal(valor(r, 'tin1'), 0);
  cerca(valor(r, 'cuota1'), 200000 / 300); // definición: sin intereses
});

// --- Contraste con ejemplos de un manual externo de mercado de divisas ----
// (resultados del manual: 1,1065 y 1,1186; aquí se comparan con LibreOffice a 15 cifras)
test('fx-forward reproduce los ejemplos de manual (12 meses y 3 meses, Act/360)', async () => {
  const a = await ejecutar('fx-forward', { spot: '1,10', tipoEur: '1,2', tipoDivisa: '1,8', dias: '360' });
  cerca(valor(a, 'forward'), ref('fwd_libro_12m'));
  assert.equal(valor(a, 'forward').toFixed(4), '1.1065');
  const b = await ejecutar('fx-forward', { spot: '1,12', tipoEur: '1', tipoDivisa: '0,5', dias: '90' });
  cerca(valor(b, 'forward'), ref('fwd_libro_3m'));
  assert.equal(valor(b, 'forward').toFixed(4), '1.1186');
  assert.ok(valor(b, 'puntos') < 0); // el euro (tipo mayor) cotiza con descuento
});

// --- Fase 2: relleno con el tipo BCE y nuevas divisas del forward ----------
test('campos con rellenarCon apuntan a un campo de divisa existente', async () => {
  for (const id of ['fx-conversion-bce', 'fx-forward']) {
    const op = await cargarOperacion(id);
    const c = op.campos.filter((x) => x.rellenarCon);
    assert.equal(c.length, 1, id);
    assert.equal(c[0].rellenarCon.fuente, 'bce');
    assert.ok(op.campos.some((x) => x.id === c[0].rellenarCon.divisa && x.tipo === 'seleccion'), id);
  }
});

test('fx-forward: las 9 divisas del panel tienen base y la de AUD es Act/365', async () => {
  const op = await cargarOperacion('fx-forward');
  const pares = op.campos.find((c) => c.id === 'par').opciones.map((o) => o.valor);
  assert.deepEqual(pares, ['USD', 'GBP', 'JPY', 'CHF', 'CNY', 'AUD', 'CAD', 'HKD', 'NZD', 'OTRA']);
  const auto = await ejecutar('fx-forward', { par: 'AUD', spot: '1,65', tipoEur: '3', tipoDivisa: '4', dias: '180' });
  const forzado = await ejecutar('fx-forward', { par: 'AUD', spot: '1,65', tipoEur: '3', tipoDivisa: '4', dias: '180', baseDivisa: 'ACT/365' });
  assert.equal(valor(auto, 'forward'), valor(forzado, 'forward'));
  assert.ok(!auto.avisos.some((a) => a.includes('Act/360 supuesta')));
});

test('fx-forward: aviso ⚠️ solo en las bases sin verificar (CNY, NZD)', async () => {
  const datos = { spot: '7,8', tipoEur: '3', tipoDivisa: '2', dias: '90' };
  for (const par of ['CNY', 'NZD']) {
    assert.ok((await ejecutar('fx-forward', { ...datos, par })).avisos.some((a) => a.includes(`base`) && a.includes(par)), par);
  }
  for (const par of ['USD', 'AUD', 'CAD', 'HKD']) {
    assert.ok(!(await ejecutar('fx-forward', { ...datos, par })).avisos.some((a) => a.includes('⚠️')), par);
  }
});

// --- Fase 5: escenarios ----------------------------------------------------
test('escenario-tipo-cambio: EUR/USD −5 % = contravalores de LibreOffice; signo según cobro o pago', async () => {
  const c = await ejecutar('escenario-tipo-cambio');
  cerca(valor(c, 'actual'), ref('esc_fx_actual'));
  cerca(valor(c, 'escenario'), ref('esc_fx_menos5'));
  cerca(valor(c, 'impacto'), ref('esc_fx_menos5') - ref('esc_fx_actual'));
  const p = await ejecutar('escenario-tipo-cambio', { posicion: 'pago' });
  cerca(valor(p, 'impacto'), ref('esc_fx_actual') - ref('esc_fx_menos5'));
  assert.ok(c.tabla.filas.some((f) => Math.abs(f.movimiento + 0.05) < 1e-12));
  assert.ok(c.avisos.some((a) => a.includes('no una proyección')));
});

test('escenario-euribor: +100 pb = PAGO() de LibreOffice; tabla de choques y suelo del TIN', async () => {
  const r = await ejecutar('escenario-euribor');
  cerca(valor(r, 'cuota0'), ref('esc_eur_cuota'));
  cerca(valor(r, 'cuota1'), ref('esc_eur_mas100'));
  cerca(valor(r, 'diferencia'), ref('esc_eur_mas100') - ref('esc_eur_cuota'));
  assert.deepEqual(r.tabla.filas.map((f) => f.choque), [-200, -100, -50, 0, 50, 100, 200]);
  const suelo = await ejecutar('escenario-euribor', { euribor: '0,5', diferencial: '0,5', choque: '-200' });
  assert.equal(valor(suelo, 'tin1'), 0);
});

test('D-013: las variaciones de cuota e intereses se marcan como coste (color invertido)', async () => {
  for (const [id, campos] of [['hipoteca-variable', ['variacion', 'variacionAnual']], ['escenario-euribor', ['diferencia', 'diferenciaAnual', 'interesesExtra']]]) {
    const r = await ejecutar(id);
    for (const c of campos) assert.equal(r.resultados.find((x) => x.id === c).variacion, 'coste', `${id}.${c}`);
  }
  const css = (await import('node:fs')).readFileSync(new URL('../../web/css/base.css', import.meta.url), 'utf8');
  assert.match(css, /\.var-up\.var--coste\s*\{\s*color:\s*var\(--color-down\)/);
  assert.match(css, /\.var-down\.var--coste\s*\{\s*color:\s*var\(--color-up\)/);
});

test('D-013: el CSS de resultados no anula la inversión de color de los costes', async () => {
  const css = (await import('node:fs')).readFileSync(new URL('../../web/css/componentes.css', import.meta.url), 'utf8');
  assert.match(css, /\.res__valor\.var-up\.var--coste\s*\{\s*color:\s*var\(--color-down\)/);
  assert.match(css, /\.res__valor\.var-down\.var--coste\s*\{\s*color:\s*var\(--color-up\)/);
});

// --- Fase 7: empresas -------------------------------------------------------
test('analisis-estados-financieros: ratios = LibreOffice, semáforos y año anterior', async () => {
  const r = await ejecutar('analisis-estados-financieros');
  for (const [id, k] of [['ebitda', 'rat_ebitda'], ['margenEbitda', 'rat_margen_ebitda'], ['margenNeto', 'rat_margen_neto'], ['dfn', 'rat_dfn'],
    ['dfnEbitda', 'rat_dfn_ebitda'], ['autonomia', 'rat_autonomia'], ['fondoManiobra', 'rat_fm'], ['liquidez', 'rat_liquidez'],
    ['tesoreriaNeta', 'rat_tes_neta'], ['dscr', 'rat_dscr'], ['coberturaIntereses', 'rat_cobertura'], ['roe', 'rat_roe'], ['roa', 'rat_roa']]) {
    cerca(valor(r, id), ref(k));
  }
  assert.equal(r.resultados.find((x) => x.id === 'resumenDfnEbitda').estado.texto, 'cómodo');
  assert.equal(r.resultados.find((x) => x.id === 'resumenDscr').estado.texto, 'aceptable');
  assert.ok(!r.resultados.some((x) => x.id === 'crecimientoVentas'), 'sin año anterior no hay crecimiento');
  assert.ok(r.avisos.some((a) => a.includes('no criterios de ningún banco')));
  // Año anterior: mismas cifras salvo ventas 1.850.000
  const ant = { conAnterior: 'si' };
  const op = (await import('../operaciones/analisis-estados-financieros.js')).default;
  for (const c of op.campos.filter((x) => x.grupo === 'Año actual')) ant[`${c.id}Ant`] = c.defecto;
  ant.ventasAnt = '1.850.000';
  const c = await ejecutar('analisis-estados-financieros', ant);
  cerca(valor(c, 'crecimientoVentas'), ref('rat_crec_ventas'));
  cerca(c.resultados.find((x) => x.id === 'dfnEbitda').anterior, ref('rat_dfn_ebitda'));
});

test('analisis-estados-financieros: EBITDA ≤ 0, caja neta, divisiones por cero y año anterior incompleto', async () => {
  const neg = await ejecutar('analisis-estados-financieros', { ebit: '-70.000', amortizaciones: '70.000' });
  assert.equal(valor(neg, 'dfnEbitda'), 'no significativo');
  assert.ok(neg.avisos.some((a) => a.includes('EBITDA ≤ 0')));
  const caja = await ejecutar('analisis-estados-financieros', { caja: '900.000' });
  assert.equal(caja.resultados.find((x) => x.id === 'dfnEbitda').estado.texto, 'caja neta positiva');
  const cero = await ejecutar('analisis-estados-financieros', { pasivoCorriente: '0', servicioDeuda: '0', gastosFinancieros: '0', fondosPropios: '0' });
  for (const id of ['liquidez', 'dscr', 'coberturaIntereses']) assert.equal(valor(cero, id), 'no calculable');
  assert.equal(valor(cero, 'roe'), 'no significativo');
  assert.equal(cero.avisos.filter((a) => a.includes('división por cero')).length, 3);
  const op = (await import('../operaciones/analisis-estados-financieros.js')).default;
  const { valores } = leerCampos(op.campos, { ventas: '0' });
  assert.throws(() => op.calcular(valores), /Ventas.*mayor que 0/);
  const { valores: v2 } = leerCampos(op.campos, { conAnterior: 'si' });
  assert.throws(() => op.calcular(v2), /año anterior/);
});

test('circulante-nof: periodos con IVA, NOF y comparación con el fondo de maniobra = LibreOffice', async () => {
  const r = await ejecutar('circulante-nof', { conIva: 'si', tesoreriaOperativa: '20.000', otrosAcreedores: '30.000' });
  cerca(valor(r, 'pmc'), ref('circ_pmc_iva')); cerca(valor(r, 'pmp'), ref('circ_pmp_iva')); cerca(valor(r, 'pma'), ref('circ_pma'));
  cerca(valor(r, 'cicloCaja'), ref('circ_ciclo_caja_iva')); cerca(valor(r, 'nof'), ref('circ_nof'));
  cerca(valor(r, 'diferencia'), 300000 - ref('circ_nof'));
  assert.match(r.resultados.find((x) => x.id === 'diferencia').estado.texto, /déficit/);
  const sin = await ejecutar('circulante-nof', { fondoManiobra: '500.000' });
  cerca(valor(sin, 'pmc'), ref('circ_pmc')); cerca(valor(sin, 'cicloMaduracion'), ref('circ_ciclo_mad'));
  assert.match(sin.resultados.find((x) => x.id === 'diferencia').estado.texto, /exceso/);
  assert.ok(r.resultados.find((x) => x.id === 'pmc').etiqueta.includes('PMR'), 'menciona el alias PMR');
});

test('poliza-credito: coste total y coste efectivo = LibreOffice; validaciones', async () => {
  const r = await ejecutar('poliza-credito');
  cerca(valor(r, 'intereses'), ref('pol_int')); cerca(valor(r, 'comisionNoDisponibilidad'), ref('pol_nodisp'));
  cerca(valor(r, 'costeTotal'), ref('pol_total')); cerca(valor(r, 'costeEfectivo'), ref('pol_tae'), 1e-9);
  const q = await ejecutar('poliza-credito', { saldoMedio: '150.000', tipo: '6', periodicidad: '12', base: 'ACT/365', estudio: '0',
    noDisponibilidad: '0,15', conExcedido: 'si', saldoExcedido: '10.000', tipoExcedido: '12' });
  cerca(valor(q, 'costeTotal'), ref('pol2_total')); cerca(valor(q, 'costeEfectivo'), ref('pol2_tae'), 1e-9);
  const op = (await import('../operaciones/poliza-credito.js')).default;
  assert.throws(() => op.calcular(leerCampos(op.campos, { saldoMedio: '250.000' }).valores), /límite/);
  assert.throws(() => op.calcular(leerCampos(op.campos, { meses: '5' }).valores), /múltiplo de 3/);
});

test('prestamo-amortizacion: comisiones, coste total y TAE con comisiones = LibreOffice', async () => {
  const r = await ejecutar('prestamo-amortizacion', { carencia: '0' });
  cerca(valor(r, 'taeComisiones'), ref('pre_com_tae'), 1e-9);
  cerca(valor(r, 'costeTotal'), ref('pre_com_total'));
  assert.ok(r.avisos.some((a) => a.includes('días/365')), 'mantiene el aviso de periodos iguales');
  const sin = await ejecutar('prestamo-amortizacion', { apertura: '0', estudio: '0', gastos: '0' });
  assert.ok(!sin.resultados.some((x) => x.id === 'taeComisiones'));
});

test('factoring: anticipo, efectivo y coste efectivo = LibreOffice; avisos de recurso', async () => {
  const r = await ejecutar('factoring');
  cerca(valor(r, 'intereses'), ref('fac_int')); cerca(valor(r, 'efectivo'), ref('fac_efe')); cerca(valor(r, 'costeEfectivo'), ref('fac_tae'));
  assert.ok(r.avisos[0].startsWith('Con recurso'));
  assert.ok((await ejecutar('factoring', { modalidad: 'sin' })).avisos[0].startsWith('Sin recurso'));
  const op = (await import('../operaciones/factoring.js')).default;
  assert.throws(() => op.calcular(leerCampos(op.campos, { anticipo: '120' }).valores), /anticipo/);
});

test('confirming (cliente pagador): aplazamiento y coste efectivo = LibreOffice; sin aplazamiento', async () => {
  const r = await ejecutar('confirming');
  cerca(valor(r, 'intereses'), ref('cnf_int')); cerca(valor(r, 'costeEfectivo'), ref('cnf_tae'));
  const sin = await ejecutar('confirming', { diasAplazamiento: '0' });
  assert.equal(valor(sin, 'costeTotal'), 50); // por definición: 50.000 × 0,10 %
  assert.ok(!sin.resultados.some((x) => x.id === 'costeEfectivo'));
});

test('avales: coste total y % anual = LibreOffice; mínimo por periodo y plazo parcial', async () => {
  const r = await ejecutar('avales');
  cerca(valor(r, 'costeTotal'), ref('ava_total')); cerca(valor(r, 'costeAnual'), ref('ava_anual'));
  const b = await ejecutar('avales', { importe: '10.000', dias: '200' });
  cerca(valor(b, 'costeTotal'), ref('ava2_total')); cerca(valor(b, 'costeAnual'), ref('ava2_anual'));
  assert.ok(b.avisos.includes('Se aplica el mínimo por periodo.'));
});

test('D-013 (fase 7): los sobrecostes de las operaciones de coste se marcan como coste', async () => {
  for (const id of ['poliza-credito', 'factoring', 'confirming', 'avales', 'prestamo-amortizacion']) {
    const r = await ejecutar(id);
    const s = r.resultados.find((x) => x.id === 'sobrecoste');
    assert.ok(s, `${id}: falta el sobrecoste`);
    assert.equal(s.variacion, 'coste', `${id}: sobrecoste sin variacion 'coste'`);
  }
});

test('fase 7: las operaciones nuevas son de la categoría empresas y avisan de lo pendiente de verificar', async () => {
  for (const id of ['analisis-estados-financieros', 'circulante-nof', 'poliza-credito', 'factoring', 'confirming', 'avales']) {
    const op = await cargarOperacion(id);
    assert.equal(op.categoria, 'empresas');
    assert.ok(op.tituloIngles, `${id}: falta el término inglés`);
  }
});
