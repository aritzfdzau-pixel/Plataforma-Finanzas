// Tests del panel de divisas: utilidades puras y componente aislado de TradingView.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DIVISAS_PANEL, CABECERA, MAJORS, AVISO_CNY_CNH, nombrePar, decimalesTipo, tipoBce, aTextoCampo, fechaEs,
  enlaceForward, enlaceConversion,
} from '../web/js/lib/divisas.js';
import {
  ORIGEN, urlWidget, configTickers, configCotizaciones, configCalendario, PAISES_CALENDARIO,
} from '../web/js/componentes/tradingview.js';
import { leerNumero } from '../web/js/lib/formato.js';
import { DIVISAS_BCE } from '../operativa/operaciones/fx-conversion-bce.js';
import { parsearXmlBce, construirDatosBce } from '../scripts/bce.js';

const DATOS = construirDatosBce(parsearXmlBce(readFileSync(new URL('./fixtures/bce-90d.xml', import.meta.url), 'utf8')), 'x');

test('pares que pide el plan: contra el euro, majors y cabecera', () => {
  assert.deepEqual(DIVISAS_PANEL.map((d) => d.codigo), ['USD', 'GBP', 'JPY', 'CHF', 'CNY', 'AUD', 'CAD', 'HKD', 'NZD']);
  assert.deepEqual(MAJORS.map(nombrePar), ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/CNH']);
  assert.deepEqual(CABECERA, ['USD', 'GBP', 'JPY']);
  // La conversión BCE ofrece las mismas divisas que el panel.
  assert.deepEqual(DIVISAS_BCE.map(([c]) => c), DIVISAS_PANEL.map((d) => d.codigo));
  assert.match(AVISO_CNY_CNH, /CNY ≠ CNH/);
  assert.throws(() => nombrePar('EUR'));
});

test('aTextoCampo: el texto vuelve a leerse como el mismo número (convención es-ES)', () => {
  for (const x of [1.085, 162.35, 0.8512, 7.8125, 1, 1234.5]) assert.equal(leerNumero(aTextoCampo(x)), x);
  assert.equal(aTextoCampo(1.085), '1,085'); // con punto se leería 1085 (separador de miles)
  assert.throws(() => aTextoCampo(NaN));
});

test('tipoBce, decimales y fechas', () => {
  assert.equal(tipoBce(DATOS, 'USD').tipo, 1.085);
  assert.equal(tipoBce(DATOS, 'CHF'), null);
  assert.equal(tipoBce(null, 'USD'), null);
  assert.equal(decimalesTipo('JPY'), 2);
  assert.equal(decimalesTipo('USD'), 4);
  assert.equal(fechaEs('2026-11-23'), '23/11/2026');
  assert.equal(fechaEs(null), '—');
});

test('enlaces a las operaciones 1 y 2 desde el panel', () => {
  assert.equal(enlaceForward('USD', DATOS), '#op=fx-forward&par=USD&spot=1%2C085');
  assert.equal(enlaceForward('CHF', DATOS), '#op=fx-forward&par=CHF'); // sin tipo BCE: spot a mano
  assert.equal(enlaceConversion('JPY'), '#op=fx-conversion-bce&divisa=JPY');
  const p = new URLSearchParams(enlaceForward('JPY', DATOS).slice(1));
  assert.equal(leerNumero(p.get('spot')), 161.2);
});

test('TradingView: solo widgets permitidos, del dominio de widgets y config en el fragmento', () => {
  const u = new URL(urlWidget('tickers', configTickers(['EURUSD'], 'dark')));
  assert.equal(u.origin, ORIGEN);
  assert.equal(u.pathname, '/embed-widget/tickers/');
  const conf = JSON.parse(decodeURIComponent(u.hash.slice(1)));
  assert.equal(conf.locale, 'es');
  assert.equal(conf.colorTheme, 'dark');
  assert.deepEqual(conf.symbols, [{ proName: 'FX_IDC:EURUSD', title: 'EUR/USD' }]);
  assert.throws(() => urlWidget('advanced-chart', {}));
});

test('TradingView: cotizaciones agrupadas y calendario filtrado por EUR, USD, GBP y JPY', () => {
  const g = configCotizaciones('Majors', ['USDJPY'], 'light');
  assert.deepEqual(g.symbolsGroups, [{ name: 'Majors', symbols: [{ name: 'FX_IDC:USDJPY', displayName: 'USD/JPY' }] }]);
  const c = configCalendario('dark');
  assert.equal(c.countryFilter, PAISES_CALENDARIO);
  for (const pais of ['eu', 'us', 'gb', 'jp']) assert.ok(PAISES_CALENDARIO.split(',').includes(pais));
});
