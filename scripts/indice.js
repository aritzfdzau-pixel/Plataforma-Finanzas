// Construye el índice de fichas y operaciones a partir de las cabeceras de las fichas.
// Lo usan scripts/generar-indice.js (escribe conocimiento/indice.json) y los tests.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerFicha } from '../web/js/lib/frontmatter.js';
import { CATEGORIAS } from '../web/js/lib/categorias.js';
import { OPERACIONES, cargarOperacion } from '../operativa/operaciones/indice.js';

export const RAIZ = fileURLToPath(new URL('..', import.meta.url));

export function rutasFichas() {
  const dir = join(RAIZ, 'conocimiento');
  const out = [];
  for (const cat of readdirSync(dir).sort()) {
    const p = join(dir, cat);
    if (!statSync(p).isDirectory()) continue;
    for (const f of readdirSync(p).sort()) if (f.endsWith('.md')) out.push(relative(RAIZ, join(p, f)).split(sep).join('/'));
  }
  return out;
}

export async function construirIndice() {
  const fichas = rutasFichas().map((ruta) => {
    const { cabecera } = leerFicha(readFileSync(join(RAIZ, ruta), 'utf8'));
    return {
      ruta,
      titulo: cabecera.titulo,
      idioma: cabecera.idioma,
      traduccion: cabecera.traduccion || null,
      categoria: cabecera.categoria,
      etiquetas: cabecera.etiquetas ?? [],
      operaciones: cabecera.operaciones ?? [],
      patrones: cabecera.patrones ?? [],
      ultima_revision: cabecera.ultima_revision,
    };
  });
  // El listado de operaciones sale de las fichas: solo aparecen las que alguna ficha genera.
  const operaciones = [];
  for (const ficha of fichas) {
    for (const id of ficha.operaciones) {
      if (operaciones.some((o) => o.id === id)) continue;
      const op = OPERACIONES.includes(id) ? await cargarOperacion(id) : null;
      operaciones.push({
        id,
        titulo: op?.titulo ?? null,
        tituloIngles: op?.tituloIngles ?? null,
        resumen: op?.resumen ?? null,
        categoria: ficha.categoria,
        ficha: ficha.ruta,
        etiquetas: ficha.etiquetas,
      });
    }
  }
  const orden = (a, b) => CATEGORIAS.findIndex((c) => c.slug === a.categoria) - CATEGORIAS.findIndex((c) => c.slug === b.categoria);
  return {
    _aviso: 'Archivo generado con «node scripts/generar-indice.js». No editar a mano.',
    fichas: fichas.sort(orden),
    operaciones: operaciones.sort(orden),
  };
}
