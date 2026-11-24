// Gráfica de líneas en SVG propio (AGENTS.md §5): un eje Y, rejilla tenue, líneas de 2px,
// leyenda + etiqueta directa al final de cada serie, cruceta y tooltip al pasar el ratón,
// y tabla de datos como alternativa accesible. Colores: tokens --serie-1…3 (tokens.css).
import { h } from './dom.js';
import { numero } from '../lib/formato.js';
import { marcasY, marcasX, indiceCercano, submuestrear, decimalesDePaso } from '../lib/escalas.js';
import { fechaEs } from '../lib/divisas.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...hijos) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  for (const c of hijos.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};

/**
 * @param {object} p
 * @param {string[]} p.fechas
 * @param {Array<{nombre: string, valores: Array<number|null>}>} p.series  máximo 3
 * @param {string} p.titulo   descripción accesible
 * @param {string} p.unidad
 * @param {number} [p.ancho]  ancho disponible en px (el texto se dibuja a tamaño real)
 * @param {Array<{nombre: string, inferior: Array<number|null>, superior: Array<number|null>, n: number}>} [p.bandas]
 *        bandas sombreadas (p. ej. percentiles 5–95 %); `n` = color de serie (1…3)
 */
export function graficaLineas({ fechas, series, titulo, unidad, ancho = 900, bandas = [] }) {
  const W = Math.max(320, Math.round(ancho)), H = W < 600 ? 260 : 340;
  const M = { t: 16, r: W < 600 ? 84 : 110, b: 32, l: 52 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const idx = submuestrear(fechas.length);
  const todos = [...series.flatMap((se) => idx.map((i) => se.valores[i])),
    ...bandas.flatMap((b) => idx.flatMap((i) => [b.inferior[i], b.superior[i]]))].filter((v) => Number.isFinite(v));
  const ey = marcasY(Math.min(...todos), Math.max(...todos));
  const dec = Math.max(decimalesDePaso(ey.paso), 0);
  const X = (k) => M.l + (idx.length === 1 ? iw / 2 : (k / (idx.length - 1)) * iw);
  const Y = (v) => M.t + ih - ((v - ey.min) / (ey.max - ey.min)) * ih;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafica', role: 'img', 'aria-label': titulo });
  // Rejilla y eje Y
  for (const m of ey.marcas) {
    svg.append(s('line', { x1: M.l, x2: M.l + iw, y1: Y(m), y2: Y(m), class: 'grafica__rejilla' }),
      s('text', { x: M.l - 8, y: Y(m), class: 'grafica__eje', 'text-anchor': 'end', 'dominant-baseline': 'middle' }, numero(m, dec)));
  }
  // Eje X
  for (const k of marcasX(idx.length, W < 600 ? 3 : 6)) {
    const f = fechas[idx[k]];
    svg.append(s('text', { x: X(k), y: H - 10, class: 'grafica__eje', 'text-anchor': k === 0 ? 'start' : k === idx.length - 1 ? 'end' : 'middle' }, W < 600 ? `${f.slice(5, 7)}/${f.slice(2, 4)}` : fechaEs(f)));
  }
  // Bandas (debajo de las líneas)
  for (const b of bandas) {
    const tramo = idx.map((i, k) => [k, b.inferior[i], b.superior[i]]).filter(([, a, c]) => Number.isFinite(a) && Number.isFinite(c));
    if (tramo.length < 2) continue;
    const ida = tramo.map(([k, , c], j) => `${j ? 'L' : 'M'}${X(k).toFixed(1)},${Y(c).toFixed(1)}`).join('');
    const vuelta = [...tramo].reverse().map(([k, a]) => `L${X(k).toFixed(1)},${Y(a).toFixed(1)}`).join('');
    svg.append(s('path', { d: `${ida}${vuelta}Z`, class: `grafica__banda serie-${b.n} ${b.clase ?? ''}` }));
  }
  // Series
  const etiquetasY = [];
  series.forEach((se, n) => {
    let d = '', abierto = false;
    idx.forEach((i, k) => {
      const v = se.valores[i];
      if (!Number.isFinite(v)) { abierto = false; return; }
      d += `${abierto ? 'L' : 'M'}${X(k).toFixed(1)},${Y(v).toFixed(1)}`;
      abierto = true;
    });
    svg.append(s('path', { d, class: `grafica__linea serie-${n + 1}` }));
    const ultimo = [...idx].reverse().find((i) => Number.isFinite(se.valores[i]));
    if (ultimo !== undefined) etiquetasY.push({ n, y: Y(se.valores[ultimo]), texto: se.nombre });
  });
  // Etiquetas directas al final, separadas para no solaparse
  etiquetasY.sort((a, b) => a.y - b.y);
  for (let k = 1; k < etiquetasY.length; k++) etiquetasY[k].y = Math.max(etiquetasY[k].y, etiquetasY[k - 1].y + 14);
  for (const e of etiquetasY) {
    svg.append(s('circle', { cx: M.l + iw + 8, cy: e.y, r: 4, class: `grafica__punto serie-${e.n + 1}` }),
      s('text', { x: M.l + iw + 16, y: e.y, class: 'grafica__etiqueta', 'dominant-baseline': 'middle' }, e.texto.length > 12 ? `${e.texto.slice(0, 11)}…` : e.texto));
  }
  // Cruceta + tooltip
  const cruceta = s('line', { y1: M.t, y2: M.t + ih, class: 'grafica__cruceta', visibility: 'hidden' });
  const marcas = series.map((_, n) => s('circle', { r: 4, class: `grafica__punto serie-${n + 1}`, visibility: 'hidden' }));
  const zona = s('rect', { x: M.l, y: M.t, width: iw, height: ih, class: 'grafica__zona' });
  svg.append(cruceta, ...marcas, zona);

  const tooltip = h('div', { class: 'grafica__tooltip', hidden: true, role: 'status' });
  const contenedor = h('div', { class: 'grafica-marco' }, svg, tooltip);
  const ocultar = () => { tooltip.hidden = true; cruceta.setAttribute('visibility', 'hidden'); marcas.forEach((m) => m.setAttribute('visibility', 'hidden')); };
  const mostrar = (k) => {
    const i = idx[k];
    cruceta.setAttribute('x1', X(k)); cruceta.setAttribute('x2', X(k)); cruceta.setAttribute('visibility', 'visible');
    tooltip.replaceChildren(h('strong', {}, fechaEs(fechas[i])),
      ...series.map((se, n) => h('span', { class: 'grafica__tooltip-fila' }, h('span', { class: `grafica__muestra serie-${n + 1}` }),
        `${se.nombre}: `, h('span', { class: 'num' }, Number.isFinite(se.valores[i]) ? `${numero(se.valores[i], dec + 2)} ${unidad}` : '—'))),
      ...bandas.filter((b) => Number.isFinite(b.inferior[i])).map((b) => h('span', { class: 'grafica__tooltip-fila' },
        h('span', { class: `grafica__muestra grafica__muestra--banda serie-${b.n} ${b.clase ?? ''}` }), `${b.nombre}: `,
        h('span', { class: 'num' }, `${numero(b.inferior[i], dec + 2)} – ${numero(b.superior[i], dec + 2)} ${unidad}`))));
    marcas.forEach((m, n) => {
      const v = series[n].valores[i];
      if (Number.isFinite(v)) { m.setAttribute('cx', X(k)); m.setAttribute('cy', Y(v)); m.setAttribute('visibility', 'visible'); } else m.setAttribute('visibility', 'hidden');
    });
    tooltip.hidden = false;
    const izq = (X(k) / W) * 100;
    tooltip.style.left = izq > 60 ? '' : `${izq + 2}%`;
    tooltip.style.right = izq > 60 ? `${102 - izq}%` : '';
  };
  zona.addEventListener('pointermove', (e) => {
    const r = zona.getBoundingClientRect();
    mostrar(indiceCercano(e.clientX - r.left, r.width, idx.length));
  });
  zona.addEventListener('pointerleave', ocultar);
  // Teclado: flechas recorren los puntos
  let actual = idx.length - 1;
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      actual = Math.max(0, Math.min(idx.length - 1, actual + (e.key === 'ArrowRight' ? 1 : -1)));
      mostrar(actual); e.preventDefault();
    }
  });
  svg.addEventListener('blur', ocultar);

  const leyenda = series.length + bandas.length > 1
    ? h('ul', { class: 'grafica__leyenda' },
      series.map((se, n) => h('li', {}, h('span', { class: `grafica__muestra serie-${n + 1}` }), se.nombre)),
      bandas.map((b) => h('li', {}, h('span', { class: `grafica__muestra grafica__muestra--banda serie-${b.n} ${b.clase ?? ''}` }), b.nombre)))
    : null;
  return h('figure', { class: 'grafica-figura' }, leyenda, contenedor);
}
