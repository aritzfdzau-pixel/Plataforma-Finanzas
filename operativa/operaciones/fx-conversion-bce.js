import { convertirConReferencia } from '../lib/finanzas.js';
import { positivo } from './_comun.js';

export const DIVISAS_BCE = [
  ['USD', 2], ['GBP', 2], ['JPY', 0], ['CHF', 2], ['CNY', 2], ['AUD', 2], ['CAD', 2], ['HKD', 2], ['NZD', 2],
];

export default {
  id: 'fx-conversion-bce',
  titulo: 'Conversión con el tipo de referencia del BCE',
  tituloIngles: 'ECB reference rate',
  categoria: 'fx',
  ficha: 'conocimiento/fx/tipos-de-referencia-bce.md',
  resumen: 'Convierte importes con el tipo de referencia del euro publicado por el BCE.',
  campos: [
    { id: 'divisa', etiqueta: 'Divisa', tipo: 'seleccion', defecto: 'USD',
      opciones: DIVISAS_BCE.map(([c]) => ({ valor: c, etiqueta: c })) },
    { id: 'sentido', etiqueta: 'Sentido', tipo: 'seleccion', defecto: 'EUR->DIV',
      opciones: [{ valor: 'EUR->DIV', etiqueta: 'De EUR a la divisa' }, { valor: 'DIV->EUR', etiqueta: 'De la divisa a EUR' }] },
    { id: 'importe', etiqueta: 'Importe', tipo: 'numero', defecto: '10.000' },
    { id: 'tipo', etiqueta: 'Tipo de referencia BCE (divisa por 1 EUR)', tipo: 'numero', defecto: '1,0850',
      rellenarCon: { fuente: 'bce', divisa: 'divisa' } },
  ],
  calcular(v) {
    const importe = positivo(v.importe, 'Importe');
    const tipo = positivo(v.tipo, 'Tipo de referencia');
    const dec = Object.fromEntries(DIVISAS_BCE)[v.divisa] ?? 2;
    const aDivisa = v.sentido === 'EUR->DIV';
    const resultado = convertirConReferencia(importe, tipo, v.sentido, aDivisa ? dec : 2);
    return {
      resultados: [
        { id: 'resultado', etiqueta: aDivisa ? `Importe en ${v.divisa}` : 'Importe en EUR', valor: resultado,
          formato: aDivisa ? `divisa:${v.divisa}:${dec}` : 'eur', destacado: true },
        { id: 'inverso', etiqueta: `Tipo inverso (EUR por 1 ${v.divisa})`, valor: 1 / tipo, formato: 'num:6' },
      ],
      convenciones: {
        base: 'No aplica (conversión al contado)',
        periodicidad: 'Tipo diario de referencia (referencia BCE)',
        nominalEfectivo: 'Importe nominal convertido',
        comisiones: 'Sin comisiones ni margen',
      },
      avisos: ['Los tipos de referencia del BCE son solo informativos: los bancos aplican su propio cambio con margen.'],
      etiquetaDato: 'referencia BCE',
    };
  },
};
