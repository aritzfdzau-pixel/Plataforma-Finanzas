// Zona «Renta variable y renta fija (Equities & Fixed income)» (fase 8).
// - Índices y valores: solo widgets de TradingView (componente aislado, sandbox + CSP frame-src).
//   No hay histórico propio de acciones: no existe una fuente gratuita que permita publicarlo (D-035).
// - Renta fija: series oficiales de datos/historicos.json (BCE, Bundesbank, Banco de Inglaterra,
//   Reserva Federal), rentabilidades en % y diferenciales en pb (P-023).
// - Histórico y proyección: se reutilizan las zonas de Históricos y Proyecciones (P-011 a P-016).
import { h, vaciar } from './dom.js';
import { numero } from '../lib/formato.js';
import { fechaEs } from '../lib/divisas.js';
import {
  INDICES, MERCADOS, gruposIndices, indicePorId, PAISES_RF, LINEA_RF, ultimoYCambio, curvaPais, ETIQUETA_TR,
} from '../lib/mercados.js';
import { iframeWidget, configCinta, configGrupos, configMapaCalor, configGrafico } from '../componentes/tradingview.js';
import { cargarHistoricos, verSerieEnHistoricos } from './historicos.js';
import { proyectarSerie } from './proyecciones.js';

const tema = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
const chip = (texto) => h('span', { class: 'chip' }, texto);
const alCambiarTema = (fn) => new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

let promesaComposicion = null;
/** Composición de índices (JSON versionado del repo). */
export function cargarComposicion() {
  promesaComposicion ??= fetch('../conocimiento/mercados/composicion-indices.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return promesaComposicion;
}

/** ▲ ▼ con el cambio en pb (nunca solo color). */
function cambioPb(pb) {
  if (pb === null || !Number.isFinite(pb)) return h('span', { class: 'num' }, '—');
  if (Math.abs(pb) < 1e-9) return h('span', { class: 'num' }, '0 pb');
  return h('span', { class: `num ${pb > 0 ? 'var-up' : 'var-down'}` },
    h('span', { class: 'visually-hidden' }, pb > 0 ? 'sube ' : 'baja '), `${numero(Math.abs(pb), 0, 1)} pb`);
}
const yieldTexto = (v) => (Number.isFinite(v) ? `${numero(v, 2, 3)} %` : '—');

// ------------------------------------------------------------------------------------
// Portada
// ------------------------------------------------------------------------------------
export async function pintarCabeceraMercados(cuerpo, abrirPanel) {
  const widget = h('div', { class: 'tv-marco tv-marco--tickers' });
  const pintarWidget = () => vaciar(widget).append(iframeWidget('tickers',
    configCinta(INDICES.map((i) => ({ simbolo: i.simbolo, nombre: i.nombre })), tema()), 'Cotización de los principales índices bursátiles (TradingView)'));
  pintarWidget();
  alCambiarTema(pintarWidget);

  const etiquetas = h('details', { class: 'mercados__etiquetas' },
    h('summary', {}, 'Qué muestra cada cotización (etiqueta del dato)'),
    h('ul', { class: 'mercados__lista-etiquetas' }, INDICES.map((i) => h('li', {},
      h('span', {}, i.nombre), chip(i.etiqueta), h('small', { class: 'campo__ayuda' }, ` ${i.tipoSimbolo}`)))));

  const rf = h('div', { class: 'linea-rf' }, h('p', { class: 'vacio' }, 'Cargando renta fija…'));
  vaciar(cuerpo).append(
    h('p', { class: 'mercados__subtitulo' }, 'Equities · índices'), widget, etiquetas,
    h('p', { class: 'mercados__subtitulo' }, 'Fixed income · bono a 10 años (yield) y prima de riesgo'), rf,
    h('button', { type: 'button', class: 'button', onclick: () => abrirPanel({}) }, 'Abrir panel de renta variable y renta fija'));

  const datos = await cargarHistoricos();
  const porId = new Map((datos?.series ?? []).map((s) => [s.id, s]));
  vaciar(rf);
  if (!datos) { rf.append(h('p', { class: 'vacio' }, 'Datos oficiales no disponibles todavía (la tarea diaria los publica).')); return; }
  rf.append(h('ul', { class: 'linea-rf__lista' }, LINEA_RF.map((x) => {
    const s = porId.get(x.serie); const u = ultimoYCambio(s);
    return h('li', {},
      h('a', { href: `#rf=${x.codigo}`, class: 'linea-rf__nombre' }, x.nombre),
      h('span', { class: 'num linea-rf__valor' }, u ? (x.enPb ? `${numero(u.valor * 100, 0)} pb` : yieldTexto(u.valor)) : '—'),
      u ? cambioPb(u.cambioPb) : null,
      h('small', { class: 'linea-rf__dato' }, s ? `${s.etiqueta} · ${fechaEs(u?.fecha)}${s.id.endsWith('-m') || s.id.startsWith('prima') ? ' (media mensual)' : ''}` : 'sin datos'));
  })));
}

// ------------------------------------------------------------------------------------
// Panel a pantalla grande (<dialog>)
// ------------------------------------------------------------------------------------
const PESTANAS = [
  ['indices', 'Índices'], ['componentes', 'Componentes'], ['renta-fija', 'Renta fija (Fixed income)'], ['historico', 'Histórico y proyección'],
];

/** Pinta el panel y devuelve un controlador para navegar ({ pestana, indice, valor, pais, serie }). */
export function pintarPanelMercados(dialogo, cerrar) {
  const contenido = dialogo.querySelector('.panel__contenido');
  const estado = { pestana: 'indices', indice: 'IBEX35', valor: null, pais: 'ES', mapa: 'SPX', serie: null };
  const lista = h('div', { class: 'pestanas', role: 'tablist', 'aria-label': 'Renta variable y renta fija' });
  const panel = h('div', { role: 'tabpanel', id: 'panel-mercados-activo', class: 'mercados__panel' });
  vaciar(contenido).append(h('section', { class: 'panel__seccion' }, lista, panel));

  const irZona = (fn) => { cerrar(); fn(); };
  const botonesSerie = (id) => [
    h('button', { type: 'button', class: 'button button--mini', onclick: () => irZona(() => verSerieEnHistoricos(id)) }, 'Ver en Históricos'),
    h('button', { type: 'button', class: 'button button--mini', onclick: () => irZona(() => proyectarSerie(id)) }, 'Proyectar'),
  ];

  const pintar = async () => {
    vaciar(lista);
    for (const [id, titulo] of PESTANAS) {
      const sel = id === estado.pestana;
      lista.append(h('button', {
        type: 'button', role: 'tab', id: `tab-rv-${id}`, class: 'pestana', 'aria-selected': String(sel), 'aria-controls': 'panel-mercados-activo',
        tabindex: sel ? '0' : '-1', onclick: () => { estado.pestana = id; pintar(); },
        onkeydown: (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const k = PESTANAS.findIndex(([x]) => x === estado.pestana);
          estado.pestana = PESTANAS[(k + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length][0];
          pintar().then(() => lista.querySelector(`#tab-rv-${estado.pestana}`)?.focus());
        },
      }, titulo));
    }
    panel.setAttribute('aria-labelledby', `tab-rv-${estado.pestana}`);
    vaciar(panel);
    if (estado.pestana === 'indices') pestanaIndices(panel, estado, pintar);
    else if (estado.pestana === 'componentes') await pestanaComponentes(panel, estado, pintar);
    else if (estado.pestana === 'renta-fija') await pestanaRentaFija(panel, estado, pintar, botonesSerie);
    else await pestanaHistorico(panel, estado, pintar, botonesSerie, irZona);
  };
  alCambiarTema(() => { if (dialogo.open) pintar(); });
  pintar();
  return {
    ir(destino = {}) {
      Object.assign(estado, Object.fromEntries(Object.entries(destino).filter(([, v]) => v !== undefined)));
      pintar();
    },
  };
}

function pestanaIndices(panel, estado, pintar) {
  const conMapa = INDICES.filter((i) => i.mapaCalor);
  if (!conMapa.some((i) => i.id === estado.mapa)) estado.mapa = conMapa[0].id;
  const mapa = indicePorId(estado.mapa);
  panel.append(
    h('p', {}, chip(ETIQUETA_TR), ' / ', chip('con retraso'), h('small', { class: 'campo__ayuda' }, ' Cotizaciones de TradingView, no negociables. Cada índice lleva su etiqueta en la tabla.')),
    h('div', { class: 'tv-marco tv-marco--cotizaciones' }, iframeWidget('market-quotes', configGrupos(gruposIndices(), tema()), 'Cotización de los índices por mercado (TradingView)')),
    h('h3', { class: 'panel__subtitulo' }, 'Índices por mercado'),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-mercados' },
      h('thead', {}, h('tr', {}, ['Mercado', 'Índice', 'Símbolo del widget', 'Qué es', 'Dato', 'Ver'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, MERCADOS.flatMap((m) => INDICES.filter((i) => i.mercado === m).map((i) => h('tr', {},
        h('td', {}, m), h('th', { scope: 'row' }, i.nombre), h('td', { class: 'num' }, i.simbolo),
        h('td', {}, i.tipoSimbolo), h('td', {}, chip(i.etiqueta)),
        h('td', {},
          h('button', { type: 'button', class: 'button button--mini', onclick: () => { estado.pestana = 'componentes'; estado.indice = i.id; estado.valor = null; pintar(); } }, 'Componentes'),
          i.mapaCalor ? h('button', { type: 'button', class: 'button button--mini', onclick: () => { estado.mapa = i.id; pintar(); } }, 'Heatmap') : null))))))),
    h('h3', { class: 'panel__subtitulo' }, `Mapa de calor de componentes (Heatmap): ${mapa.nombre}`),
    h('div', { class: 'campo campo--linea' }, h('label', { for: 'rv-mapa' }, 'Índice'),
      h('select', { id: 'rv-mapa', onchange: (e) => { estado.mapa = e.target.value; pintar(); } },
        conMapa.map((i) => h('option', { value: i.id, selected: i.id === estado.mapa }, i.nombre)))),
    h('p', {}, chip(ETIQUETA_TR), h('small', { class: 'campo__ayuda' }, ' Tamaño = capitalización; color = variación del día. ⚠️ Pendiente de verificar que el widget admite este índice (si sale vacío, no lo admite).')),
    h('div', { class: 'tv-marco tv-marco--mapa' }, iframeWidget('stock-heatmap', configMapaCalor(mapa.mapaCalor, tema()), `Mapa de calor de ${mapa.nombre} (TradingView)`)));
}

async function pestanaComponentes(panel, estado, pintar) {
  const comp = await cargarComposicion();
  if (!comp) { panel.append(h('p', { class: 'vacio' }, 'No se ha podido cargar la composición de los índices.')); return; }
  if (!comp.indices.some((i) => i.id === estado.indice)) estado.indice = comp.indices[0].id;
  const ind = comp.indices.find((i) => i.id === estado.indice);
  const valor = ind.valores.find((v) => v.ticker === estado.valor) ?? null;
  const grafico = h('div', { class: 'mercados__grafico' });
  if (valor) {
    grafico.append(
      h('h3', { class: 'panel__subtitulo' }, `${valor.nombre} (${valor.ticker})`),
      h('p', {}, chip(ETIQUETA_TR), h('small', { class: 'campo__ayuda' }, ` Gráfica de TradingView (${valor.tv}). Sin histórico propio de acciones (D-035): para analizarlo o proyectarlo, sube su CSV en Históricos.`)),
      h('div', { class: 'tv-marco tv-marco--grafico' }, iframeWidget('symbol-overview', configGrafico(valor.tv, valor.nombre, tema()), `Gráfica de ${valor.nombre} (TradingView)`)));
  }
  panel.append(
    h('div', { class: 'campo campo--linea' }, h('label', { for: 'rv-indice' }, 'Índice'),
      h('select', { id: 'rv-indice', onchange: (e) => { estado.indice = e.target.value; estado.valor = null; pintar(); } },
        comp.indices.map((i) => h('option', { value: i.id, selected: i.id === estado.indice }, i.nombre)))),
    h('p', { class: 'campo__ayuda' }, `Composición del ${fechaEs(ind.fecha_composicion)} · fuente: `,
      h('a', { href: ind.fuente_url, target: '_blank', rel: 'noopener noreferrer' }, ind.fuente),
      ind.alcance ? ` · ${ind.alcance}` : ` · ${ind.valores.length} valores (lista completa)`, ind.nota ? ` · ${ind.nota}` : ''),
    ind.verificada ? null : h('p', { class: 'aviso' }, comp._aviso),
    grafico,
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-mercados' },
      h('thead', {}, h('tr', {}, ['Valor', 'Ticker', 'Sector', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, ind.valores.map((v) => h('tr', { class: v.ticker === estado.valor ? 'is-activa' : '' },
        h('th', { scope: 'row' }, v.nombre), h('td', { class: 'num' }, v.ticker), h('td', {}, v.sector),
        h('td', {}, h('button', { type: 'button', class: 'button button--mini', onclick: () => { estado.valor = v.ticker; history.replaceState(null, '', `#rv=${ind.id}&valor=${encodeURIComponent(v.ticker)}`); pintar(); } }, 'Gráfica'))))))));
  if (valor) grafico.scrollIntoView({ block: 'nearest' });
}

/** Curva soberana en SVG propio: plazo (años) en X, rentabilidad (%) en Y. */
function svgCurva(puntos) {
  const p = puntos.filter((x) => Number.isFinite(x.valor));
  if (p.length < 2) return null;
  const W = 360, H = 160, m = 28;
  const xs = (t) => m + ((t - 0) / 30) * (W - 2 * m);
  const ymin = Math.min(...p.map((x) => x.valor)), ymax = Math.max(...p.map((x) => x.valor));
  const rango = Math.max(ymax - ymin, 0.1);
  const ys = (v) => H - m - ((v - ymin) / rango) * (H - 2 * m);
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, at) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'curva-svg', role: 'img', 'aria-label': `Curva: ${p.map((x) => `${x.plazo} años ${numero(x.valor, 2)} %`).join(', ')}` });
  svg.append(el('line', { x1: m, y1: H - m, x2: W - m, y2: H - m, class: 'curva-svg__eje' }));
  svg.append(el('polyline', { points: p.map((x) => `${xs(x.plazo)},${ys(x.valor)}`).join(' '), class: 'curva-svg__linea' }));
  for (const x of p) {
    svg.append(el('circle', { cx: xs(x.plazo), cy: ys(x.valor), r: 3, class: 'curva-svg__punto' }));
    const t = el('text', { x: xs(x.plazo), y: H - m + 14, class: 'curva-svg__texto', 'text-anchor': 'middle' }); t.textContent = `${x.plazo}a`; svg.append(t);
    const v = el('text', { x: xs(x.plazo), y: ys(x.valor) - 7, class: 'curva-svg__texto', 'text-anchor': 'middle' }); v.textContent = numero(x.valor, 2); svg.append(v);
  }
  return svg;
}

async function pestanaRentaFija(panel, estado, pintar, botonesSerie) {
  const datos = await cargarHistoricos();
  const series = datos?.series ?? [];
  const porId = new Map(series.map((s) => [s.id, s]));
  const c = curvaPais(series, estado.pais) ?? curvaPais(series, 'ES');
  panel.append(
    h('p', { class: 'campo__ayuda' }, 'Rentabilidad (yield) en %, no precio: cuando la rentabilidad sube, el precio del bono baja. Diferenciales (spread) en puntos básicos (1 pb = 0,01 %).'),
    h('div', { class: 'pestanas pestanas--mini', role: 'group', 'aria-label': 'País' }, PAISES_RF.map((p) => h('button', {
      type: 'button', class: 'pestana', 'aria-pressed': String(p.codigo === c.pais.codigo), onclick: () => { estado.pais = p.codigo; pintar(); },
    }, p.nombre))),
    h('h3', { class: 'panel__subtitulo' }, `Curva soberana: ${c.pais.nombre}`),
    h('p', { class: 'campo__ayuda' }, c.pais.nota),
    h('div', { class: 'mercados__curva' },
      svgCurva(c.puntos) ?? h('p', { class: 'vacio' }, 'Solo hay un plazo con datos oficiales: no se puede dibujar la curva.'),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-mercados' },
        h('thead', {}, h('tr', {}, ['Plazo', 'Yield', 'Cambio', 'Fecha', 'Dato', ''].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, c.puntos.map((x) => h('tr', { class: x.id === estado.serie ? 'is-activa' : '' },
          h('th', { scope: 'row' }, `${x.plazo} años`), h('td', { class: 'num' }, yieldTexto(x.valor)), h('td', {}, cambioPb(x.cambioPb)),
          h('td', { class: 'num' }, x.fecha ? fechaEs(x.fecha) : '—'), h('td', {}, porId.get(x.id) ? chip(porId.get(x.id).etiqueta) : '—'),
          h('td', {}, porId.get(x.id)?.puntos?.length ? botonesSerie(x.id) : null))))))),
    c.pendientePb !== null ? h('p', {}, 'Pendiente 10 años – 2 años (spread 10a–2a): ', h('strong', { class: 'num' }, `${numero(c.pendientePb, 0, 1)} pb`),
      c.pendientePb < 0 ? ' · curva invertida (el corto rinde más que el largo).' : '') : null,
    h('h3', { class: 'panel__subtitulo' }, 'Primas de riesgo frente al Bund (10 años)'),
    h('p', { class: 'campo__ayuda' }, 'Diferencial entre la rentabilidad del bono a 10 años de cada país y la del alemán, con la media mensual del BCE para los dos (misma fuente y fecha).'),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-mercados' },
      h('thead', {}, h('tr', {}, ['País', 'Prima (spread)', 'Cambio', 'Mes', 'Dato', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, PAISES_RF.filter((p) => p.prima).map((p) => {
        const s = porId.get(p.prima); const u = ultimoYCambio(s);
        return h('tr', { class: p.prima === estado.serie ? 'is-activa' : '' }, h('th', { scope: 'row' }, p.nombre),
          h('td', { class: 'num' }, u ? `${numero(u.valor * 100, 0)} pb` : '—'), h('td', {}, u ? cambioPb(u.cambioPb) : '—'),
          h('td', { class: 'num' }, u ? fechaEs(u.fecha) : '—'), h('td', {}, s ? chip(s.etiqueta) : '—'),
          h('td', {}, s?.puntos?.length ? botonesSerie(p.prima) : null));
      })))));
}

async function pestanaHistorico(panel, estado, pintar, botonesSerie, irZona) {
  const datos = await cargarHistoricos();
  const rf = (datos?.series ?? []).filter((s) => s.grupo === 'renta-fija' && s.puntos?.length >= 3);
  panel.append(
    h('p', {}, 'Para cualquier serie con datos propios se usan las mismas pantallas de ', h('strong', {}, 'Históricos'),
      ' (medias móviles, volatilidad, EWMA, drawdown, correlación) y de ', h('strong', {}, 'Proyecciones y escenarios'),
      ' (Montecarlo con bandas 5 %–95 % y 25 %–75 %, validación frente al paseo aleatorio).'),
    h('ul', { class: 'avisos' },
      h('li', {}, 'Rentabilidades de bonos y primas: se analizan las variaciones en pb y se proyectan con el modelo aditivo (no logarítmico).'),
      h('li', {}, 'Índices y acciones: no hay cierres propios publicables gratis (D-035). Sube un CSV con sus cierres (no sale de tu navegador): se analiza con rentabilidades logarítmicas.')),
    h('p', {}, h('button', { type: 'button', class: 'button button--acento', onclick: () => irZona(() => {
      const zona = document.getElementById('zona-historicos');
      zona?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      zona?.querySelector('#csv-archivo')?.focus();
    }) }, 'Subir CSV')),
    h('h3', { class: 'panel__subtitulo' }, 'Series de renta fija con datos oficiales'),
    rf.length ? h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-mercados' },
      h('thead', {}, h('tr', {}, ['Serie', 'Observaciones', 'Desde', 'Hasta', 'Dato', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rf.map((s) => h('tr', { class: s.id === estado.serie ? 'is-activa' : '' },
        h('th', { scope: 'row' }, s.nombre), h('td', { class: 'num' }, String(s.puntos.length)),
        h('td', { class: 'num' }, fechaEs(s.puntos[0][0])), h('td', { class: 'num' }, fechaEs(s.puntos.at(-1)[0])),
        h('td', {}, chip(s.etiqueta)), h('td', {}, botonesSerie(s.id)))))))
      : h('p', { class: 'vacio' }, 'Datos oficiales no disponibles todavía.'));
}
