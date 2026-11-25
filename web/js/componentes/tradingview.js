// Componente aislado de TradingView (única excepción documentada a "sin terceros", AGENTS.md §5).
//
// Aislamiento: no se carga NINGÚN script de TradingView en esta web. Cada widget es un
// <iframe> que apunta al dominio de widgets de TradingView, con `sandbox`: el contenido corre
// en su propio origen y no puede leer esta página ni lo que el usuario escribe en ella.
// Este archivo es el único de la web que conoce las direcciones de TradingView (lo comprueba
// tests/estructura.test.js) y la CSP de index.html solo permite ese dominio en frame-src.
//
// La dirección /embed-widget/<tipo>/ es la que generan los scripts oficiales de inserción de
// TradingView (comprobada en la web publicada el 2026-11-24, D-026), pero no es una API
// documentada. Si cambia, los widgets se quedan en blanco y basta con actualizar ORIGEN o RUTA.

export const ORIGEN = 'https://www.tradingview-widget.com';
const RUTA = '/embed-widget/';
const TIPOS = new Set(['tickers', 'market-quotes', 'events']);

/** Símbolo de TradingView para un par (proveedor ICE / FX_IDC; comprobado, D-026). */
export const simbolo = (par) => `FX_IDC:${par}`;

/** Dirección del widget: la configuración va en el fragmento (#), que no se envía al servidor.
 *  En tema oscuro el widget pinta su propio fondo oscuro (isTransparent: false): si fuera
 *  transparente, se vería el fondo que pone el navegador detrás del iframe, que puede ser
 *  blanco (D-028). En tema claro sigue transparente sobre el fondo de la página. */
export function urlWidget(tipo, config) {
  if (!TIPOS.has(tipo)) throw new Error(`Widget de TradingView no permitido: ${tipo}`);
  const transparente = config?.colorTheme !== 'dark';
  const conf = { width: '100%', height: '100%', isTransparent: transparente, locale: 'es', ...config };
  return `${ORIGEN}${RUTA}${tipo}/?locale=es#${encodeURIComponent(JSON.stringify(conf))}`;
}

/** Configuraciones de los tres widgets que usa el panel. */
export const configTickers = (pares, tema) => ({
  colorTheme: tema, showSymbolLogo: false,
  symbols: pares.map((p) => ({ proName: simbolo(p), title: `${p.slice(0, 3)}/${p.slice(3)}` })),
});

export const configCotizaciones = (nombreGrupo, pares, tema) => ({
  colorTheme: tema, showSymbolLogo: false,
  symbolsGroups: [{ name: nombreGrupo, symbols: pares.map((p) => ({ name: simbolo(p), displayName: `${p.slice(0, 3)}/${p.slice(3)}` })) }],
});

/** Calendario: zona euro (eu y sus mayores economías), EE. UU., Reino Unido y Japón. */
export const PAISES_CALENDARIO = 'eu,de,fr,it,es,us,gb,jp';
export const configCalendario = (tema) => ({
  colorTheme: tema, importanceFilter: '0,1', countryFilter: PAISES_CALENDARIO,
});

/** Crea el iframe aislado (necesita DOM). */
export function iframeWidget(tipo, config, titulo) {
  const f = document.createElement('iframe');
  f.src = urlWidget(tipo, config);
  f.title = titulo;
  f.className = 'tv-widget';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer';
  // Origen propio de TradingView (allow-same-origin se refiere a SU origen, distinto del nuestro);
  // sin acceso a esta página. Los enlaces del widget se abren en pestaña nueva.
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  return f;
}
