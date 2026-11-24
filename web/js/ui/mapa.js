// Mapa de conocimiento en SVG 2D (fase 6): fichas ↔ patrones ↔ operaciones.
// Formas distintas por tipo (círculo, rombo, cuadrado) y color de su categoría, para que el
// tipo no dependa solo del color. Al pasar el ratón o el foco por un nodo se resaltan sus
// conexiones; clic o Enter abre la ficha o la operación (los patrones muestran su detalle).
import { h, vaciar, chipCategoria } from './dom.js';
import { nombreCategoria } from '../lib/categorias.js';
import { grafo, disponer, vecinos, huecos, TIPOS } from '../lib/mapa.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...hijos) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  for (const c of hijos.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};
const recortar = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export function pintarMapa(contenedor, indice) {
  vaciar(contenedor);
  const g = grafo(indice);
  const ancho = Math.max(760, Math.min(1400, contenedor.clientWidth || 1000));
  const mapa = disponer(g, { ancho, fila: 30 });
  const porId = new Map(mapa.nodos.map((n) => [n.id, n]));
  const corte = Math.round(ancho / 22); // caracteres visibles por etiqueta

  const svg = s('svg', { viewBox: `0 0 ${ancho} ${mapa.alto + 24}`, class: 'mapa', role: 'group', 'aria-label': 'Mapa de conocimiento: fichas, patrones y operaciones' });
  // Cabeceras de columna
  [['Fichas', 30, 'start'], ['Patrones', ancho / 2, 'middle'], ['Operaciones', ancho - 30, 'end']].forEach(([t, x, a]) =>
    svg.append(s('text', { x, y: 12, class: 'mapa__columna', 'text-anchor': a }, t)));

  const capaAristas = s('g', { class: 'mapa__aristas', transform: 'translate(0,16)' });
  const capaNodos = s('g', { class: 'mapa__nodos', transform: 'translate(0,16)' });
  const lineas = mapa.aristas.map((a) => {
    const p = porId.get(a.de), q = porId.get(a.a);
    const mx = (p.x + q.x) / 2;
    const el = s('path', { d: `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`, class: `mapa__arista mapa__arista--${a.tipo}` });
    capaAristas.append(el);
    return { a, el };
  });

  const detalle = h('div', { class: 'mapa__detalle', 'aria-live': 'polite' }, h('p', { class: 'campo__ayuda' }, 'Pasa el ratón o el foco por un nodo para ver sus conexiones; clic o Enter para abrirlo.'));
  const nodosEl = new Map();
  const resaltar = (id) => {
    const v = id ? vecinos(mapa.aristas, id) : null;
    svg.classList.toggle('mapa--resaltado', !!id);
    for (const [nid, el] of nodosEl) el.classList.toggle('is-activo', !!id && (nid === id || v.has(nid)));
    for (const { a, el } of lineas) el.classList.toggle('is-activa', !!id && (a.de === id || a.a === id));
  };
  const mostrar = (n) => {
    const v = [...vecinos(mapa.aristas, n.id)].map((x) => porId.get(x));
    const lista = (tipo) => v.filter((x) => x.tipo === tipo).map((x) => x.etiqueta);
    vaciar(detalle).append(
      h('p', {}, h('strong', {}, `${TIPOS[n.tipo]}: `), n.etiqueta, n.categoria ? ' ' : '', n.categoria ? chipCategoria(n.categoria, nombreCategoria(n.categoria)) : ''),
      ...[['ficha', 'Fichas'], ['patron', 'Patrones'], ['operacion', 'Operaciones']]
        .filter(([t]) => t !== n.tipo && lista(t).length)
        .map(([t, et]) => h('p', { class: 'campo__ayuda' }, `${et}: ${lista(t).join(' · ')}`)),
      n.otros?.length ? h('p', { class: 'campo__ayuda' }, `También se usa en: ${n.otros.join(', ')}`) : '');
  };

  for (const n of mapa.nodos) {
    const clase = `mapa__nodo mapa__nodo--${n.tipo}${n.categoria ? ` cat cat--${n.categoria}` : ''}`;
    const forma = n.tipo === 'ficha' ? s('circle', { r: 6, class: 'mapa__forma' })
      : n.tipo === 'patron' ? s('rect', { x: -6, y: -6, width: 12, height: 12, transform: 'rotate(45)', class: 'mapa__forma' })
        : s('rect', { x: -6, y: -6, width: 12, height: 12, class: 'mapa__forma' });
    const anclaje = n.tipo === 'ficha' ? 'start' : n.tipo === 'operacion' ? 'end' : 'middle';
    const dx = n.tipo === 'ficha' ? 12 : n.tipo === 'operacion' ? -12 : 0;
    const dy = n.tipo === 'patron' ? -10 : 4;
    const texto = n.tipo === 'patron' ? n.codigo : recortar(n.etiqueta, corte);
    const el = s('g', { class: clase, transform: `translate(${n.x},${n.y})`, tabindex: '0', role: 'link', 'aria-label': `${TIPOS[n.tipo]}: ${n.etiqueta}` },
      s('title', {}, n.etiqueta), forma, s('text', { x: dx, y: dy, 'text-anchor': anclaje, class: 'mapa__texto' }, texto));
    const abrir = () => { if (n.enlace) location.hash = n.enlace; else mostrar(n); };
    el.addEventListener('pointerenter', () => { resaltar(n.id); mostrar(n); });
    el.addEventListener('focus', () => { resaltar(n.id); mostrar(n); });
    el.addEventListener('click', abrir);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    nodosEl.set(n.id, el);
    capaNodos.append(el);
  }
  svg.addEventListener('pointerleave', () => resaltar(null));
  svg.addEventListener('focusout', (e) => { if (!svg.contains(e.relatedTarget)) resaltar(null); });
  svg.append(capaAristas, capaNodos);

  const hz = huecos(mapa);
  const listaHuecos = [
    hz.patronesSinFicha.length ? `Patrones sin ficha que los explique: ${hz.patronesSinFicha.join(', ')}` : null,
    hz.fichasSinCalculo.length ? `Fichas sin patrón ni operación: ${hz.fichasSinCalculo.join(' · ')}` : null,
    hz.operacionesSinPatron.length ? `Operaciones sin patrón: ${hz.operacionesSinPatron.join(' · ')}` : null,
  ].filter(Boolean);

  contenedor.append(
    h('ul', { class: 'mapa__leyenda' },
      h('li', {}, h('span', { class: 'mapa__icono mapa__icono--ficha' }), `Ficha (${mapa.nodos.filter((n) => n.tipo === 'ficha').length})`),
      h('li', {}, h('span', { class: 'mapa__icono mapa__icono--patron' }), `Patrón de cálculo (${mapa.nodos.filter((n) => n.tipo === 'patron').length})`),
      h('li', {}, h('span', { class: 'mapa__icono mapa__icono--operacion' }), `Operación (${mapa.nodos.filter((n) => n.tipo === 'operacion').length})`),
      h('li', {}, `${mapa.aristas.length} conexiones · color = categoría`)),
    h('div', { class: 'mapa__marco' }, svg),
    detalle,
    listaHuecos.length
      ? h('details', { class: 'tabla-op' }, h('summary', {}, `Huecos del conocimiento (${listaHuecos.length})`),
        h('ul', { class: 'avisos' }, listaHuecos.map((t) => h('li', {}, t))),
        h('p', { class: 'campo__ayuda' }, 'Se revisan en la revisión mensual (revisiones/README.md).'))
      : '');
}
