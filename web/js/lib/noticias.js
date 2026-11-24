// Utilidades puras de la zona de noticias (sin DOM ni red).
import { CATEGORIAS, CATEGORIA_INSTITUCIONAL } from './categorias.js';

/** Categorías que pueden llevar los titulares (las comunes + Institucional). */
export const CATEGORIAS_NOTICIAS = Object.freeze([...CATEGORIAS, CATEGORIA_INSTITUCIONAL]);

export const ESTADOS_FEED = Object.freeze({
  ok: 'Activo',
  error: 'Error',
  'sin-noticias-recientes': 'Sin noticias recientes',
});

/** Filtra por fuente y categoría ('' = todas) y texto libre en el titular. */
export function filtrarNoticias(noticias, { fuente = '', categoria = '', texto = '' } = {}) {
  const q = sinTildes(texto.trim());
  return noticias.filter((n) =>
    (!fuente || n.fuente === fuente) &&
    (!categoria || n.etiquetas?.includes(categoria)) &&
    (!q || sinTildes(n.titulo).includes(q)));
}

/** Fuentes distintas presentes, con su marca de pago, en orden alfabético. */
export function fuentesDe(datos) {
  const m = new Map();
  for (const f of datos?.fuentes ?? []) m.set(f.fuente, m.get(f.fuente) || f.dePago);
  for (const n of datos?.noticias ?? []) if (!m.has(n.fuente)) m.set(n.fuente, n.dePago);
  return [...m].map(([nombre, dePago]) => ({ nombre, dePago: !!dePago })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Hora del titular en hora de Madrid: "14:05" si es del mismo día que `ahora`,
 * "23/11 14:05" si no; "—" si no hay fecha.
 */
export function horaNoticia(iso, ahora = new Date().toISOString()) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return '—';
  const dia = (d) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit' }).format(new Date(d));
  const hora = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  return dia(iso) === dia(ahora) ? hora : `${dia(iso)} ${hora}`;
}

/** Solo enlaces http(s) (doble comprobación en la web, además de la tarea). */
export function enlaceNoticia(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

function sinTildes(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
