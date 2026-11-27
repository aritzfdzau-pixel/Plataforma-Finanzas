// Buscador de empresas (D-043): prepara enlaces a eInforma, Axesor, BORME, CNMV y Registradores.
// No descarga ni guarda nada; lo escrito solo sale del navegador al pulsar un enlace.
import { h, vaciar } from './dom.js';
import { enlacesEmpresa, esCifValido, FUENTES_EMPRESAS } from '../lib/empresas.js';

/** Copia al portapapeles (si el navegador lo permite) y devuelve si lo ha conseguido. */
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

export function pintarBuscadorEmpresas(contenedor, inicial = '') {
  vaciar(contenedor);
  const resultados = h('div', { class: 'empresas__resultados', 'aria-live': 'polite' });
  const estado = h('p', { class: 'campo__lectura', 'aria-live': 'polite' });
  const input = h('input', { id: 'empresa-termino', type: 'search', autocomplete: 'off', spellcheck: 'false', placeholder: 'Nombre de la empresa o NIF (p. ej. B12345674)', value: inicial });

  const pintar = () => {
    vaciar(resultados);
    const t = input.value.trim();
    estado.textContent = !t ? '' : esCifValido(t) ? 'NIF de sociedad válido: se añade el enlace directo a la ficha.' : 'Se buscará por nombre.';
    const enlaces = enlacesEmpresa(t);
    if (!enlaces.length) { resultados.append(h('p', { class: 'vacio' }, 'Escribe al menos 2 caracteres.')); return; }
    resultados.append(h('ul', { class: 'empresas__lista' }, enlaces.map((e) => {
      const abrir = async (ev) => {
        if (e.modo !== 'copiar') return; // el enlace directo se abre tal cual
        ev.preventDefault();
        const ok = await copiar(e.termino);
        window.open(e.url, '_blank', 'noopener,noreferrer');
        estado.textContent = ok ? `«${e.termino}» copiado: pégalo en el buscador de ${e.nombre} (Ctrl+V).` : `Copia «${e.termino}» y pégalo en el buscador de ${e.nombre}.`;
      };
      return h('li', { class: 'empresas__fuente' },
        h('div', {},
          h('strong', {}, e.nombre), ' ', h('span', { class: 'chip' }, e.tipo),
          h('small', { class: 'campo__ayuda' }, ` ${e.acceso}`),
          h('p', { class: 'empresas__desc' }, e.nota ? `${e.nota}. ` : '', e.descripcion)),
        h('a', { class: 'button', href: e.url, target: '_blank', rel: 'noopener noreferrer', onclick: abrir },
          e.modo === 'copiar' ? `Abrir ${e.nombre} y copiar` : `Abrir ficha en ${e.nombre}`));
    })));
  };

  input.addEventListener('input', () => {
    pintar();
    history.replaceState(null, '', input.value.trim() ? `#empresa=${encodeURIComponent(input.value.trim())}` : '#empresa');
  });

  contenedor.append(
    h('header', { class: 'op__cabecera' },
      h('span', { class: 'chip cat cat--empresas' }, 'Empresas'),
      h('h3', { class: 'op__titulo', tabindex: '-1' }, 'Buscador de empresas', h('span', { class: 'op__en' }, ' (company lookup)')),
      h('p', { class: 'op__resumen' }, `Abre la búsqueda en ${FUENTES_EMPRESAS.map((f) => f.nombre).join(', ')}. La web no descarga ni guarda datos de estas fuentes.`)),
    h('p', { class: 'aviso' }, 'Lo que escribas sale de tu navegador solo cuando pulsas un enlace, y llega a la web elegida. No busques aquí empresas clientes de tu entidad: usa los accesos corporativos que os da el banco.'),
    h('div', { class: 'campo' }, h('label', { for: 'empresa-termino' }, 'Empresa (nombre o NIF)'), input, estado),
    resultados,
    h('p', { class: 'campo__ayuda' }, 'Con las cuentas anuales que encuentres puedes rellenar el ',
      h('a', { href: '#op=analisis-estados-financieros' }, 'Análisis de estados financieros'), ' y el ',
      h('a', { href: '#op=circulante-nof' }, 'Circulante y NOF'), '.'));
  pintar();
  input.focus();
}
