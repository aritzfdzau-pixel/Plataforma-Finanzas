// Zona de Históricos: series oficiales (datos/historicos.json, tarea diaria) y CSV subidos por
// el usuario (se leen en el navegador; no salen de él). Gráfica SVG con medias móviles y
// estadísticos: rentabilidades, varianza, volatilidad histórica y EWMA, correlación, drawdown.
import { h, vaciar } from './dom.js';
import { formatear, numero } from '../lib/formato.js';
import { fechaEs } from '../lib/divisas.js';
import {
  leerCsvSerie, analizar, desde, correlacionSeries, mediasMoviles, NOMBRE_PERIODICIDAD, MAX_BYTES_CSV,
} from '../lib/series.js';
import { graficaLineas } from './grafica.js';

const ETIQUETA_SUBIDA = 'subida por ti (no sale del navegador)';
const PERIODOS = [['1A', 'Último año', 365], ['3A', '3 años', 365 * 3], ['TODO', 'Todo', null]];

let promesa = null;
export function cargarHistoricos() {
  promesa ??= fetch('../datos/historicos.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return promesa;
}

const estado = { series: [], id: null, comparar: '', periodo: '3A', mm: true };

function fechaDesde(hasta, dias) {
  if (!dias) return null;
  const d = new Date(`${hasta}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

function variacion(serie) {
  const p = serie.puntos;
  if (p.length < 2) return h('span', { class: 'num' }, '—');
  const [a, b] = [p.at(-2)[1], p.at(-1)[1]];
  const v = serie.tipo === 'tipo' ? (b - a) * 100 : b / a - 1;
  const texto = serie.tipo === 'tipo' ? `${numero(Math.abs(v), 0, 1)} pb` : formatear(Math.abs(v), 'pct:2');
  if (Math.abs(v) < 1e-12) return h('span', { class: 'num' }, serie.tipo === 'tipo' ? '0 pb' : formatear(0, 'pct:2'));
  return h('span', { class: `num ${v > 0 ? 'var-up' : 'var-down'}` }, h('span', { class: 'visually-hidden' }, v > 0 ? 'sube ' : 'baja '), texto);
}

const decimales = (s) => (s.tipo === 'tipo' ? 3 : s.unidad.startsWith('JPY') ? 2 : 4);

// La gráfica se dibuja al ancho real: se repinta al cambiar el tamaño (y al ir a pantalla grande).
let anchoPrevio = 0;
const observador = new ResizeObserver((entradas) => {
  const w = Math.round(entradas[0].contentRect.width);
  if (Math.abs(w - anchoPrevio) > 24) { anchoPrevio = w; pintarAnalisis(); }
});

/** Resumen compacto (tabla de series) + analizador. */
export async function pintarHistoricos(raiz) {
  const datos = await cargarHistoricos();
  estado.series = (datos?.series ?? []).filter((s) => s.puntos?.length >= 3);
  estado.id ??= estado.series.find((s) => s.id === 'eurusd')?.id ?? estado.series[0]?.id ?? null;
  vaciar(raiz).append(
    resumen(datos),
    h('div', { class: 'historicos__analisis', id: 'analisis-historicos' }),
    subidaCsv(raiz));
  const analisis = raiz.querySelector('#analisis-historicos');
  anchoPrevio = analisis.clientWidth;
  pintarAnalisis();
  observador.observe(analisis);
}

function resumen(datos) {
  if (!datos) return h('p', { class: 'vacio' }, 'Series oficiales no disponibles todavía (la tarea diaria las publica). Puedes subir tu propio CSV abajo.');
  return h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-historicos' },
    h('thead', {}, h('tr', {}, ['Serie', 'Último', 'Fecha', 'Variación', 'Dato'].map((t) => h('th', { scope: 'col' }, t)))),
    h('tbody', {}, datos.series.map((s) => h('tr', { class: s.id === estado.id ? 'is-activa' : '' },
      h('th', { scope: 'row' }, s.puntos.length >= 3
        ? h('button', { type: 'button', class: 'enlace-boton', onclick: () => { estado.id = s.id; estado.comparar = ''; pintarAnalisis(); marcarActiva(); } }, s.nombre)
        : s.nombre),
      h('td', { class: 'num' }, s.puntos.length ? `${numero(s.puntos.at(-1)[1], decimales(s))}${s.tipo === 'tipo' ? ' %' : ''}` : '—'),
      h('td', { class: 'num' }, s.puntos.length ? fechaEs(s.puntos.at(-1)[0]) : '—'),
      h('td', {}, variacion(s)),
      h('td', {}, h('span', { class: 'chip' }, s.etiqueta), s.estado === 'error' ? h('small', { class: 'historicos__error' }, ` ⚠️ ${s.error}`) : null))))));
}

function marcarActiva() {
  document.querySelectorAll('.tabla-historicos tbody tr').forEach((tr, k) => tr.classList.toggle('is-activa', estado.series[k]?.id === estado.id));
}

function pintarAnalisis() {
  const cont = document.getElementById('analisis-historicos');
  if (!cont) return;
  vaciar(cont);
  const serie = estado.series.find((s) => s.id === estado.id);
  if (!serie) { cont.append(h('p', { class: 'vacio' }, 'Elige una serie o sube un CSV.')); return; }

  const sel = (id, etiqueta, opciones, valor, alCambiar) => h('div', { class: 'campo' },
    h('label', { for: id }, etiqueta),
    h('select', { id, onchange: (e) => { alCambiar(e.target.value); pintarAnalisis(); } },
      opciones.map(([v, t]) => h('option', { value: v, selected: v === valor }, t))));
  const opcionesSeries = estado.series.map((s) => [s.id, s.nombre]);
  cont.append(h('div', { class: 'filtros-noticias' },
    sel('hist-serie', 'Serie', opcionesSeries, estado.id, (v) => { estado.id = v; marcarActiva(); }),
    sel('hist-periodo', 'Periodo', PERIODOS.map(([v, t]) => [v, t]), estado.periodo, (v) => { estado.periodo = v; }),
    sel('hist-comparar', 'Correlación con', [['', '—'], ...opcionesSeries.filter(([v]) => v !== estado.id)], estado.comparar, (v) => { estado.comparar = v; }),
    h('div', { class: 'campo campo--check' }, h('label', {},
      h('input', { type: 'checkbox', checked: estado.mm, onchange: (e) => { estado.mm = e.target.checked; pintarAnalisis(); } }),
      ' Medias móviles'))));

  const dias = PERIODOS.find((p) => p[0] === estado.periodo)[2];
  const puntos = desde(serie.puntos, fechaDesde(serie.puntos.at(-1)[0], dias));
  if (puntos.length < 3) { cont.append(h('p', { class: 'vacio' }, 'Pocos datos en este periodo.')); return; }

  let st;
  try { st = analizar(puntos, serie.tipo); } catch (e) { cont.append(h('p', { class: 'error' }, e.message)); return; }
  const ventanas = st.periodosPorAnio === 252 ? [20, 50] : st.periodosPorAnio === 12 ? [3, 12] : [4, 12];
  const mm = estado.mm ? mediasMoviles(puntos, ventanas) : [];
  const fechas = puntos.map((p) => p[0]);
  cont.append(
    h('p', { class: 'historicos__cabecera' }, h('span', { class: 'chip' }, serie.etiqueta),
      ` ${serie.nombre} · ${serie.unidad} · ${fechaEs(st.desde)} – ${fechaEs(st.hasta)} · ${st.n} observaciones · periodicidad ${NOMBRE_PERIODICIDAD[st.periodosPorAnio]}`),
    graficaLineas({
      fechas,
      titulo: `Evolución de ${serie.nombre}`,
      unidad: serie.tipo === 'tipo' ? '%' : '',
      ancho: cont.clientWidth,
      series: [{ nombre: serie.id.startsWith('csv-') ? serie.nombre : serie.id.toUpperCase(), valores: puntos.map((p) => p[1]) },
        ...mm.map((m) => ({ nombre: `MM ${m.n}`, valores: m.valores }))],
    }),
    estadisticos(serie, st),
    correlacion(serie, puntos),
    tablaDatos(serie, puntos));
}

function estadisticos(serie, st) {
  const fila = (et, v, nota) => h('div', { class: 'res' }, h('dt', { class: 'res__etiqueta' }, et, nota ? h('small', { class: 'res__nota' }, nota) : null), h('dd', { class: 'num res__valor' }, v));
  const pct = (x) => formatear(x, 'pct:2');
  const pb = (x) => `${numero(x, 1)} pb`;
  const filas = serie.tipo === 'tipo'
    ? [
      fila('Cambio en el periodo', pb(st.cambioTotalPb)),
      fila('Cambio medio por periodo', pb(st.mediaCambioPb)),
      fila('Desviación típica de los cambios', pb(st.desviacionCambioPb), 'Muestral (n − 1)'),
      fila('Volatilidad histórica anualizada', pb(st.volatilidadAnualPb), `Desviación × √${st.periodosPorAnio}`),
      fila('Volatilidad EWMA anualizada', pb(st.ewmaAnualPb), 'λ = 0,94 (RiskMetrics); pesa más lo reciente'),
      fila('Mínimo / máximo', `${numero(st.minimo, 3)} % / ${numero(st.maximo, 3)} %`),
    ]
    : [
      fila('Rentabilidad del periodo', pct(st.rentabilidadTotal), 'Simple: último / primero − 1'),
      fila('Rentabilidad media por periodo', `${pct(st.mediaSimple)} · log ${pct(st.mediaLog)}`),
      fila('Varianza (rentabilidades log)', numero(st.varianzaLog, 8), 'Muestral (n − 1)'),
      fila('Volatilidad histórica anualizada', pct(st.volatilidadAnual), `Desviación típica log × √${st.periodosPorAnio}`),
      fila('Volatilidad EWMA anualizada', pct(st.ewmaAnual), 'λ = 0,94 (RiskMetrics); pesa más lo reciente'),
      fila('Máximo drawdown', pct(st.drawdown), `Del ${fechaEs(st.fechaPico)} al ${fechaEs(st.fechaValle)}`),
    ];
  return h('div', { class: 'estadisticos' }, h('h4', {}, 'Estadísticos'), h('dl', { class: 'resultados' }, filas),
    h('p', { class: 'campo__ayuda' }, serie.tipo === 'tipo'
      ? 'Tipos de interés: se analizan las variaciones en puntos básicos (no hay "rentabilidad" de un tipo).'
      : 'Rentabilidades calculadas entre observaciones consecutivas, sin dividendos ni costes.'));
}

function correlacion(serie, puntos) {
  if (!estado.comparar) return '';
  const otra = estado.series.find((s) => s.id === estado.comparar);
  if (!otra) return '';
  try {
    const c = correlacionSeries(puntos, serie.tipo, otra.puntos, otra.tipo);
    return h('p', { class: 'historicos__correlacion' },
      `Correlación (Pearson) de las variaciones de ${serie.nombre} y ${otra.nombre}: `,
      h('strong', { class: 'num' }, numero(c.correlacion, 3)),
      ` · ${c.comunes} fechas comunes (${fechaEs(c.desde)} – ${fechaEs(c.hasta)}).`);
  } catch (e) {
    return h('p', { class: 'error' }, e.message);
  }
}

function tablaDatos(serie, puntos) {
  const ultimos = puntos.slice(-60).reverse();
  return h('details', { class: 'tabla-op' }, h('summary', {}, `Ver datos (últimas ${ultimos.length} observaciones)`),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Fecha'), h('th', { scope: 'col' }, `Valor (${serie.unidad})`))),
      h('tbody', {}, ultimos.map(([f, v]) => h('tr', {}, h('td', { class: 'num' }, fechaEs(f)), h('td', { class: 'num' }, numero(v, decimales(serie)))))))));
}

function subidaCsv(raiz) {
  const mensaje = h('div', { class: 'historicos__mensaje', 'aria-live': 'polite' });
  const tipo = h('select', { id: 'csv-tipo' },
    h('option', { value: 'precio' }, 'Precio o cotización (rentabilidades)'),
    h('option', { value: 'tipo' }, 'Tipo de interés en % (variaciones en pb)'));
  const archivo = h('input', { type: 'file', id: 'csv-archivo', accept: '.csv,.txt,text/csv' });
  archivo.addEventListener('change', () => {
    const f = archivo.files?.[0];
    if (!f) return;
    vaciar(mensaje);
    if (f.size > MAX_BYTES_CSV) { mensaje.append(h('p', { class: 'error' }, 'El archivo supera 5 MB.')); return; }
    f.text().then((texto) => {
      const { nombre, puntos, avisos } = leerCsvSerie(texto, f.name);
      const id = `csv-${estado.series.filter((s) => s.id.startsWith('csv-')).length + 1}`;
      estado.series.push({ id, nombre, tipo: tipo.value, unidad: tipo.value === 'tipo' ? '%' : 'valor', etiqueta: ETIQUETA_SUBIDA, puntos });
      estado.id = id; estado.comparar = '';
      mensaje.append(h('p', {}, `Leídas ${puntos.length} observaciones de «${nombre}» (${fechaEs(puntos[0][0])} – ${fechaEs(puntos.at(-1)[0])}).`),
        ...(avisos.length ? [h('ul', { class: 'avisos' }, avisos.map((a) => h('li', {}, a)))] : []));
      pintarAnalisis();
      raiz.querySelector('#analisis-historicos')?.scrollIntoView({ block: 'nearest' });
    }).catch((e) => mensaje.append(h('p', { class: 'error' }, e.message)));
    archivo.value = '';
  });
  return h('section', { class: 'historicos__subida' },
    h('h4', {}, 'Subir un CSV propio'),
    h('p', { class: 'campo__ayuda' }, 'Dos columnas (fecha y valor) separadas por «;» con coma decimal, o por «,» con punto decimal. También vale una exportación con columnas Date y Close / Adj Close. Fechas dd/mm/aaaa o aaaa-mm-dd. El archivo se lee en tu navegador y no se envía a ningún sitio.'),
    h('div', { class: 'filtros-noticias' },
      h('div', { class: 'campo' }, h('label', { for: 'csv-tipo' }, 'Tipo de serie'), tipo),
      h('div', { class: 'campo' }, h('label', { for: 'csv-archivo' }, 'Archivo'), archivo)),
    mensaje);
}
