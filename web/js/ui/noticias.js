// Zona de Noticias: cabecera con 3–5 titulares y panel "Ver todas" con filtros.
// Datos: datos/noticias.json (tarea programada; etiqueta "con retraso").
// Solo titular, fuente, hora y enlace (AGENTS.md §3).
import { h, vaciar, chipCategoria } from './dom.js';
import { nombreCategoria } from '../lib/categorias.js';
import {
  CATEGORIAS_NOTICIAS, ESTADOS_FEED, filtrarNoticias, fuentesDe, horaNoticia, enlaceNoticia,
} from '../lib/noticias.js';

const EN_CABECERA = 5;

let promesa = null;
export function cargarNoticias() {
  promesa ??= fetch('../datos/noticias.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return promesa;
}

function titular(n, ahora) {
  const url = enlaceNoticia(n.enlace);
  return h('li', { class: 'noticia' },
    h('span', { class: 'noticia__meta' },
      h('time', { class: 'num', datetime: n.fecha ?? '' }, horaNoticia(n.fecha, ahora)),
      ' · ', n.fuente,
      n.dePago ? h('span', { class: 'chip chip--pago', title: 'Fuente con muro de pago' }, 'de pago') : null),
    url
      ? h('a', { class: 'noticia__titulo', href: url, target: '_blank', rel: 'noopener noreferrer' }, n.titulo)
      : h('span', { class: 'noticia__titulo' }, n.titulo),
    n.etiquetas?.length ? h('span', { class: 'noticia__etiquetas' }, n.etiquetas.map((e) => chipCategoria(e, nombreCategoria(e)))) : null);
}

export async function pintarCabeceraNoticias(cuerpo) {
  const datos = await cargarNoticias();
  vaciar(cuerpo);
  if (!datos) { cuerpo.append(h('p', { class: 'vacio' }, 'Noticias no disponibles todavía (la tarea las publica cada hora).')); return; }
  if (!datos.noticias.length) { cuerpo.append(h('p', { class: 'vacio' }, 'Sin titulares en este momento. Revisa el estado de las fuentes en «Ver todas».')); return; }
  cuerpo.append(h('ul', { class: 'noticias' }, datos.noticias.slice(0, EN_CABECERA).map((n) => titular(n, datos.generado))));
}

export async function pintarPanelNoticias(dialogo) {
  const contenido = dialogo.querySelector('.panel__contenido');
  const datos = await cargarNoticias();
  vaciar(contenido);
  if (!datos) { contenido.append(h('p', { class: 'vacio' }, 'Noticias no disponibles todavía.')); return; }

  const filtros = { fuente: '', categoria: '', texto: '' };
  const lista = h('ul', { class: 'noticias noticias--panel' });
  const contador = h('p', { class: 'noticias__contador', 'aria-live': 'polite' });
  const repintar = () => {
    const visibles = filtrarNoticias(datos.noticias, filtros);
    vaciar(lista).append(...visibles.map((n) => titular(n, datos.generado)));
    contador.textContent = `${visibles.length} de ${datos.noticias.length} titulares`;
    if (!visibles.length) lista.append(h('li', { class: 'vacio' }, 'Ningún titular coincide con los filtros.'));
  };
  const selector = (id, etiqueta, opciones, clave) => h('div', { class: 'campo' },
    h('label', { for: id }, etiqueta),
    h('select', { id, onchange: (e) => { filtros[clave] = e.target.value; repintar(); } },
      h('option', { value: '' }, 'Todas'), opciones.map(([v, t]) => h('option', { value: v }, t))));

  const fuentes = fuentesDe(datos);
  contenido.append(
    h('p', {}, h('span', { class: 'chip' }, datos.etiqueta), ` Actualizado: ${horaNoticia(datos.generado, datos.generado)} (hora de Madrid). ${datos.aviso}`),
    h('div', { class: 'filtros-noticias' },
      selector('filtro-fuente', 'Fuente', fuentes.map((f) => [f.nombre, f.dePago ? `${f.nombre} (de pago)` : f.nombre]), 'fuente'),
      selector('filtro-categoria', 'Categoría', CATEGORIAS_NOTICIAS.map((c) => [c.slug, c.nombre]), 'categoria'),
      h('div', { class: 'campo' }, h('label', { for: 'filtro-texto' }, 'Buscar en titulares'),
        h('input', { id: 'filtro-texto', type: 'search', autocomplete: 'off', oninput: (e) => { filtros.texto = e.target.value; repintar(); } }))),
    contador, lista,
    estadoFuentes(datos));
  repintar();
}

function estadoFuentes(datos) {
  return h('details', { class: 'tabla-op' },
    h('summary', {}, `Estado de las fuentes (${datos.fuentes.filter((f) => f.estado === 'ok').length}/${datos.fuentes.length} activas)`),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-fuentes' },
      h('thead', {}, h('tr', {}, ['Feed', 'Fuente', 'Estado', 'Titulares', 'Último'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, datos.fuentes.map((f) => h('tr', {},
        h('th', { scope: 'row' }, f.id),
        h('td', {}, f.fuente, f.dePago ? ' (de pago)' : ''),
        h('td', { class: `estado-feed estado-feed--${f.estado}` }, ESTADOS_FEED[f.estado] ?? f.estado, f.error ? ` (${f.error})` : ''),
        h('td', { class: 'num' }, String(f.titulares)),
        h('td', { class: 'num' }, horaNoticia(f.ultima, datos.generado))))))));
}
