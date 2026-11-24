// Tests de las 8 operaciones. Referencias: LibreOffice Calc (referencias/referencias.json).
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
const FORMATO = /^(eur|entero|texto|pct(:\d+)?|num:\d+|divisa:[A-Z]{3}:\d+)$/;

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
