// Categorías comunes a todo el sistema (ver AGENTS.md §11).
export const CATEGORIAS = Object.freeze([
  { slug: 'fx', nombre: 'FX' },
  { slug: 'empresas', nombre: 'Empresas' },
  { slug: 'bolsa-inversion', nombre: 'Bolsa e Inversión' },
  { slug: 'real-estate', nombre: 'Real Estate' },
  { slug: 'macroeconomia', nombre: 'Macroeconomía' },
]);
export const CATEGORIA_INSTITUCIONAL = Object.freeze({ slug: 'institucional', nombre: 'Institucional' });

export function nombreCategoria(slug) {
  return [...CATEGORIAS, CATEGORIA_INSTITUCIONAL].find((c) => c.slug === slug)?.nombre ?? slug;
}
