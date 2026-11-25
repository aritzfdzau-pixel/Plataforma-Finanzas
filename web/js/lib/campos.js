// Convierte los textos de un formulario en los valores que espera `calcular`. Puro (sin DOM).
import { leerNumero, leerSerie } from './formato.js';

export const TIPOS_CAMPO = ['numero', 'entero', 'porcentaje', 'seleccion', 'serie', 'casilla'];

/**
 * Un campo con `visibleSi: { campo, valor }` solo se muestra (y se lee) cuando el campo
 * `campo` tiene el texto `valor`; si no, su valor es null.
 */
export function campoVisible(c, textos = {}, campos = []) {
  if (!c.visibleSi) return true;
  const ref = campos.find((x) => x.id === c.visibleSi.campo);
  const texto = textos[c.visibleSi.campo] ?? ref?.defecto ?? '';
  return texto === c.visibleSi.valor;
}

/**
 * @param {Array} campos  Definición de campos de la operación.
 * @param {object} textos  { idCampo: texto } (si falta, se usa el valor por defecto).
 * @returns {{ valores: object, errores: object }}
 */
export function leerCampos(campos, textos = {}) {
  const valores = {};
  const errores = {};
  for (const c of campos) {
    const texto = textos[c.id] ?? c.defecto ?? '';
    if (!campoVisible(c, textos, campos)) { valores[c.id] = null; continue; }
    try {
      valores[c.id] = leerCampo(c, texto);
    } catch (e) {
      errores[c.id] = e.message;
    }
  }
  return { valores, errores };
}

export function leerCampo(c, texto) {
  if (c.tipo === 'casilla') return texto === 'si';
  if (c.tipo !== 'seleccion' && c.tipo !== 'serie' && String(texto ?? '').trim() === '') {
    if (c.opcional) return null; // campo opcional vacío
    throw new Error('Obligatorio: introduce un valor');
  }
  switch (c.tipo) {
    case 'numero': {
      const n = leerNumero(texto);
      if (Number.isNaN(n)) throw new Error('Número no válido');
      return n;
    }
    case 'entero': {
      const n = leerNumero(texto);
      if (!Number.isInteger(n)) throw new Error('Debe ser un número entero');
      return n;
    }
    case 'porcentaje': {
      const n = leerNumero(texto);
      if (Number.isNaN(n)) throw new Error('Porcentaje no válido');
      return n / 100;
    }
    case 'seleccion': {
      if (!c.opciones.some((o) => o.valor === texto)) throw new Error('Opción no válida');
      return texto;
    }
    case 'serie':
      return leerSerie(texto);
    default:
      throw new Error(`Tipo de campo desconocido: ${c.tipo}`);
  }
}
