// Barra de comandos («/»): busca operaciones y fichas.
import { h, vaciar, chipCategoria } from './dom.js';
import { buscar } from '../lib/buscar.js';
import { nombreCategoria } from '../lib/categorias.js';
import { irA } from './rutas.js';

/** `extra`: promesa de elementos adicionales ({ titulo, categoria, tipo, hash, … }), p. ej. índices y valores. */
export function iniciarPaleta(indice, extra = Promise.resolve([])) {
  const dialogo = document.getElementById('paleta');
  const input = document.getElementById('paleta-input');
  const lista = document.getElementById('paleta-resultados');
  const elementos = [
    ...indice.operaciones.map((o) => ({ ...o, tipo: 'Operación', hash: `#op=${encodeURIComponent(o.id)}`, descripcion: o.resumen })),
    ...indice.fichas.map((f) => ({ ...f, tipo: 'Ficha', hash: `#ficha=${encodeURIComponent(f.ruta)}` })),
  ].map((e) => ({ ...e, categoriaNombre: nombreCategoria(e.categoria) }));
  extra.then((lista) => elementos.push(...lista.map((e) => ({ ...e, categoriaNombre: nombreCategoria(e.categoria) })))).catch(() => {});
  let resultados = []; let activo = 0;

  const pintar = () => {
    resultados = buscar(elementos, input.value).slice(0, 12);
    activo = Math.min(activo, Math.max(resultados.length - 1, 0));
    vaciar(lista);
    if (resultados.length === 0) lista.append(h('li', { class: 'vacio' }, 'Sin resultados'));
    resultados.forEach((e, k) => lista.append(h('li', {
      class: `paleta__item${k === activo ? ' is-activo' : ''}`, role: 'option', 'aria-selected': String(k === activo),
      onmousedown: (ev) => { ev.preventDefault(); elegir(k); },
    }, chipCategoria(e.categoria, e.categoriaNombre), h('span', { class: 'paleta__titulo' }, e.titulo), h('small', {}, e.tipo))));
  };
  const elegir = (k) => { const e = resultados[k]; if (!e) return; dialogo.close(); irA(e.hash); };
  const abrir = () => { input.value = ''; activo = 0; pintar(); dialogo.showModal(); input.focus(); };

  input.addEventListener('input', () => { activo = 0; pintar(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { activo = Math.min(activo + 1, resultados.length - 1); pintar(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { activo = Math.max(activo - 1, 0); pintar(); e.preventDefault(); }
    if (e.key === 'Enter') { elegir(activo); e.preventDefault(); }
  });
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const escribiendo = t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
    if (e.key === '/' && !escribiendo && !e.ctrlKey && !e.metaKey && !e.altKey && !dialogo.open) { e.preventDefault(); abrir(); }
  });
  document.getElementById('abrir-paleta').addEventListener('click', abrir);
}
