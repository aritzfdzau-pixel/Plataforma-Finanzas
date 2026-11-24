// Punto de entrada de la interfaz (módulo ES, sin dependencias).
import { leerRuta } from './ui/rutas.js';
import { pintarListado, pintarOperacion } from './ui/operativa.js';
import { pintarFichas, pintarFicha } from './ui/conocimiento.js';
import { iniciarPaleta } from './ui/paleta.js';
import { pintarCabeceraDivisas, pintarPanelDivisas } from './ui/divisas.js';
import { pintarCabeceraNoticias, pintarPanelNoticias } from './ui/noticias.js';
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
const botonExpandir = document.getElementById('expandir-operativa');

function expandir(si) {
  zonaOp.classList.toggle('zona--expandida', si);
  botonExpandir.setAttribute('aria-pressed', String(si));
  botonExpandir.textContent = si ? 'Cerrar pantalla grande' : 'Pantalla grande';
  document.body.classList.toggle('sin-scroll', si);
}
botonExpandir.addEventListener('click', () => expandir(!zonaOp.classList.contains('zona--expandida')));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && zonaOp.classList.contains('zona--expandida') && !document.getElementById('paleta').open && !panelDivisas.open && !panelNoticias.open) expandir(false);
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

// ---- Noticias ----
const panelNoticias = document.getElementById('panel-noticias');
let noticiasPintadas = false;
document.getElementById('abrir-noticias').addEventListener('click', () => {
  if (!noticiasPintadas) { noticiasPintadas = true; pintarPanelNoticias(panelNoticias); }
  panelNoticias.showModal();
});
document.getElementById('cerrar-noticias').addEventListener('click', () => panelNoticias.close());
pintarCabeceraNoticias(document.getElementById('cuerpo-noticias'));

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
  pintarFichas(listaFichas, indice.fichas);
  filtroOps.addEventListener('input', () => pintarListado(listaOps, operaciones, filtroOps.value));
  iniciarPaleta({ ...indice, operaciones });

  const enrutar = async () => {
    const ruta = leerRuta();
    listaOps.querySelectorAll('.lista__item').forEach((a) => a.classList.toggle('is-activo', ruta.tipo === 'op' && a.dataset.id === ruta.id));
    if (ruta.tipo === 'op') {
      detalleOp.hidden = false;
      await pintarOperacion(detalleOp, ruta.id, ruta.params);
      zonaOp.scrollIntoView({ block: 'start', behavior: 'smooth' });
      detalleOp.querySelector('.op__titulo')?.focus?.();
    } else if (ruta.tipo === 'ficha') {
      listaFichas.hidden = true; visorFicha.hidden = false;
      await pintarFicha(visorFicha, ruta.ruta, indice.fichas);
      expandir(false);
      visorFicha.closest('.zona').scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      listaFichas.hidden = false; visorFicha.hidden = true;
    }
  };
  window.addEventListener('hashchange', enrutar);
  enrutar();
}
iniciar();
