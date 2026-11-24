// Ayudas mínimas de DOM. Todo el texto entra con textContent (nunca HTML sin escapar).

/** h('div', { class: 'x', onclick: fn }, 'texto', otroNodo) */
export function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

export function vaciar(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Chip de categoría con su color fijo. */
export function chipCategoria(slug, nombre) {
  return h('span', { class: `chip cat cat--${slug}` }, nombre);
}
