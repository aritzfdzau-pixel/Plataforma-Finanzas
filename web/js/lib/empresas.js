// Buscador de empresas en fuentes externas (D-043). Puro: sin DOM ni red.
// La web NO descarga ni guarda datos de estas fuentes: solo prepara enlaces que el usuario abre
// en una pestaña nueva. Lo que se escribe solo sale del navegador si el usuario pulsa un enlace.
//
// No se han encontrado documentados los parámetros de búsqueda por URL de estas webs: por eso,
// salvo que se indique, el botón abre el buscador de la fuente y copia el término para pegarlo.
// ⚠️ Pendiente de verificar en el navegador cada dirección (desde el entorno de desarrollo no se
// llega a estas webs).

export const FUENTES_EMPRESAS = Object.freeze([
  {
    id: 'einforma', nombre: 'eInforma', tipo: 'Informes comerciales (Informa D&B)', acceso: 'Ficha básica gratuita; informes de pago',
    buscador: 'https://www.einforma.com/buscador-empresas',
    // Ficha por NIF: formato visto en enlaces públicos de fichas. ⚠️ Pendiente de verificar.
    porNif: (nif) => `https://www.einforma.com/servlet/app/portal/ENTP/prod/ETIQUETA_EMPRESA/nif/${encodeURIComponent(nif)}`,
    descripcion: 'Datos registrales, cuentas anuales resumidas, administradores y vínculos.',
  },
  {
    id: 'axesor', nombre: 'Axesor', tipo: 'Informes comerciales y de riesgo', acceso: 'Datos básicos gratuitos; informes de pago',
    buscador: 'https://www.axesor.es/buscador-empresas.aspx',
    descripcion: 'Búsqueda por NIF o denominación; ventas, capital, incidencias de pago y scoring.',
  },
  {
    id: 'borme', nombre: 'BORME (BOE)', tipo: 'Fuente oficial', acceso: 'Gratuito',
    buscador: 'https://www.boe.es/buscar/borme.php',
    descripcion: 'Boletín Oficial del Registro Mercantil: constitución, nombramientos y ceses, ampliaciones de capital, fusiones. Pega el nombre en el campo «Título».',
  },
  {
    id: 'cnmv', nombre: 'CNMV', tipo: 'Fuente oficial', acceso: 'Gratuito',
    buscador: 'https://www.cnmv.es/portal/Consultas/BusquedaPorEntidad',
    descripcion: 'Solo empresas cotizadas o supervisadas: cuentas, información financiera periódica y hechos relevantes.',
  },
  {
    id: 'registradores', nombre: 'Registradores (Registro Mercantil)', tipo: 'Fuente oficial', acceso: 'De pago (nota simple, cuentas depositadas)',
    buscador: 'https://www.registradores.org/',
    descripcion: 'Nota simple mercantil y cuentas anuales depositadas en el Registro Mercantil.',
  },
]);

const LETRAS_CONTROL = 'JABCDEFGHI';

/** Normaliza un NIF/CIF: mayúsculas, sin espacios, guiones ni puntos. */
export const normalizarNif = (t) => String(t ?? '').toUpperCase().replace(/[\s.\-]/g, '');

/**
 * ¿Es un CIF de persona jurídica con dígito de control correcto? (letra + 7 dígitos + control).
 * Algoritmo público del NIF de entidades: suma de posiciones pares + suma de dígitos del doble de
 * las impares; control = (10 − suma mod 10) mod 10, como número o como letra (JABCDEFGHI).
 */
export function esCifValido(texto) {
  const c = normalizarNif(texto);
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(c);
  if (!m) return false;
  const d = m[2].split('').map(Number);
  let suma = 0;
  d.forEach((x, k) => {
    if (k % 2 === 1) suma += x; // posiciones pares (2.ª, 4.ª, 6.ª)
    else { const y = x * 2; suma += Math.floor(y / 10) + (y % 10); } // impares: dígitos del doble
  });
  const control = (10 - (suma % 10)) % 10;
  const esperado = m[3];
  if ('KPQRSNW'.includes(m[1])) return esperado === LETRAS_CONTROL[control]; // control con letra
  if ('ABEH'.includes(m[1])) return esperado === String(control); // control con número
  return esperado === String(control) || esperado === LETRAS_CONTROL[control];
}

/**
 * Enlaces para un término de búsqueda (nombre o NIF). Cada uno: { id, nombre, url, modo, ... }.
 * modo 'directo': la URL ya lleva el término; 'copiar': abre el buscador y hay que pegar el término.
 */
export function enlacesEmpresa(termino) {
  const t = String(termino ?? '').trim().replace(/\s+/g, ' ');
  if (t.length < 2) return [];
  const nif = esCifValido(t) ? normalizarNif(t) : null;
  return FUENTES_EMPRESAS.flatMap((f) => {
    const base = { id: f.id, nombre: f.nombre, tipo: f.tipo, acceso: f.acceso, descripcion: f.descripcion, termino: nif ?? t };
    const lista = [{ ...base, url: f.buscador, modo: 'copiar' }];
    if (nif && f.porNif) lista.unshift({ ...base, id: `${f.id}-nif`, url: f.porNif(nif), modo: 'directo', nota: 'Ficha por NIF (⚠️ pendiente de verificar)' });
    return lista;
  });
}
