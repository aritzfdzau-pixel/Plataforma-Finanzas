// Zona de Conocimiento: listado de fichas y visor.
import { h, vaciar, chipCategoria } from './dom.js';
import { CATEGORIAS, nombreCategoria } from '../lib/categorias.js';
import { leerFicha } from '../lib/frontmatter.js';
import { markdownAHtml } from '../lib/markdown.js';

export function pintarFichas(contenedor, fichas) {
  vaciar(contenedor);
  for (const cat of CATEGORIAS) {
    const fs = fichas.filter((f) => f.categoria === cat.slug);
    if (fs.length === 0) continue;
    contenedor.append(h('div', { class: `grupo cat cat--${cat.slug}` },
      h('h3', { class: 'grupo__titulo' }, cat.nombre),
      h('ul', { class: 'lista' }, fs.map((f) => h('li', {},
        h('a', { class: 'lista__item', href: `#ficha=${encodeURIComponent(f.ruta)}` },
          h('span', { class: 'lista__titulo' }, f.titulo),
          h('span', { class: 'lista__resumen' }, f.etiquetas.join(' · '))))))));
  }
}

/** Muestra una ficha. Solo se aceptan rutas del índice (nada arbitrario desde la URL). */
export async function pintarFicha(contenedor, ruta, fichas) {
  vaciar(contenedor);
  const ficha = fichas.find((f) => f.ruta === ruta);
  if (!ficha) { contenedor.append(h('p', { class: 'error' }, 'Ficha no encontrada.')); return; }
  let md;
  try {
    const r = await fetch(`../${ficha.ruta}`);
    if (!r.ok) throw new Error(r.statusText);
    md = await r.text();
  } catch {
    contenedor.append(h('p', { class: 'error' }, 'No se ha podido cargar la ficha.'));
    return;
  }
  const { cuerpo } = leerFicha(md);
  const articulo = h('article', { class: 'ficha' });
  articulo.innerHTML = markdownAHtml(cuerpo); // markdownAHtml escapa todo el texto
  contenedor.append(
    h('p', { class: 'ficha__meta' },
      h('a', { href: '#', class: 'ficha__volver' }, '← Todas las fichas'), ' ',
      chipCategoria(ficha.categoria, nombreCategoria(ficha.categoria)), ' ',
      h('span', { class: 'chip' }, ficha.idioma.toUpperCase()), ' ',
      h('small', {}, `Revisada: ${ficha.ultima_revision}`)),
    articulo,
    h('p', { class: 'ficha__nota' }, 'Las fórmulas se muestran en notación LaTeX.'),
  );
}
