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

/**
 * Lee la tabla del catálogo de patrones (patrones/README.md):
 *   | ID | Nombre | Función(es) | Tests | Usado por | Estado |
 * `operaciones` = los "Usado por" que son operaciones; `otros` = zonas de la web (p. ej. históricos).
 */
export function leerCatalogoPatrones(md) {
  const patrones = [];
  for (const linea of md.split('\n')) {
    const m = /^\|\s*(P-\d{3})\s*\|/.exec(linea);
    if (!m) continue;
    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
    const usados = celdas[4].split(',').map((u) => u.trim()).filter(Boolean);
    patrones.push({
      id: m[1],
      nombre: celdas[1],
      funciones: [...celdas[2].matchAll(/`(\w+)`/g)].map((x) => x[1]),
      operaciones: usados.filter((u) => OPERACIONES.includes(u)),
      otros: usados.filter((u) => !OPERACIONES.includes(u)),
      estado: celdas[5],
    });
  }
  return patrones;
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
    patrones: leerCatalogoPatrones(readFileSync(join(RAIZ, 'patrones/README.md'), 'utf8')),
  };
}
