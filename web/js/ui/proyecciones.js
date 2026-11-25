// Zona «Proyecciones y escenarios» (fase 5). Nunca «predicciones» (AGENTS.md §12, plan).
// - Escenarios: operaciones escenario-tipo-cambio y escenario-euribor (formulario genérico).
// - Montecarlo: bandas 5 %–95 % y 25 %–75 % con la mediana; nunca una sola línea.
// - Validación: proyección frente al paseo aleatorio con datos pasados, mostrando el error.
// Los cálculos están en operativa/lib/finanzas.js (P-015 a P-017) y web/js/lib/series.js.
import { h, vaciar } from './dom.js';
import { formatear, numero } from '../lib/formato.js';
import { fechaEs, aTextoCampo } from '../lib/divisas.js';
import { periodosPorAnio, NOMBRE_PERIODICIDAD, fechasFuturas, horizontes, parametrosPaseo } from '../lib/series.js';
import { simularMontecarlo, validarFrenteAPaseoAleatorio } from '../../../operativa/lib/finanzas.js';
import { pintarOperacion } from './operativa.js';
import { seriesDisponibles } from './historicos.js';
import { graficaLineas } from './grafica.js';

const TRAYECTORIAS = 2000;
const SEMILLA = 20261124; // fija: el mismo resultado cada vez (reproducible)
const VENTANA = 250;
const PESTANAS = [['escenarios', 'Escenarios'], ['montecarlo', 'Montecarlo'], ['validacion', 'Validación']];

const estado = { pestana: 'escenarios', escenario: 'escenario-tipo-cambio', id: null, horizonte: null, tendencia: false };
let raiz = null;

export function pintarProyecciones(contenedor) {
  raiz = contenedor;
  // Al llegar las series (o subir un CSV) se repinta; en el escenario de tipo de cambio no hace falta.
  document.addEventListener('historicos:series', () => { if (estado.pestana !== 'escenarios' || estado.escenario === 'escenario-euribor') pintar(); });
  pintar();
}

/** Abre Montecarlo con la serie `id` de Históricos (botón «Proyectar» de otras zonas). */
export function proyectarSerie(id) {
  estado.pestana = 'montecarlo'; estado.id = id; estado.horizonte = null;
  pintar();
  raiz?.closest('.zona')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function pintar() {
  vaciar(raiz);
  const lista = h('div', { class: 'pestanas', role: 'tablist', 'aria-label': 'Proyecciones y escenarios' },
    PESTANAS.map(([id, t]) => h('button', {
      type: 'button', role: 'tab', id: `tab-proy-${id}`, class: 'pestana', 'aria-selected': String(id === estado.pestana),
      'aria-controls': 'panel-proyecciones', tabindex: id === estado.pestana ? '0' : '-1',
      onclick: () => { estado.pestana = id; pintar(); raiz.querySelector(`#tab-proy-${id}`)?.focus(); },
      onkeydown: (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const k = PESTANAS.findIndex(([x]) => x === estado.pestana);
        estado.pestana = PESTANAS[(k + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length][0];
        pintar(); raiz.querySelector(`#tab-proy-${estado.pestana}`)?.focus();
      },
    }, t)));
  const panel = h('div', { role: 'tabpanel', id: 'panel-proyecciones', 'aria-labelledby': `tab-proy-${estado.pestana}`, class: 'proyecciones__panel' });
  raiz.append(
    h('p', { class: 'aviso' }, 'Proyecciones y escenarios, no predicciones: muestran rangos de lo que podría pasar si el futuro se parece al pasado, o el efecto de un movimiento supuesto.'),
    lista, panel);
  if (estado.pestana === 'escenarios') escenarios(panel);
  else conSerie(panel, estado.pestana === 'montecarlo' ? montecarlo : validacion);
}

// --- Escenarios -------------------------------------------------------------
function escenarios(panel) {
  const formulario = h('div', { class: 'proyecciones__operacion' });
  panel.append(h('div', { class: 'filtros-noticias' }, h('div', { class: 'campo' },
    h('label', { for: 'proy-escenario' }, 'Escenario'),
    h('select', { id: 'proy-escenario', onchange: (e) => { estado.escenario = e.target.value; pintar(); } },
      h('option', { value: 'escenario-tipo-cambio', selected: estado.escenario === 'escenario-tipo-cambio' }, 'Tipo de cambio (p. ej. EUR/USD −5 %)'),
      h('option', { value: 'escenario-euribor', selected: estado.escenario === 'escenario-euribor' }, 'Euribor en una hipoteca (p. ej. +100 pb)')))),
  formulario);
  // El Euribor de partida sale de Históricos si está disponible (media mensual del Banco de España).
  const params = {};
  const eur = seriesDisponibles().find((s) => s.id === 'euribor-12m');
  if (estado.escenario === 'escenario-euribor' && eur?.puntos?.length) params.euribor = aTextoCampo(eur.puntos.at(-1)[1]);
  pintarOperacion(formulario, estado.escenario, params, { prefijo: 'proy' }).then(() => {
    if (params.euribor) {
      formulario.querySelector('#proy-euribor')?.closest('.campo')?.append(
        h('small', { class: 'campo__ayuda campo__ayuda--dato' }, `Media mensual del ${fechaEs(eur.puntos.at(-1)[0])} (referencia Banco de España, desde Históricos).`));
    }
  });
}

// --- Selector de serie común a Montecarlo y Validación ----------------------
function conSerie(panel, pintarContenido) {
  const series = seriesDisponibles().filter((s) => s.puntos?.length >= 30);
  if (!series.length) {
    panel.append(h('p', { class: 'vacio' }, 'Hace falta una serie con al menos 30 observaciones: espera a que se publiquen las series oficiales o sube un CSV en Históricos.'));
    return;
  }
  if (!series.some((s) => s.id === estado.id)) estado.id = series.find((s) => s.id === 'eurusd')?.id ?? series[0].id;
  const serie = series.find((s) => s.id === estado.id);
  const m = periodosPorAnio(serie.puntos.map((p) => p[0]));
  const opcionesH = horizontes(m);
  if (!opcionesH.some(([v]) => v === estado.horizonte)) estado.horizonte = opcionesH[1][0];
  const sel = (id, etiqueta, opciones, valor, alCambiar) => h('div', { class: 'campo' }, h('label', { for: id }, etiqueta),
    h('select', { id, onchange: (e) => { alCambiar(e.target.value); pintar(); } },
      opciones.map(([v, t]) => h('option', { value: String(v), selected: String(v) === String(valor) }, t))));
  panel.append(h('div', { class: 'filtros-noticias' },
    sel('proy-serie', 'Serie (de Históricos)', series.map((s) => [s.id, s.nombre]), estado.id, (v) => { estado.id = v; }),
    sel('proy-horizonte', 'Horizonte', opcionesH, estado.horizonte, (v) => { estado.horizonte = Number(v); }),
    h('div', { class: 'campo campo--check' }, h('label', {},
      h('input', { type: 'checkbox', checked: estado.tendencia, onchange: (e) => { estado.tendencia = e.target.checked; pintar(); } }),
      ' Usar la tendencia histórica (μ)'))));
  const contenido = h('div', { class: 'proyecciones__contenido' });
  panel.append(contenido);
  try {
    pintarContenido(contenido, serie, m);
  } catch (e) {
    contenido.append(h('p', { class: 'error' }, e.message));
  }
}

const unidadDe = (serie) => (serie.tipo === 'tipo' ? '%' : '');
const dec = (serie) => (serie.tipo === 'tipo' ? 3 : serie.unidad?.startsWith('JPY') ? 2 : 4);

// --- Montecarlo -------------------------------------------------------------
function montecarlo(cont, serie, m) {
  const valores = serie.puntos.map((p) => p[1]);
  const par = parametrosPaseo(valores, serie.tipo, VENTANA);
  const mu = estado.tendencia ? par.media : 0;
  const H = estado.horizonte;
  const r = simularMontecarlo({ inicial: valores.at(-1), media: mu, desviacion: par.desviacion, horizonte: H, trayectorias: TRAYECTORIAS, modelo: par.modelo, semilla: SEMILLA });

  // Historia reciente (2 × horizonte) + proyección.
  const historia = serie.puntos.slice(-Math.max(2 * H, 30));
  const futuras = fechasFuturas(serie.puntos.at(-1)[0], H, m);
  const fechas = [...historia.map((p) => p[0]), ...futuras];
  const nHist = historia.length;
  const relleno = (arr) => [...Array(nHist - 1).fill(null), ...arr]; // arr empieza en el último dato
  const unidad = unidadDe(serie);
  cont.append(
    h('p', { class: 'historicos__cabecera' }, h('span', { class: 'chip' }, 'escenarios simulados'),
      ` ${serie.nombre} · ${TRAYECTORIAS.toLocaleString('es-ES')} trayectorias · horizonte ${H} periodos (${NOMBRE_PERIODICIDAD[m]}) · μ = ${estado.tendencia ? formatoVar(serie, mu) : '0 (sin tendencia)'}, σ = ${formatoVar(serie, par.desviacion)} por periodo (últimas ${par.n} variaciones)`),
    graficaLineas({
      fechas, unidad, ancho: cont.clientWidth || 900,
      titulo: `Proyección Montecarlo de ${serie.nombre}: bandas 5–95 % y 25–75 % y mediana`,
      series: [
        { nombre: 'Histórico', valores: [...historia.map((p) => p[1]), ...Array(H).fill(null)] },
        { nombre: 'Mediana', valores: relleno(r.percentiles[50]) },
      ],
      bandas: [
        { nombre: 'Banda 5–95 %', inferior: relleno(r.percentiles[5]), superior: relleno(r.percentiles[95]), n: 2, clase: 'banda--ancha' },
        { nombre: 'Banda 25–75 %', inferior: relleno(r.percentiles[25]), superior: relleno(r.percentiles[75]), n: 2, clase: 'banda--estrecha' },
      ],
    }),
    tablaFinal(serie, r, futuras.at(-1)),
    h('ul', { class: 'avisos' },
      h('li', {}, `Modelo: paseo aleatorio ${par.modelo === 'log' ? 'sobre el logaritmo (rentabilidades log normales)' : 'sobre el nivel (variaciones en pb normales)'}; volatilidad constante.`),
      h('li', {}, 'Supone normalidad: en crisis los movimientos extremos son más frecuentes de lo que muestran las bandas.'),
      h('li', {}, 'Semilla fija: el resultado es reproducible. Revisa la pestaña Validación antes de fiarte de la tendencia.')));
}

function formatoVar(serie, x) {
  return serie.tipo === 'tipo' ? `${numero(x * 100, 2)} pb` : formatear(x, 'pct:3');
}

function tablaFinal(serie, r, fecha) {
  const filas = [[5, 'Percentil 5 %'], [25, 'Percentil 25 %'], [50, 'Mediana (50 %)'], [75, 'Percentil 75 %'], [95, 'Percentil 95 %']];
  const actual = r.percentiles[50][0];
  return h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-proy' },
    h('caption', {}, `Distribución al final del horizonte (${fechaEs(fecha)})`),
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Percentil'), h('th', { scope: 'col' }, 'Valor'), h('th', { scope: 'col' }, serie.tipo === 'tipo' ? 'Cambio (pb)' : 'Cambio (%)'))),
    h('tbody', {}, filas.map(([p, et]) => {
      const v = r.percentiles[p].at(-1);
      return h('tr', {}, h('th', { scope: 'row' }, et), h('td', { class: 'num' }, `${numero(v, dec(serie))}${serie.tipo === 'tipo' ? ' %' : ''}`),
        h('td', { class: 'num' }, serie.tipo === 'tipo' ? numero((v - actual) * 100, 1) : formatear(v / actual - 1, 'pct:2')));
    }))));
}

// --- Validación frente al paseo aleatorio ----------------------------------
function validacion(cont, serie) {
  const valores = serie.puntos.map((p) => p[1]);
  const H = estado.horizonte;
  const ventana = Math.min(VENTANA, Math.max(20, Math.floor(valores.length / 3)));
  const v = validarFrenteAPaseoAleatorio(valores, { horizonte: H, ventana, modelo: serie.tipo === 'tipo' ? 'aditivo' : 'log', conTendencia: estado.tendencia });
  const fechasReales = v.indices.map((i) => serie.puntos[i + H][0]);
  const d = dec(serie);
  const u = v.theilU;
  const conclusion = !estado.tendencia
    ? 'Sin tendencia, la mediana del modelo coincide con el paseo aleatorio (U = 1): aquí se valida sobre todo la banda.'
    : u < 0.98 ? `La tendencia mejora al paseo aleatorio en este periodo (U = ${numero(u, 3)} < 1).`
      : u > 1.02 ? `La tendencia empeora frente al paseo aleatorio (U = ${numero(u, 3)} > 1): es mejor no usarla.`
        : `La tendencia no aporta frente al paseo aleatorio (U ≈ 1).`;
  const fila = (et, a, b) => h('tr', {}, h('th', { scope: 'row' }, et), h('td', { class: 'num' }, a), h('td', { class: 'num' }, b));
  cont.append(
    h('p', { class: 'historicos__cabecera' }, h('span', { class: 'chip' }, 'validación con datos pasados'),
      ` ${serie.nombre} · ${v.origenes} proyecciones a ${H} periodos, cada ${H} periodos, con μ y σ de las ${ventana} variaciones anteriores a cada origen.`),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-num tabla-proy' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Error'), h('th', { scope: 'col' }, estado.tendencia ? 'Modelo (con tendencia)' : 'Modelo (sin tendencia)'), h('th', { scope: 'col' }, 'Paseo aleatorio'))),
      h('tbody', {},
        fila('Error medio absoluto (MAE)', numero(v.maeModelo, d), numero(v.maePaseo, d)),
        fila('Raíz del error cuadrático medio (RMSE)', numero(v.rmseModelo, d), numero(v.rmsePaseo, d)),
        fila('U de Theil (RMSE modelo / paseo aleatorio)', u === null ? '—' : numero(u, 3), '1'),
        fila('Cobertura de la banda 5–95 % (ideal ≈ 90 %)', formatear(v.cobertura, 'pct:1'), '—')))),
    h('p', { class: 'historicos__correlacion' }, h('strong', {}, conclusion),
      v.cobertura < 0.85 ? ' La banda se queda corta: hubo más movimientos extremos de los que supone el modelo.' : ''),
    graficaLineas({
      fechas: fechasReales, unidad: unidadDe(serie), ancho: cont.clientWidth || 900,
      titulo: `Valores reales frente a proyecciones a ${H} periodos`,
      series: [
        { nombre: 'Real', valores: v.reales },
        { nombre: 'Modelo', valores: v.proyModelo },
        { nombre: 'Paseo aleat.', valores: v.proyPaseo },
      ],
    }),
    h('p', { class: 'campo__ayuda' }, 'Cada punto es el valor real en la fecha indicada y lo que habría proyectado cada método con los datos disponibles h periodos antes. El error es la distancia entre las líneas.'));
}
