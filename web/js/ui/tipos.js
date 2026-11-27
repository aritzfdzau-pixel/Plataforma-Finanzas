// Zona «Tipos de interés (Interest rates)» de la portada (D-044): tipos oficiales de los bancos
// centrales y del mercado monetario, desde datos/historicos.json (referencias oficiales).
import { h, vaciar } from './dom.js';
import { numero } from '../lib/formato.js';
import { fechaEs } from '../lib/divisas.js';
import { filasTipos } from '../lib/tipos.js';
import { cargarHistoricos, verSerieEnHistoricos } from './historicos.js';

const pctTexto = (v) => (Number.isFinite(v) ? `${numero(v, 2, 3)}\u00a0%` : '—'); // sin cortar «%»

/** ▲ ▼ con el cambio en pb (nunca solo color). */
function cambioPb(pb, titulo) {
  if (pb === null || !Number.isFinite(pb)) return h('span', { class: 'num tipos__cambio' }, '—');
  if (Math.abs(pb) < 1e-9) return h('span', { class: 'num tipos__cambio', title: titulo }, '0 pb');
  return h('span', { class: `num tipos__cambio ${pb > 0 ? 'var-up' : 'var-down'}`, title: titulo },
    h('span', { class: 'visually-hidden' }, pb > 0 ? 'sube ' : 'baja '), `${numero(Math.abs(pb), 0, 1)} pb`);
}

function fila(f, oficial) {
  const r = f.resumen;
  const nombre = h('button', { type: 'button', class: 'tipos__nombre', title: 'Ver la serie en Históricos', onclick: () => verSerieEnHistoricos(f.serie) }, f.nombre);
  if (!r) return h('tr', {}, h('th', { scope: 'row' }, nombre, h('small', { class: 'tipos__dato' }, 'sin datos todavía')), h('td', { class: 'num' }, '—'), h('td', { class: 'num' }, '—'));
  const valor = f.resumenInferior ? `${numero(f.resumenInferior.valor, 2)} – ${pctTexto(r.valor)}` : pctTexto(r.valor);
  const dato = oficial
    ? (r.vigenteDesde ? `vigente desde ${fechaEs(r.vigenteDesde)}` : 'sin cambios en los datos descargados')
    : `${fechaEs(r.fecha)}${f.mensual ? ' · media mensual' : ''}`;
  return h('tr', {},
    h('th', { scope: 'row' }, nombre, h('small', { class: 'tipos__dato' }, dato)),
    h('td', { class: 'num tipos__valor' }, valor),
    h('td', { class: 'num' }, oficial ? cambioPb(r.cambioUltimoPb, 'Último cambio de tipo') : cambioPb(r.cambioPb, 'Frente al dato anterior')));
}

export async function pintarZonaTipos(cuerpo, abrirOperativa) {
  vaciar(cuerpo).append(h('p', { class: 'vacio' }, 'Cargando tipos de interés…'));
  const datos = await cargarHistoricos();
  vaciar(cuerpo);
  if (!datos) { cuerpo.append(h('p', { class: 'vacio' }, 'Datos oficiales no disponibles todavía (la tarea diaria los publica).')); return; }
  for (const b of filasTipos(datos.series)) {
    const fuentes = [...new Set(b.filas.map((f) => f.etiqueta).filter(Boolean))];
    cuerpo.append(h('div', { class: 'tipos__bloque' },
      h('p', { class: 'mercados__subtitulo' }, b.titulo),
      h('p', { class: 'tipos__fuentes' }, fuentes.map((e) => h('span', { class: 'chip' }, e))),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tipos__tabla' },
        h('caption', { class: 'visually-hidden' }, b.titulo),
        h('thead', {}, h('tr', {},
          h('th', { scope: 'col' }, b.oficial ? 'Tipo y vigencia' : 'Tipo y fecha'), h('th', { scope: 'col' }, 'Nivel'),
          h('th', { scope: 'col' }, b.oficial ? 'Último cambio' : 'Cambio'))),
        h('tbody', {}, b.filas.map((f) => fila(f, b.oficial)))))));
  }
  cuerpo.append(h('p', { class: 'tipos__pie' },
    h('small', { class: 'campo__ayuda' }, 'El Euribor diario no se publica: es un dato con licencia de EMMI; se usa la media mensual oficial (BCE y Banco de España).'),
    h('button', { type: 'button', class: 'button', onclick: abrirOperativa }, 'Calcular con tipos de interés')));
}
