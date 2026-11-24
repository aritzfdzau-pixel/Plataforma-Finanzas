import { cuotaFrancesa } from '../lib/finanzas.js';
import { positivo, entero } from './_comun.js';

const CHOQUES_PB = [-200, -100, -50, 50, 100, 200];

export default {
  id: 'escenario-euribor',
  titulo: 'Escenario de Euribor en una hipoteca',
  tituloIngles: 'Interest rate scenario',
  categoria: 'real-estate',
  ficha: 'conocimiento/real-estate/hipoteca-variable.md',
  resumen: 'Nueva cuota si el Euribor sube o baja X puntos básicos.',
  campos: [
    { id: 'capital', etiqueta: 'Capital pendiente', unidad: 'EUR', tipo: 'numero', defecto: '150.000' },
    { id: 'meses', etiqueta: 'Plazo restante', unidad: 'meses', tipo: 'entero', defecto: '300' },
    { id: 'euribor', etiqueta: 'Euribor actual (media mensual BdE)', unidad: '%', tipo: 'porcentaje', defecto: '2,50' },
    { id: 'diferencial', etiqueta: 'Diferencial', unidad: '%', tipo: 'porcentaje', defecto: '0,80' },
    { id: 'choque', etiqueta: 'Movimiento del Euribor', unidad: 'pb', tipo: 'numero', defecto: '100',
      ayuda: '1 punto básico (pb) = 0,01 %. Ejemplo del plan: +100 pb.' },
    { id: 'sinNegativo', etiqueta: 'El TIN no puede ser negativo', tipo: 'seleccion', defecto: 'si',
      opciones: [{ valor: 'si', etiqueta: 'Sí (TIN mínimo 0 %)' }, { valor: 'no', etiqueta: 'No' }] },
  ],
  calcular(v) {
    const capital = positivo(v.capital, 'Capital');
    const n = entero(v.meses, 'Plazo restante');
    const ajustar = (t) => (v.sinNegativo === 'si' ? Math.max(0, t) : t);
    const tin = (pb) => ajustar(v.euribor + pb / 10000 + v.diferencial);
    const cuota = (pb) => cuotaFrancesa(capital, tin(pb) / 12, n);
    const c0 = cuota(0), c1 = cuota(v.choque);
    const fila = (pb) => {
      const c = cuota(pb);
      return { choque: pb, euribor: v.euribor + pb / 10000, tin: tin(pb), cuota: c, diferencia: c - c0, intereses: c * n - capital };
    };
    const choques = [...new Set([...CHOQUES_PB, 0, v.choque])].sort((a, b) => a - b);
    return {
      resultados: [
        { id: 'tin0', etiqueta: 'TIN actual (Euribor + diferencial)', valor: tin(0), formato: 'pct:3' },
        { id: 'cuota0', etiqueta: 'Cuota mensual actual', valor: c0, formato: 'eur' },
        { id: 'tin1', etiqueta: `TIN en el escenario (${v.choque >= 0 ? '+' : ''}${v.choque} pb)`, valor: tin(v.choque), formato: 'pct:3' },
        { id: 'cuota1', etiqueta: 'Cuota mensual en el escenario', valor: c1, formato: 'eur', destacado: true },
        { id: 'diferencia', etiqueta: 'Variación de la cuota mensual', valor: c1 - c0, formato: 'eur', variacion: true },
        { id: 'diferenciaAnual', etiqueta: 'Variación anual (×12)', valor: (c1 - c0) * 12, formato: 'eur', variacion: true },
        { id: 'interesesExtra', etiqueta: 'Variación de los intereses que quedan por pagar', valor: (c1 - c0) * n, formato: 'eur', variacion: true },
      ],
      convenciones: {
        base: 'Tipo mensual = TIN / 12 (sistema francés)',
        periodicidad: 'Cuotas mensuales; el nuevo tipo se aplica a todo el plazo restante',
        nominalEfectivo: 'TIN nominal (índice + diferencial)',
        comisiones: 'No incluidas (ni seguros vinculados)',
      },
      avisos: [
        'Escenario hipotético: supone que el Euribor se mueve ya y se queda ahí todo el plazo; en la realidad se revisa cada 6 o 12 meses.',
        'Usa la media mensual del Euribor que publica el Banco de España (índice oficial), no el diario.',
      ],
      tabla: {
        nombreCsv: 'escenarios-euribor.csv',
        columnas: [
          { id: 'choque', etiqueta: 'Movimiento (pb)', formato: 'entero' },
          { id: 'euribor', etiqueta: 'Euribor', formato: 'pct:2' },
          { id: 'tin', etiqueta: 'TIN', formato: 'pct:2' },
          { id: 'cuota', etiqueta: 'Cuota', formato: 'num:2' },
          { id: 'diferencia', etiqueta: 'Variación', formato: 'num:2' },
          { id: 'intereses', etiqueta: 'Intereses restantes', formato: 'num:2' },
        ],
        filas: choques.map(fila),
      },
    };
  },
};
