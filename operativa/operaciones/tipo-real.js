import { tipoReal, capitalFinal } from '../lib/finanzas.js';
import { exigir } from './_comun.js';

export default {
  id: 'tipo-real',
  titulo: 'Tipo de interés real (Fisher)',
  tituloIngles: 'Real interest rate (Fisher)',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/equivalencia-de-tipos.md',
  resumen: 'Rentabilidad o coste descontando la inflación, exacto y aproximado, y poder adquisitivo de un capital.',
  campos: [
    { id: 'nominal', etiqueta: 'Tipo nominal anual (efectivo)', unidad: '%', tipo: 'porcentaje', defecto: '3,00' },
    { id: 'inflacion', etiqueta: 'Inflación anual', unidad: '%', tipo: 'porcentaje', defecto: '2,20', ayuda: 'Dato o escenario (IPC o IPCA interanual).' },
    { id: 'capital', etiqueta: 'Capital (opcional)', unidad: 'EUR', tipo: 'numero', opcional: true, defecto: '10.000' },
    { id: 'anios', etiqueta: 'Plazo (opcional)', unidad: 'años', tipo: 'numero', opcional: true, defecto: '5' },
  ],
  calcular(v) {
    const r = tipoReal(v.nominal, v.inflacion);
    const resultados = [
      { id: 'real', etiqueta: 'Tipo real exacto: (1 + n) / (1 + π) − 1', valor: r.exacto, formato: 'pct:4', destacado: true },
      { id: 'aproximado', etiqueta: 'Aproximación n − π', valor: r.aproximado, formato: 'pct:4' },
      { id: 'error', etiqueta: 'Error de la aproximación', valor: r.aproximado - r.exacto, formato: 'pp:4' },
    ];
    if (v.capital !== null && v.anios !== null) {
      exigir(v.capital > 0 && v.anios > 0, 'Capital y plazo deben ser mayores que 0');
      const nominalFinal = capitalFinal({ capital: v.capital, tipo: v.nominal, anios: v.anios });
      resultados.push(
        { id: 'nominalFinal', etiqueta: 'Capital final nominal', valor: nominalFinal, formato: 'eur', grupo: 'Poder adquisitivo' },
        { id: 'realFinal', etiqueta: 'Capital final en euros de hoy', valor: capitalFinal({ capital: v.capital, tipo: r.exacto, anios: v.anios }), formato: 'eur', grupo: 'Poder adquisitivo' },
      );
    }
    return {
      resultados,
      convenciones: {
        base: 'Tipos anuales efectivos', periodicidad: 'Anual, capitalización compuesta',
        nominalEfectivo: 'Nominal (en euros corrientes) → real (en euros constantes)', comisiones: 'Sin comisiones ni impuestos',
      },
      avisos: r.exacto < 0 ? ['Tipo real negativo: el capital pierde poder adquisitivo aunque genere intereses.'] : [],
    };
  },
};
