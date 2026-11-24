// Zona de Divisas: cabecera (EUR/USD, EUR/GBP, EUR/JPY) y panel completo.
// "tiempo real (indicativo)" = widgets de TradingView (componente aislado).
// "referencia BCE" = datos/tipos-bce.json, generado por la tarea programada diaria.
import { h, vaciar } from './dom.js';
import { formatear } from '../lib/formato.js';
import {
  DIVISAS_PANEL, CABECERA, MAJORS, AVISO_CNY_CNH, decimalesTipo, tipoBce, fechaEs, enlaceForward, enlaceConversion,
} from '../lib/divisas.js';
import { iframeWidget, configTickers, configCotizaciones, configCalendario } from '../componentes/tradingview.js';

let promesaBce = null;
/** Carga (una vez) los tipos de referencia del BCE. Devuelve null si no están publicados. */
export function cargarTiposBce() {
  promesaBce ??= fetch('../datos/tipos-bce.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return promesaBce;
}

const tema = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
const PARES_EURO = DIVISAS_PANEL.map((d) => `EUR${d.codigo}`);

function variacion(v) {
  if (!Number.isFinite(v)) return h('span', { class: 'num tc__var' }, '—');
  if (v === 0) return h('span', { class: 'num tc__var' }, formatear(0, 'pct:2'));
  return h('span', { class: `num tc__var ${v > 0 ? 'var-up' : 'var-down'}` },
    h('span', { class: 'visually-hidden' }, v > 0 ? 'sube ' : 'baja '), formatear(Math.abs(v), 'pct:2'));
}

const tipoTexto = (t) => formatear(t.tipo, `num:${decimalesTipo(t.divisa)}`);
const chip = (texto) => h('span', { class: 'chip' }, texto);

/** Cabecera de la zona: widget + fila de referencias BCE. */
export async function pintarCabeceraDivisas(cuerpo, abrirPanel) {
  const widget = h('div', { class: 'tv-marco tv-marco--tickers' });
  const pintarWidget = () => vaciar(widget).append(
    iframeWidget('tickers', configTickers(CABECERA.map((c) => `EUR${c}`), tema()), 'Cotizaciones EUR/USD, EUR/GBP y EUR/JPY (TradingView)'));
  pintarWidget();
  alCambiarTema(pintarWidget);

  const ref = h('div', { class: 'ref-bce' }, h('p', { class: 'vacio' }, 'Cargando referencia BCE…'));
  vaciar(cuerpo).append(widget, ref,
    h('button', { type: 'button', class: 'button', onclick: abrirPanel }, 'Abrir panel de divisas'));

  const datos = await cargarTiposBce();
  vaciar(ref);
  if (!datos) { ref.append(h('p', { class: 'vacio' }, 'Referencia BCE no disponible (se publica cada día hábil hacia las 16:00 CET).')); return; }
  ref.append(
    h('p', { class: 'ref-bce__titulo' }, chip('referencia BCE'), ` ${fechaEs(datos.fecha)}`),
    h('ul', { class: 'ref-bce__lista' }, CABECERA.map((c) => {
      const t = tipoBce(datos, c);
      return h('li', {}, h('span', { class: 'ref-bce__par' }, `EUR/${c}`),
        h('span', { class: 'num' }, t ? tipoTexto(t) : '—'), t ? variacion(t.variacion) : null);
    })));
}

/** Panel completo (dentro de un <dialog>). */
export async function pintarPanelDivisas(dialogo, cerrar) {
  const contenido = dialogo.querySelector('.panel__contenido');
  const pestanas = [
    { id: 'euro', titulo: 'Contra el euro', grupo: 'Contra el euro', pares: PARES_EURO },
    { id: 'majors', titulo: 'Majors (contra el dólar)', grupo: 'Majors', pares: [...MAJORS] },
  ];
  const lista = h('div', { class: 'pestanas', role: 'tablist', 'aria-label': 'Cotizaciones' });
  const paneles = h('div', {});
  const pintarPestana = (activa) => {
    vaciar(lista); vaciar(paneles);
    for (const p of pestanas) {
      const sel = p.id === activa;
      lista.append(h('button', {
        type: 'button', role: 'tab', id: `tab-${p.id}`, class: 'pestana', 'aria-selected': String(sel),
        'aria-controls': `panel-${p.id}`, tabindex: sel ? '0' : '-1', onclick: () => pintarPestana(p.id),
        onkeydown: (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const otra = pestanas[(pestanas.indexOf(p) + 1) % pestanas.length].id;
            pintarPestana(otra); lista.querySelector(`#tab-${otra}`).focus();
          }
        },
      }, p.titulo));
    }
    const p = pestanas.find((x) => x.id === activa);
    paneles.append(h('div', { role: 'tabpanel', id: `panel-${p.id}`, 'aria-labelledby': `tab-${p.id}` },
      h('p', {}, chip('tiempo real (indicativo)'), h('small', { class: 'campo__ayuda' }, ' Cotización indicativa de TradingView; no es un precio negociable.')),
      h('div', { class: 'tv-marco tv-marco--cotizaciones' },
        iframeWidget('market-quotes', configCotizaciones(p.grupo, p.pares, tema()), `Cotizaciones ${p.titulo} (TradingView)`)),
      h('p', { class: 'aviso aviso--info' }, AVISO_CNY_CNH)));
  };

  const calendario = h('div', { class: 'tv-marco tv-marco--calendario' });
  const pintarCalendario = () => vaciar(calendario).append(
    iframeWidget('events', configCalendario(tema()), 'Calendario económico EUR, USD, GBP y JPY (TradingView)'));

  let activa = 'euro';
  const repintarWidgets = () => {
    activa = lista.querySelector('[aria-selected="true"]')?.id.replace('tab-', '') ?? 'euro';
    pintarPestana(activa); pintarCalendario();
  };

  const bce = h('section', { class: 'panel__seccion', 'aria-labelledby': 'tit-bce' }, h('p', { class: 'vacio' }, 'Cargando…'));
  vaciar(contenido).append(
    h('section', { class: 'panel__seccion' }, lista, paneles),
    bce,
    h('section', { class: 'panel__seccion', 'aria-labelledby': 'tit-cal' },
      h('h3', { class: 'panel__subtitulo', id: 'tit-cal' }, 'Calendario económico (EUR · USD · GBP · JPY)'),
      h('p', {}, chip('tiempo real (indicativo)'), h('small', { class: 'campo__ayuda' }, ' Zona euro (y Alemania, Francia, Italia, España), EE. UU., Reino Unido y Japón. Importancia media y alta.')),
      calendario));
  pintarPestana(activa); pintarCalendario();
  alCambiarTema(() => { if (dialogo.open) repintarWidgets(); });

  pintarTablaBce(bce, await cargarTiposBce(), cerrar);
}

function pintarTablaBce(seccion, datos, cerrar) {
  vaciar(seccion);
  seccion.append(h('h3', { class: 'panel__subtitulo', id: 'tit-bce' }, 'Tipos de referencia del BCE'));
  if (!datos) {
    seccion.append(h('p', { class: 'vacio' }, 'No disponibles todavía: la tarea diaria los publica cada día hábil hacia las 16:00 CET.'));
    return;
  }
  const ir = (hash) => { cerrar(); location.hash = hash; };
  const fila = (t, nombre) => h('tr', {},
    h('th', { scope: 'row' }, `EUR/${t.divisa}`, nombre ? h('small', { class: 'tabla-bce__nombre' }, nombre) : null),
    h('td', { class: 'num' }, tipoTexto(t)),
    h('td', { class: 'num' }, variacion(t.variacion)),
    h('td', { class: 'tabla-bce__acciones' },
      h('button', { type: 'button', class: 'button button--mini', onclick: () => ir(enlaceConversion(t.divisa)) }, 'Convertir'),
      DIVISAS_PANEL.some((d) => d.codigo === t.divisa)
        ? h('button', { type: 'button', class: 'button button--mini', onclick: () => ir(enlaceForward(t.divisa, datos)) }, 'Seguro de cambio')
        : null));
  const cabecera = h('thead', {}, h('tr', {},
    h('th', { scope: 'col' }, 'Par'), h('th', { scope: 'col' }, 'Tipo (divisa por 1 EUR)'),
    h('th', { scope: 'col' }, `Variación vs ${fechaEs(datos.fechaAnterior)}`), h('th', { scope: 'col' }, 'Operaciones')));
  const principales = DIVISAS_PANEL.map((d) => [tipoBce(datos, d.codigo), d.nombre]).filter(([t]) => t);
  const resto = datos.tipos.filter((t) => !DIVISAS_PANEL.some((d) => d.codigo === t.divisa));

  const selector = h('select', { id: 'par-forward' }, DIVISAS_PANEL.map((d) => h('option', { value: d.codigo }, `EUR/${d.codigo}`)));
  seccion.append(
    h('p', {}, chip('referencia BCE'), ` Publicados el ${fechaEs(datos.fecha)}. Solo informativos: los bancos aplican su propio cambio con margen. `,
      h('a', { href: datos.url, target: '_blank', rel: 'noopener noreferrer' }, 'Fuente: BCE')),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-bce' }, cabecera,
      h('tbody', {}, principales.map(([t, n]) => fila(t, n))))),
    resto.length ? h('details', { class: 'tabla-op' }, h('summary', {}, `Resto de divisas del BCE (${resto.length})`),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-bce' }, cabecera.cloneNode(true),
        h('tbody', {}, resto.map((t) => fila(t))))))
      : '',
    h('div', { class: 'forward-rapido' },
      h('label', { for: 'par-forward' }, 'Par'), selector,
      h('button', { type: 'button', class: 'button button--acento', onclick: () => ir(enlaceForward(selector.value, datos)) }, 'Calcular seguro de cambio'),
      h('small', { class: 'campo__ayuda' }, 'Abre la operación con el par elegido y el tipo BCE como spot (sustitúyelo por el de mercado). Tendrás que introducir el tipo de interés de la divisa.')));
}

/** Llama a `fn` cada vez que cambia el tema (los widgets se recrean con sus colores). */
function alCambiarTema(fn) {
  new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
