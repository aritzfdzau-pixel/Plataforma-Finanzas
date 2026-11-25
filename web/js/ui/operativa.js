// Zona de Operativa: listado por categoría y formulario genérico de cada operación.
import { h, vaciar, chipCategoria } from './dom.js';
import { cargarOperacion } from '../../../operativa/operaciones/indice.js';
import { AVISO_ESTUDIO } from '../../../operativa/operaciones/_comun.js';
import { leerCampo, campoVisible } from '../lib/campos.js';
import { formatear, leerNumero, esMilesConPunto, numero, sentidoVariacion } from '../lib/formato.js';
import { buscar } from '../lib/buscar.js';
import { CATEGORIAS, nombreCategoria } from '../lib/categorias.js';
import { tablaACsv } from '../lib/csv.js';
import { cargarTiposBce } from './divisas.js';
import { tipoBce, aTextoCampo, fechaEs } from '../lib/divisas.js';

const ETIQUETAS_CONVENCIONES = {
  base: 'Base de cálculo', periodicidad: 'Periodicidad', nominalEfectivo: 'Nominal / efectivo', comisiones: 'Comisiones',
};

export function pintarListado(contenedor, operaciones, filtro = '') {
  vaciar(contenedor);
  const elementos = operaciones.map((o) => ({ ...o, categoriaNombre: nombreCategoria(o.categoria) }));
  const visibles = buscar(elementos, filtro);
  if (visibles.length === 0) {
    contenedor.append(h('p', { class: 'vacio' }, 'Ninguna operación coincide con la búsqueda.'));
    return;
  }
  for (const cat of CATEGORIAS) {
    const ops = visibles.filter((o) => o.categoria === cat.slug);
    if (ops.length === 0) continue;
    contenedor.append(h('div', { class: `grupo cat cat--${cat.slug}` },
      h('h3', { class: 'grupo__titulo' }, cat.nombre),
      h('ul', { class: 'lista' }, ops.map((o) => h('li', {},
        h('a', { class: 'lista__item', href: `#op=${encodeURIComponent(o.id)}`, 'data-id': o.id },
          h('span', { class: 'lista__titulo' }, o.titulo),
          h('span', { class: 'lista__resumen' }, o.resumen)))))));
  }
}

/**
 * Pinta la operación `id` en `contenedor`; `params` rellena campos desde la URL.
 * `prefijo` distingue los id de los campos si la misma página muestra dos formularios.
 */
export async function pintarOperacion(contenedor, id, params = {}, { prefijo = 'campo' } = {}) {
  vaciar(contenedor);
  let op;
  try {
    op = await cargarOperacion(id);
  } catch {
    contenedor.append(h('p', { class: 'error' }, `Operación desconocida: ${id}`));
    return;
  }
  const textos = {};
  for (const c of op.campos) textos[c.id] = params[c.id] ?? c.defecto ?? '';

  // Campos que se rellenan con el tipo de referencia del BCE del día (datos/tipos-bce.json).
  const conBce = op.campos.filter((c) => c.rellenarCon?.fuente === 'bce');
  const datosBce = conBce.length ? await cargarTiposBce() : null;
  const notaBce = (c) => {
    const t = tipoBce(datosBce, textos[c.rellenarCon.divisa]);
    if (!datosBce) return 'Tipo BCE no disponible: introdúcelo a mano.';
    return t ? `Referencia BCE del ${fechaEs(datosBce.fecha)}, cargada automáticamente (puedes cambiarla).`
      : 'Sin tipo BCE para esta divisa: introdúcelo a mano.';
  };
  const rellenarBce = (c) => {
    const t = tipoBce(datosBce, textos[c.rellenarCon.divisa]);
    // Sin tipo para la divisa elegida se vacía el campo: nunca se deja el de otra divisa.
    textos[c.id] = t ? aTextoCampo(t.tipo) : (datosBce ? '' : textos[c.id]);
  };
  for (const c of conBce) if (params[c.id] === undefined) rellenarBce(c);

  const salida = h('div', { class: 'op__salida', 'aria-live': 'polite' });
  const form = h('form', { class: 'op__form', onsubmit: (e) => e.preventDefault(), novalidate: true });

  const recalcular = () => {
    const valores = {}; let hayErrores = false;
    for (const c of op.campos) {
      const ayuda = form.querySelector(`[data-lectura="${c.id}"]`);
      const visible = campoVisible(c, textos, op.campos);
      form.querySelector(`[data-campo="${c.id}"]`).hidden = !visible;
      if (!visible) { valores[c.id] = null; continue; }
      try {
        valores[c.id] = leerCampo(c, textos[c.id]);
        ayuda.textContent = lectura(c, textos[c.id], valores[c.id]);
        ayuda.classList.remove('campo__lectura--error');
      } catch (e) {
        hayErrores = true;
        ayuda.textContent = e.message;
        ayuda.classList.add('campo__lectura--error');
      }
    }
    vaciar(salida);
    if (hayErrores) { salida.append(h('p', { class: 'error' }, 'Revisa los campos marcados.')); return; }
    try {
      pintarResultado(salida, op.calcular(valores));
    } catch (e) {
      salida.append(h('p', { class: 'error' }, e.message));
    }
  };

  // Los campos con `grupo` se reúnen en un fieldset con su título (p. ej. "Año anterior").
  let grupoActual = null; let destino = form;
  for (const c of op.campos) {
    if ((c.grupo ?? null) !== grupoActual) {
      grupoActual = c.grupo ?? null;
      destino = grupoActual ? h('fieldset', { class: 'op__grupo' }, h('legend', {}, grupoActual)) : form;
      if (grupoActual) form.append(destino);
    }
    destino.append(campo(c, textos, recalcular, prefijo));
  }
  for (const c of conBce) {
    const nota = form.querySelector(`[data-nota-bce="${c.id}"]`);
    if (params[c.id] === undefined) nota.textContent = notaBce(c);
    else nota.textContent = 'Valor recibido del panel de divisas (puedes cambiarlo).';
    form.querySelector(`#${prefijo}-${c.rellenarCon.divisa}`).addEventListener('change', () => {
      rellenarBce(c);
      form.querySelector(`#${prefijo}-${c.id}`).value = textos[c.id];
      nota.textContent = notaBce(c);
      recalcular();
    });
  }

  contenedor.append(
    h('header', { class: 'op__cabecera' },
      chipCategoria(op.categoria, nombreCategoria(op.categoria)),
      h('h3', { class: 'op__titulo' }, op.titulo, op.tituloIngles ? h('span', { class: 'op__en' }, ` (${op.tituloIngles})`) : null),
      h('p', { class: 'op__resumen' }, op.resumen),
      h('p', { class: 'op__acciones' }, h('a', { href: `#ficha=${encodeURIComponent(op.ficha)}` }, 'Ver ficha →'))),
    h('p', { class: 'aviso' }, AVISO_ESTUDIO),
    h('div', { class: 'op__cuerpo' }, form, salida),
  );
  recalcular();
}

function campo(c, textos, recalcular, prefijo = 'campo') {
  const idInput = `${prefijo}-${c.id}`;
  let control;
  const alCambiar = (e) => { textos[c.id] = e.target.value; recalcular(); };
  if (c.tipo === 'casilla') {
    control = h('input', { id: idInput, type: 'checkbox', checked: textos[c.id] === 'si',
      onchange: (e) => { textos[c.id] = e.target.checked ? 'si' : 'no'; recalcular(); } });
    return h('div', { class: 'campo campo--casilla', 'data-campo': c.id },
      h('label', { for: idInput }, control, ` ${c.etiqueta}`),
      c.ayuda ? h('small', { class: 'campo__ayuda' }, c.ayuda) : null,
      h('small', { class: 'campo__lectura', 'data-lectura': c.id }));
  }
  if (c.tipo === 'seleccion') {
    control = h('select', { id: idInput, onchange: alCambiar },
      c.opciones.map((o) => h('option', { value: o.valor, selected: o.valor === textos[c.id] }, o.etiqueta)));
  } else if (c.tipo === 'serie') {
    control = h('textarea', { id: idInput, rows: 6, spellcheck: 'false', oninput: alCambiar });
    control.value = textos[c.id];
  } else {
    control = h('input', { id: idInput, type: 'text', inputmode: c.tipo === 'entero' ? 'numeric' : 'decimal', autocomplete: 'off', spellcheck: 'false', oninput: alCambiar,
      placeholder: c.opcional ? 'opcional' : null });
    control.value = textos[c.id];
  }
  return h('div', { class: `campo campo--${c.tipo}`, 'data-campo': c.id },
    h('label', { for: idInput }, c.etiqueta, c.unidad ? h('span', { class: 'campo__unidad' }, ` (${c.unidad})`) : null),
    control,
    c.ayuda ? h('small', { class: 'campo__ayuda' }, c.ayuda) : null,
    c.rellenarCon ? h('small', { class: 'campo__ayuda campo__ayuda--dato', 'data-nota-bce': c.id }) : null,
    h('small', { class: 'campo__lectura', 'data-lectura': c.id }));
}

/** Texto que muestra cómo se ha interpretado lo escrito. */
function lectura(c, texto, valor) {
  if (c.tipo === 'seleccion' || c.tipo === 'casilla') return '';
  if (valor === null) return 'Sin dato (opcional)';
  if (c.tipo === 'serie') return `${valor.length} valores leídos`;
  const n = leerNumero(texto);
  const base = c.tipo === 'porcentaje' ? `= ${numero(n, 2, 6)} %` : `= ${numero(n, c.tipo === 'entero' ? 0 : 2, 6)}`;
  return esMilesConPunto(texto) ? `${base} (punto leído como separador de miles)` : base;
}

// Semáforo: siempre icono + texto (nunca solo color, AGENTS §12).
const ICONO_ESTADO = { ok: '✓', vigilancia: '!', alto: '✕', nd: '–' };

function filaResultado(r) {
  const clases = ['num', 'res__valor'];
  const sv = r.variacion ? sentidoVariacion(r.valor, r.variacion) : null;
  if (sv) clases.push(sv.clase);
  const numerico = Number.isFinite(r.valor);
  const texto = r.variacion && numerico ? formatear(Math.abs(r.valor), r.formato) : formatear(r.valor, r.formato);
  return h('div', { class: `res${r.destacado ? ' res--destacado' : ''}` },
    h('dt', { class: 'res__etiqueta' }, r.etiqueta,
      r.nota ? h('small', { class: 'res__nota' }, r.nota) : null,
      r.anterior !== undefined && r.anterior !== null
        ? h('small', { class: 'res__nota' }, `Año anterior: ${formatear(r.anterior, r.formato)}`) : null),
    h('dd', { class: clases.join(' ') },
      sv ? h('span', { class: 'visually-hidden' }, sv.texto) : null,
      texto,
      r.estado ? h('span', { class: `semaforo semaforo--${r.estado.nivel}` },
        h('span', { 'aria-hidden': 'true' }, ICONO_ESTADO[r.estado.nivel] ?? ''), ` ${r.estado.texto}`) : null));
}

function pintarResultado(salida, res) {
  // Divulgación progresiva: los destacados y los resultados sin grupo, a la vista; cada grupo
  // ("Liquidez", "Rentabilidad"…), en un bloque desplegable con su detalle.
  const sueltos = res.resultados.filter((r) => !r.grupo);
  const grupos = [...new Set(res.resultados.filter((r) => r.grupo).map((r) => r.grupo))];
  const resumen = sueltos.length ? sueltos : res.resultados.filter((r) => r.destacado);
  salida.append(...[
    res.etiquetaDato ? h('p', {}, h('span', { class: 'chip' }, res.etiquetaDato)) : null,
    h('dl', { class: 'resultados' }, resumen.map(filaResultado)),
    ...grupos.map((g) => h('details', { class: 'res-grupo' },
      h('summary', {}, g),
      h('dl', { class: 'resultados' }, res.resultados.filter((r) => r.grupo === g).map(filaResultado)))),
    h('div', { class: 'convenciones' },
      h('h4', {}, 'Convenciones'),
      h('dl', {}, Object.entries(ETIQUETAS_CONVENCIONES).map(([k, et]) => h('div', {}, h('dt', {}, et), h('dd', {}, res.convenciones[k]))))),
    res.avisos?.length ? h('ul', { class: 'avisos' }, res.avisos.map((a) => h('li', {}, a))) : null,
    res.tabla ? tabla(res.tabla) : null,
  ].filter(Boolean));
}

function tabla(t) {
  const descargar = () => {
    const blob = new Blob([tablaACsv(t)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: t.nombreCsv ?? 'tabla.csv' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return h('details', { class: 'tabla-op' },
    h('summary', {}, `Ver tabla (${t.filas.length} filas)`),
    h('p', {}, h('button', { type: 'button', class: 'button', onclick: descargar }, 'Exportar CSV'),
      h('small', { class: 'campo__ayuda' }, ' Separador «;» y coma decimal. Se genera en tu navegador.')),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num' },
      h('thead', {}, h('tr', {}, t.columnas.map((c) => h('th', { scope: 'col' }, c.etiqueta)))),
      h('tbody', {}, t.filas.map((f) => h('tr', {}, t.columnas.map((c) =>
        h('td', { class: 'num' }, Number.isFinite(f[c.id]) ? formatear(f[c.id], c.formato) : '—'))))))));
}
