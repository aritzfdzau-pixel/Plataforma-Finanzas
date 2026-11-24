// Etiquetado y combinación de titulares (fase 3). Funciones puras: las usa
// scripts/descargar-noticias.js y las prueban los tests.
//
// Etiquetas (categorías comunes, AGENTS.md §11):
//   1. por la sección del feed, si la tiene (fuentes-noticias.js);
//   2. "institucional" para BCE y Banco de España;
//   3. por palabras clave del titular, definidas en decisiones.md (editable por Aritz).
// Un titular puede llevar varias etiquetas.

import { CATEGORIAS, CATEGORIA_INSTITUCIONAL } from '../web/js/lib/categorias.js';

export const SLUGS = Object.freeze([...CATEGORIAS.map((c) => c.slug), CATEGORIA_INSTITUCIONAL.slug]);
export const TITULO_PALABRAS = '## Palabras clave para etiquetar noticias';

/** minúsculas y sin tildes, para comparar */
export function normalizar(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Lee la tabla de palabras clave de decisiones.md:
 *   | `fx` | divisa, tipo de cambio, forex |
 * @returns {Record<string, string[]>}
 */
export function leerPalabrasClave(md) {
  const inicio = md.indexOf(TITULO_PALABRAS);
  if (inicio < 0) throw new Error(`decisiones.md no tiene la sección «${TITULO_PALABRAS.slice(3)}»`);
  const resto = md.slice(inicio + TITULO_PALABRAS.length);
  const fin = resto.search(/\n## /);
  const seccion = fin < 0 ? resto : resto.slice(0, fin);
  const palabras = {};
  for (const linea of seccion.split('\n')) {
    const m = /^\|\s*`([a-z-]+)`\s*\|(.*)\|\s*$/.exec(linea.trim());
    if (!m) continue;
    if (!SLUGS.includes(m[1])) throw new Error(`Categoría desconocida en palabras clave: ${m[1]}`);
    palabras[m[1]] = m[2].split(',').map((p) => normalizar(p.trim())).filter(Boolean);
  }
  if (Object.keys(palabras).length === 0) throw new Error('No hay palabras clave definidas');
  return palabras;
}

const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** ¿Aparece la palabra (o expresión) como palabra completa? */
export function contiene(textoNormalizado, palabra) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaparRegex(palabra)}($|[^\\p{L}\\p{N}])`, 'u').test(textoNormalizado);
}

/** Etiquetas de un titular, sin repetir y en el orden de las categorías del sistema. */
export function etiquetar(noticia, feed, palabras) {
  const et = new Set();
  if (feed.seccion) et.add(feed.seccion);
  if (feed.institucional) et.add(CATEGORIA_INSTITUCIONAL.slug);
  const texto = normalizar([noticia.titulo, ...(noticia.categorias ?? [])].join(' · '));
  for (const [slug, lista] of Object.entries(palabras)) {
    if (slug === CATEGORIA_INSTITUCIONAL.slug && !feed.institucional) continue; // solo BCE / BdE
    if (lista.some((p) => contiene(texto, p))) et.add(slug);
  }
  return SLUGS.filter((s) => et.has(s));
}

/**
 * Une titulares nuevos y anteriores: sin duplicados (por enlace), más recientes primero,
 * sin los de más de `diasMax` días y como mucho `max`.
 */
export function combinar(nuevas, anteriores, { ahora, diasMax = 7, max = 200 }) {
  const limite = Date.parse(ahora) - diasMax * 86_400_000;
  const porEnlace = new Map();
  for (const n of [...nuevas, ...anteriores]) {
    if (!porEnlace.has(n.enlace)) porEnlace.set(n.enlace, n); // gana la versión nueva
  }
  return [...porEnlace.values()]
    .filter((n) => !n.fecha || Date.parse(n.fecha) >= limite)
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
    .slice(0, max);
}

/** Estado de un feed tras la descarga. */
export function estadoFeed(feed, resultado, ahora, diasSinNoticias = 30) {
  const base = { id: feed.id, fuente: feed.fuente, url: feed.url, seccion: feed.seccion ?? null, dePago: !!feed.dePago };
  if (resultado.error) return { ...base, estado: 'error', titulares: 0, error: resultado.error };
  const fechas = resultado.items.map((i) => i.fecha).filter(Boolean).sort();
  const ultima = fechas.at(-1) ?? null;
  const antiguo = !ultima || Date.parse(ultima) < Date.parse(ahora) - diasSinNoticias * 86_400_000;
  return { ...base, estado: resultado.items.length && !antiguo ? 'ok' : 'sin-noticias-recientes', titulares: resultado.items.length, ultima };
}

/**
 * Contenido de datos/noticias.json.
 * @param {Array<{feed: object, items?: Array, error?: string}>} resultados  Uno por feed.
 * @param {Array} anteriores  Titulares del último archivo publicado (respaldo).
 */
export function construirNoticias(resultados, anteriores, palabras, ahora) {
  const nuevas = resultados.flatMap(({ feed, items = [] }) => items.map((i) => ({
    titulo: i.titulo,
    enlace: i.enlace,
    fuente: feed.fuente,
    dePago: !!feed.dePago,
    fecha: i.fecha,
    etiquetas: etiquetar(i, feed, palabras),
  })));
  return {
    etiqueta: 'con retraso',
    aviso: 'Solo titular, fuente, hora y enlace. Actualización aproximadamente cada hora.',
    generado: ahora,
    fuentes: resultados.map((r) => estadoFeed(r.feed, r, ahora)),
    noticias: combinar(nuevas, anteriores, { ahora }),
  };
}
