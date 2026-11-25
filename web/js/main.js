// Punto de entrada de la interfaz (módulo ES, sin dependencias).
import { leerRuta } from './ui/rutas.js';
import { pintarListado, pintarOperacion } from './ui/operativa.js';
import { pintarFichas, pintarFicha } from './ui/conocimiento.js';
import { pintarMapa } from './ui/mapa.js';
import { iniciarPaleta } from './ui/paleta.js';
import { pintarCabeceraDivisas, pintarPanelDivisas } from './ui/divisas.js';
import { pintarCabeceraNoticias, pintarPanelNoticias } from './ui/noticias.js';
import { pintarHistoricos } from './ui/historicos.js';
import { pintarProyecciones } from './ui/proyecciones.js';
import { pintarCabeceraMercados, pintarPanelMercados, cargarComposicion } from './ui/mercados.js';
import { elementosBusqueda, destinoDeRuta } from './lib/mercados.js';
import { h } from './ui/dom.js';

// ---- Tema ----
const raiz = document.documentElement;
const botonTema = document.getElementById('cambiar-tema');
function aplicarTema(tema) {
  raiz.setAttribute('data-theme', tema);
  const claro = tema === 'light';
  botonTema.textContent = claro ? 'Modo oscuro' : 'Modo claro';
  botonTema.setAttribute('aria-pressed', String(claro));
}
botonTema.addEventListener('click', () => {
  const nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  aplicarTema(nuevo);
  try { localStorage.setItem('tema', nuevo); } catch { /* sin almacenamiento */ }
});
aplicarTema(raiz.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

// ---- Zonas ----
const zonaOp = document.getElementById('zona-operativa');
const listaOps = document.getElementById('lista-operaciones');
const detalleOp = document.getElementById('detalle-operacion');
const filtroOps = document.getElementById('filtro-operaciones');
const listaFichas = document.getElementById('lista-fichas');
const visorFicha = document.getElementById('visor-ficha');
const mapaConocimiento = document.getElementById('mapa-conocimiento');
const botonLista = document.getElementById('ver-lista');
const botonMapa = document.getElementById('ver-mapa');
let vistaConocimiento = 'lista';
let indiceCargado = null;
let mapaPintado = false;
/** Muestra la lista o el mapa de fichas (si no se está viendo una ficha). */
function mostrarVista(vista) {
  vistaConocimiento = vista;
  botonLista.setAttribute('aria-pressed', String(vista === 'lista'));
  botonMapa.setAttribute('aria-pressed', String(vista === 'mapa'));
  listaFichas.hidden = vista !== 'lista';
  mapaConocimiento.hidden = vista !== 'mapa';
  visorFicha.hidden = true;
  if (vista === 'mapa' && !mapaPintado && indiceCargado) { mapaPintado = true; pintarMapa(mapaConocimiento, indiceCargado); }
}
botonLista.addEventListener('click', () => { if (location.hash.startsWith('#ficha=')) history.pushState(null, '', location.pathname); mostrarVista('lista'); });
botonMapa.addEventListener('click', () => { if (location.hash.startsWith('#ficha=')) history.pushState(null, '', location.pathname); mostrarVista('mapa'); });
const botonExpandir = document.getElementById('expandir-operativa');

/** Pantalla grande de una zona (Operativa o Históricos); solo una a la vez. */
function expandir(zona, boton, si) {
  document.querySelectorAll('.zona--expandida').forEach((z) => { if (z !== zona) z.classList.remove('zona--expandida'); });
  document.querySelectorAll('[id^="expandir-"]').forEach((b) => { if (b !== boton) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Pantalla grande'; } });
  zona.classList.toggle('zona--expandida', si);
  boton.setAttribute('aria-pressed', String(si));
  boton.textContent = si ? 'Cerrar pantalla grande' : 'Pantalla grande';
  document.body.classList.toggle('sin-scroll', si);
}
const zonaHist = document.getElementById('zona-historicos');
const botonHist = document.getElementById('expandir-historicos');
botonExpandir.addEventListener('click', () => expandir(zonaOp, botonExpandir, !zonaOp.classList.contains('zona--expandida')));
botonHist.addEventListener('click', () => expandir(zonaHist, botonHist, !zonaHist.classList.contains('zona--expandida')));
const zonaProy = document.getElementById('zona-proyecciones');
const botonProy = document.getElementById('expandir-proyecciones');
botonProy.addEventListener('click', () => expandir(zonaProy, botonProy, !zonaProy.classList.contains('zona--expandida')));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || document.getElementById('paleta').open || panelDivisas.open || panelNoticias.open || panelMercados.open) return;
  if (zonaOp.classList.contains('zona--expandida')) expandir(zonaOp, botonExpandir, false);
  if (zonaHist.classList.contains('zona--expandida')) expandir(zonaHist, botonHist, false);
  if (zonaProy.classList.contains('zona--expandida')) expandir(zonaProy, botonProy, false);
});

// ---- Divisas ----
const panelDivisas = document.getElementById('panel-divisas');
let panelPintado = false;
const cerrarDivisas = () => { if (panelDivisas.open) panelDivisas.close(); };
function abrirDivisas() {
  if (!panelPintado) { panelPintado = true; pintarPanelDivisas(panelDivisas, cerrarDivisas); }
  panelDivisas.showModal();
}
document.getElementById('abrir-divisas').addEventListener('click', abrirDivisas);
document.getElementById('cerrar-divisas').addEventListener('click', cerrarDivisas);
pintarCabeceraDivisas(document.getElementById('cuerpo-divisas'), abrirDivisas);

// ---- Renta variable y renta fija ----
const panelMercados = document.getElementById('panel-mercados');
let controlMercados = null;
const cerrarMercados = () => { if (panelMercados.open) panelMercados.close(); };
function abrirMercados(destino = {}) {
  controlMercados ??= pintarPanelMercados(panelMercados, cerrarMercados);
  controlMercados.ir(destino);
  if (!panelMercados.open) panelMercados.showModal();
}
document.getElementById('abrir-mercados').addEventListener('click', () => abrirMercados({}));
document.getElementById('cerrar-mercados').addEventListener('click', cerrarMercados);
pintarCabeceraMercados(document.getElementById('cuerpo-mercados'), abrirMercados);

// ---- Noticias ----
const panelNoticias = document.getElementById('panel-noticias');
let noticiasPintadas = false;
document.getElementById('abrir-noticias').addEventListener('click', () => {
  if (!noticiasPintadas) { noticiasPintadas = true; pintarPanelNoticias(panelNoticias); }
  panelNoticias.showModal();
});
document.getElementById('cerrar-noticias').addEventListener('click', () => panelNoticias.close());
pintarCabeceraNoticias(document.getElementById('cuerpo-noticias'));
pintarHistoricos(document.getElementById('cuerpo-historicos'));
pintarProyecciones(document.getElementById('cuerpo-proyecciones'));

async function iniciar() {
  let indice;
  try {
    const r = await fetch('../conocimiento/indice.json');
    if (!r.ok) throw new Error(r.statusText);
    indice = await r.json();
  } catch {
    listaOps.replaceChildren(h('p', { class: 'error' }, 'No se ha podido cargar el índice de operaciones.'));
    return;
  }
  const operaciones = indice.operaciones.filter((o) => o.titulo);
  pintarListado(listaOps, operaciones);
  indiceCargado = indice;
  pintarFichas(listaFichas, indice.fichas);
  filtroOps.addEventListener('input', () => pintarListado(listaOps, operaciones, filtroOps.value));
  iniciarPaleta({ ...indice, operaciones }, cargarComposicion().then(elementosBusqueda));

  const enrutar = async () => {
    const ruta = leerRuta();
    listaOps.querySelectorAll('.lista__item').forEach((a) => a.classList.toggle('is-activo', ruta.tipo === 'op' && a.dataset.id === ruta.id));
    if (ruta.tipo === 'op') {
      detalleOp.hidden = false;
      await pintarOperacion(detalleOp, ruta.id, ruta.params);
      zonaOp.scrollIntoView({ block: 'start', behavior: 'smooth' });
      detalleOp.querySelector('.op__titulo')?.focus?.();
    } else if (ruta.tipo === 'rv' || ruta.tipo === 'rf') {
      abrirMercados(destinoDeRuta(ruta));
    } else if (ruta.tipo === 'ficha') {
      listaFichas.hidden = true; mapaConocimiento.hidden = true; visorFicha.hidden = false;
      await pintarFicha(visorFicha, ruta.ruta, indice.fichas);
      expandir(zonaOp, botonExpandir, false);
      visorFicha.closest('.zona').scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      mostrarVista(vistaConocimiento);
    }
  };
  window.addEventListener('hashchange', enrutar);
  enrutar();
}
iniciar();
