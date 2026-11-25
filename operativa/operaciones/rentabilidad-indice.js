import { rentabilidadAcumulada } from '../lib/finanzas.js';
import { positivo, entero, noNegativo } from './_comun.js';

export default {
  id: 'rentabilidad-indice',
  titulo: 'Rentabilidad de un índice entre dos fechas',
  tituloIngles: 'Index return (price vs. total return)',
  categoria: 'bolsa-inversion',
  ficha: 'conocimiento/bolsa-inversion/indices-bursatiles.md',
  resumen: 'Rentabilidad acumulada y anualizada de un índice de precios, y aproximación con dividendos (rentabilidad total).',
  campos: [
    { id: 'inicial', etiqueta: 'Nivel del índice al inicio', unidad: 'puntos', tipo: 'numero', defecto: '10.000' },
    { id: 'final', etiqueta: 'Nivel del índice al final', unidad: 'puntos', tipo: 'numero', defecto: '11.500' },
    { id: 'dias', etiqueta: 'Días naturales entre las dos fechas', unidad: 'días', tipo: 'entero', defecto: '730' },
    { id: 'dividendo', etiqueta: 'Rentabilidad por dividendo anual (dividend yield, opcional)', unidad: '%', tipo: 'porcentaje', defecto: '3,00' },
  ],
  calcular(v) {
    positivo(v.inicial, 'Nivel inicial'); positivo(v.final, 'Nivel final');
    const dias = entero(v.dias, 'Días');
    noNegativo(v.dividendo, 'Dividendo');
    const p = rentabilidadAcumulada(v.inicial, v.final, dias); // P-025
    const factorDiv = (1 + v.dividendo) ** (dias / 365);
    const total = (1 + p.acumulada) * factorDiv - 1;
    return {
      resultados: [
        { id: 'acumulada', etiqueta: 'Rentabilidad acumulada del precio (price return)', valor: p.acumulada, formato: 'pct:2', destacado: true },
        { id: 'anualizada', etiqueta: 'Rentabilidad anualizada del precio (base 365)', valor: p.anualizada, formato: 'pct:2', destacado: true },
        { grupo: 'Con dividendos (aproximación)', id: 'totalAcumulada', etiqueta: 'Rentabilidad total acumulada (total return, aprox.)', valor: total, formato: 'pct:2' },
        { grupo: 'Con dividendos (aproximación)', id: 'totalAnualizada', etiqueta: 'Rentabilidad total anualizada (aprox.)', valor: (1 + total) ** (365 / dias) - 1, formato: 'pct:2' },
      ],
      convenciones: {
        base: 'Días naturales; anualización compuesta en base 365',
        periodicidad: 'Entre dos fechas',
        nominalEfectivo: 'Rentabilidad efectiva (compuesta)',
        comisiones: 'Sin comisiones, impuestos ni retenciones',
      },
      avisos: [
        'La mayoría de índices que se citan (IBEX 35, Euro Stoxx 50, S&P 500) son de precios: no incluyen dividendos. El DAX 40 es de rentabilidad total (performance index).',
        '⚠️ Pendiente de verificar: la rentabilidad total se aproxima suponiendo dividendos constantes reinvertidos de forma continua; el índice oficial de rentabilidad total reinvierte cada dividendo el día que se paga.',
      ],
    };
  },
};
