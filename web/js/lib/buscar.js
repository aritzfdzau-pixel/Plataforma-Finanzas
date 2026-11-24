// Búsqueda de operaciones y fichas. Módulo puro (sin DOM).

/** Minúsculas y sin tildes: "Inversión" → "inversion". */
export function normalizar(t) {
  return String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Filtra elementos {titulo, categoria, etiquetas, ...}: deben aparecer todas las palabras
 * de la consulta. Los que coinciden en el título van primero.
 */
export function buscar(elementos, consulta) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [...elementos];
  return elementos
    .map((e) => {
      const titulo = normalizar(e.titulo);
      const resto = normalizar([e.categoriaNombre, e.categoria, ...(e.etiquetas ?? []), e.descripcion, e.id].join(' '));
      const ok = palabras.every((p) => titulo.includes(p) || resto.includes(p));
      const puntos = palabras.filter((p) => titulo.includes(p)).length;
      return { e, ok, puntos };
    })
    .filter((x) => x.ok)
    .sort((a, b) => b.puntos - a.puntos)
    .map((x) => x.e);
}
