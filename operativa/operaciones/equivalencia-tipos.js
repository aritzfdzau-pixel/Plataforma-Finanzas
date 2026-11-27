import { cambioBase, descuentoAInteres, interesADescuento, tinATae, taeATin } from '../lib/finanzas.js';
import { entero, exigir, PERIODICIDADES, NOMBRE_PERIODICIDAD } from './_comun.js';

const NOMBRE_BASE = { 'ACT/360': 'Act/360', 'ACT/365': 'Act/365' };

export default {
  id: 'equivalencia-tipos',
  titulo: 'Equivalencia de tipos (bases, descuento, nominal y efectivo)',
  tituloIngles: 'Rate equivalence (day count, discount, nominal and effective)',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/equivalencia-de-tipos.md',
  resumen: 'Pasa un tipo de Act/360 a Act/365, de descuento a interés (y al revés) y de nominal a efectivo.',
  campos: [
    { id: 'conversion', etiqueta: 'Conversión', tipo: 'seleccion', defecto: 'base',
      opciones: [
        { valor: 'base', etiqueta: 'Cambio de base (Act/360 ↔ Act/365)' },
        { valor: 'descuento', etiqueta: 'Tipo de descuento → tipo de interés' },
        { valor: 'interes', etiqueta: 'Tipo de interés → tipo de descuento' },
        { valor: 'efectivo', etiqueta: 'Nominal ↔ efectivo (TIN ↔ TAE)' },
      ] },
    { id: 'tipo', etiqueta: 'Tipo de partida', unidad: '% anual', tipo: 'porcentaje', defecto: '3,00' },
    { id: 'baseOrigen', etiqueta: 'Base del tipo de partida', tipo: 'seleccion', defecto: 'ACT/360', visibleSi: { campo: 'conversion', valor: 'base' },
      opciones: [{ valor: 'ACT/360', etiqueta: 'Act/360 → Act/365' }, { valor: 'ACT/365', etiqueta: 'Act/365 → Act/360' }] },
    { id: 'diasDescuento', etiqueta: 'Plazo', unidad: 'días', tipo: 'entero', defecto: '90', visibleSi: { campo: 'conversion', valor: 'descuento' } },
    { id: 'diasInteres', etiqueta: 'Plazo', unidad: 'días', tipo: 'entero', defecto: '90', visibleSi: { campo: 'conversion', valor: 'interes' } },
    { id: 'sentido', etiqueta: 'Sentido', tipo: 'seleccion', defecto: 'TIN->TAE', visibleSi: { campo: 'conversion', valor: 'efectivo' },
      opciones: [{ valor: 'TIN->TAE', etiqueta: 'De nominal (TIN) a efectivo (TAE)' }, { valor: 'TAE->TIN', etiqueta: 'De efectivo (TAE) a nominal (TIN)' }] },
    { id: 'periodicidad', etiqueta: 'Liquidaciones al año', tipo: 'seleccion', defecto: '12', opciones: PERIODICIDADES, visibleSi: { campo: 'conversion', valor: 'efectivo' } },
  ],
  calcular(v) {
    exigir(Number.isFinite(v.tipo) && v.tipo > -1, 'Tipo no válido');
    if (v.conversion === 'base') {
      const destino = v.baseOrigen === 'ACT/360' ? 'ACT/365' : 'ACT/360';
      const r = cambioBase(v.tipo, v.baseOrigen, destino);
      return {
        resultados: [
          { id: 'equivalente', etiqueta: `Tipo equivalente en ${NOMBRE_BASE[destino]}`, valor: r, formato: 'pct:4', destacado: true },
          { id: 'diferencia', etiqueta: 'Diferencia', valor: r - v.tipo, formato: 'pp:4' },
        ],
        convenciones: {
          base: `${NOMBRE_BASE[v.baseOrigen]} → ${NOMBRE_BASE[destino]}`, periodicidad: 'Interés simple, cualquier plazo',
          nominalEfectivo: 'Tipos nominales (mismos intereses en los mismos días)', comisiones: 'No aplica',
        },
        avisos: ['Un 3 % en Act/360 paga más que un 3 % en Act/365: al comparar ofertas, ponlas en la misma base.'],
      };
    }
    if (v.conversion === 'descuento' || v.conversion === 'interes') {
      const dias = entero(v.conversion === 'descuento' ? v.diasDescuento : v.diasInteres, 'Plazo');
      const r = v.conversion === 'descuento' ? descuentoAInteres(v.tipo, dias) : interesADescuento(v.tipo, dias);
      return {
        resultados: [
          { id: 'equivalente', etiqueta: v.conversion === 'descuento' ? 'Tipo de interés equivalente (vencido)' : 'Tipo de descuento equivalente (anticipado)', valor: r, formato: 'pct:4', destacado: true },
          { id: 'diferencia', etiqueta: 'Diferencia', valor: r - v.tipo, formato: 'pp:4' },
          { id: 'efectivo100', etiqueta: 'Efectivo de un nominal de 100 descontado', valor: 100 * (1 - (v.conversion === 'descuento' ? v.tipo : r) * dias / 360), formato: 'num:4' },
        ],
        convenciones: {
          base: 'Act/360 (mercado monetario)', periodicidad: `Un solo periodo de ${dias} días`,
          nominalEfectivo: 'Descuento sobre el nominal (anticipado) ↔ interés sobre el efectivo (vencido)', comisiones: 'No incluidas',
        },
        avisos: ['El descuento comercial y las Letras del Tesoro se expresan de forma distinta: compara siempre el tipo de interés equivalente.'],
      };
    }
    const m = Number(v.periodicidad);
    const tae = v.sentido === 'TAE->TIN';
    const r = tae ? taeATin(v.tipo, m) : tinATae(v.tipo, m);
    return {
      resultados: [{ id: 'equivalente', etiqueta: tae ? `TIN (${NOMBRE_PERIODICIDAD[m]})` : 'TAE (tipo efectivo anual)', valor: r, formato: 'pct:4', destacado: true },
        { id: 'diferencia', etiqueta: 'Diferencia', valor: r - v.tipo, formato: 'pp:4' }],
      convenciones: {
        base: 'Periodos iguales de 1/m de año', periodicidad: `${m} liquidaciones al año`,
        nominalEfectivo: tae ? 'Efectivo → nominal' : 'Nominal → efectivo', comisiones: 'Sin comisiones (con comisiones: Conversor TIN ↔ TAE)',
      },
      avisos: [],
    };
  },
};
