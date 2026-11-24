// Mapa de conocimiento (fase 6): grafo fichas ↔ patrones ↔ operaciones a partir de
// conocimiento/indice.json. Puro (sin DOM): calcula nodos, aristas, posiciones y huecos.
//
// Disposición en tres columnas (fichas · patrones · operaciones). Para reducir cruces, cada
// columna se ordena por el baricentro de sus vecinos en la columna anterior (heurística de
// Sugiyama, una pasada de ida y otra de vuelta). Determinista: mismo índice, mismo dibujo.
import { CATEGORIAS } from './categorias.js';

export const TIPOS = Object.freeze({ ficha: 'Ficha', patron: 'Patrón', operacion: 'Operación' });

const ordenCategoria = (slug) => {
  const i = CATEGORIAS.findIndex((c) => c.slug === slug);
  return i < 0 ? CATEGORIAS.length : i;
};

/** Nodos y aristas (sin posiciones). */
export function grafo(indice) {
  const nodos = [];
  const aristas = [];
  const existe = new Set();
  const nodo = (n) => { if (!existe.has(n.id)) { existe.add(n.id); nodos.push(n); } };

  for (const f of indice.fichas) {
    nodo({ id: `ficha:${f.ruta}`, tipo: 'ficha', etiqueta: f.titulo, categoria: f.categoria, enlace: `#ficha=${encodeURIComponent(f.ruta)}` });
  }
  for (const p of indice.patrones ?? []) {
    nodo({ id: `patron:${p.id}`, tipo: 'patron', etiqueta: `${p.id} · ${p.nombre}`, codigo: p.id, categoria: null, enlace: null, otros: p.otros ?? [] });
  }
  for (const o of indice.operaciones) {
    nodo({ id: `op:${o.id}`, tipo: 'operacion', etiqueta: o.titulo ?? o.id, categoria: o.categoria, enlace: `#op=${encodeURIComponent(o.id)}` });
  }
  const arista = (de, a, tipo) => {
    if (existe.has(de) && existe.has(a) && !aristas.some((x) => x.de === de && x.a === a)) aristas.push({ de, a, tipo });
  };
  for (const f of indice.fichas) {
    for (const p of f.patrones) arista(`ficha:${f.ruta}`, `patron:${p}`, 'usa');
    for (const o of f.operaciones) arista(`ficha:${f.ruta}`, `op:${o}`, 'genera');
  }
  for (const p of indice.patrones ?? []) {
    for (const o of p.operaciones) arista(`patron:${p.id}`, `op:${o}`, 'calcula');
  }
  return { nodos, aristas };
}

/** Ids de los nodos conectados directamente con `id`. */
export function vecinos(aristas, id) {
  const v = new Set();
  for (const a of aristas) {
    if (a.de === id) v.add(a.a);
    if (a.a === id) v.add(a.de);
  }
  return v;
}

/**
 * Posiciones en un lienzo de `ancho` px. Devuelve nodos con x, y y el alto necesario.
 * Fichas ordenadas por categoría; patrones y operaciones, por baricentro.
 */
export function disponer({ nodos, aristas }, { ancho = 1000, fila = 30, margen = 24, iteraciones = 4 } = {}) {
  const col = { ficha: [], patron: [], operacion: [] };
  for (const n of nodos) col[n.tipo].push(n);
  col.ficha.sort((a, b) => ordenCategoria(a.categoria) - ordenCategoria(b.categoria) || a.etiqueta.localeCompare(b.etiqueta, 'es'));

  const pos = new Map();
  const fijar = (lista) => lista.forEach((n, k) => pos.set(n.id, k));
  const baricentro = (n, otra) => {
    const ys = [...vecinos(aristas, n.id)].filter((v) => otra.some((m) => m.id === v)).map((v) => pos.get(v));
    return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.POSITIVE_INFINITY;
  };
  const ordenar = (lista, otra) => lista
    .map((n, k) => ({ n, b: baricentro(n, otra), k }))
    .sort((a, b) => a.b - b.b || a.k - b.k)
    .map((x) => x.n);

  fijar(col.ficha);
  col.patron.sort((a, b) => a.codigo.localeCompare(b.codigo));
  // Varias pasadas de ida y vuelta; las fichas se reordenan solo dentro de su categoría.
  for (let pasada = 0; pasada < iteraciones; pasada++) {
    col.patron = ordenar(col.patron, col.ficha); fijar(col.patron);
    col.operacion = ordenar(col.operacion, col.patron.length ? col.patron : col.ficha); fijar(col.operacion);
    col.patron = ordenar(col.patron, col.operacion); fijar(col.patron);
    col.ficha = col.ficha
      .map((n, k) => ({ n, c: ordenCategoria(n.categoria), b: baricentro(n, col.patron), k }))
      .sort((a, b) => a.c - b.c || a.b - b.b || a.k - b.k)
      .map((x) => x.n);
    fijar(col.ficha);
  }

  const filas = Math.max(col.ficha.length, col.patron.length, col.operacion.length, 1);
  const alto = margen * 2 + filas * fila;
  const xs = { ficha: margen + 6, patron: ancho / 2, operacion: ancho - margen - 6 };
  const colocados = [];
  for (const tipo of ['ficha', 'patron', 'operacion']) {
    const lista = col[tipo];
    const paso = (alto - margen * 2) / Math.max(lista.length, 1);
    lista.forEach((n, k) => colocados.push({ ...n, x: xs[tipo], y: margen + paso * (k + 0.5) }));
  }
  return { nodos: colocados, aristas, alto, ancho };
}

/** Número de cruces entre aristas de dos columnas contiguas (para medir el orden; tests). */
export function cruces({ nodos, aristas }) {
  const y = new Map(nodos.map((n) => [n.id, n]));
  const segs = aristas.map((a) => [y.get(a.de), y.get(a.a)]).filter(([p, q]) => p && q && p.x !== q.x)
    .map(([p, q]) => (p.x < q.x ? [p, q] : [q, p]));
  let c = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const [a1, a2] = segs[i], [b1, b2] = segs[j];
      if (a1.x !== b1.x || a2.x !== b2.x) continue;
      if ((a1.y - b1.y) * (a2.y - b2.y) < 0) c++;
    }
  }
  return c;
}

/**
 * Huecos del conocimiento, útiles para la revisión mensual:
 * patrones sin ficha que los explique, fichas sin patrón ni operación y operaciones sin patrón.
 */
export function huecos({ nodos, aristas }) {
  const tiene = (id, tipo) => [...vecinos(aristas, id)].some((v) => v.startsWith(`${tipo}:`));
  return {
    patronesSinFicha: nodos.filter((n) => n.tipo === 'patron' && !tiene(n.id, 'ficha')).map((n) => n.codigo),
    fichasSinCalculo: nodos.filter((n) => n.tipo === 'ficha' && !tiene(n.id, 'patron') && !tiene(n.id, 'op')).map((n) => n.etiqueta),
    operacionesSinPatron: nodos.filter((n) => n.tipo === 'operacion' && !tiene(n.id, 'patron')).map((n) => n.etiqueta),
  };
}
