import { escenarioTipoCambio } from '../lib/finanzas.js';
import { positivo, exigir } from './_comun.js';
import { DIVISAS_BCE } from './fx-conversion-bce.js';

const MOVIMIENTOS = [-0.10, -0.05, -0.02, -0.01, 0.01, 0.02, 0.05, 0.10];

export default {
  id: 'escenario-tipo-cambio',
  titulo: 'Escenario de tipo de cambio',
  tituloIngles: 'FX scenario analysis',
  categoria: 'fx',
  ficha: 'conocimiento/fx/escenarios-tipo-de-cambio.md',
  resumen: 'Impacto en EUR de un cobro o pago en divisa si el tipo se mueve un %.',
  campos: [
    { id: 'posicion', etiqueta: 'Posición', tipo: 'seleccion', defecto: 'cobro',
      opciones: [{ valor: 'cobro', etiqueta: 'Cobro en divisa (p. ej. exportador)' }, { valor: 'pago', etiqueta: 'Pago en divisa (p. ej. importador)' }] },
    { id: 'divisa', etiqueta: 'Divisa', tipo: 'seleccion', defecto: 'USD', opciones: DIVISAS_BCE.map(([c]) => ({ valor: c, etiqueta: `EUR/${c}` })) },
    { id: 'importe', etiqueta: 'Importe en divisa', tipo: 'numero', defecto: '100.000' },
    { id: 'tipo', etiqueta: 'Tipo de cambio actual (divisa por 1 EUR)', tipo: 'numero', defecto: '1,0850',
      rellenarCon: { fuente: 'bce', divisa: 'divisa' } },
    { id: 'movimiento', etiqueta: 'Movimiento del tipo EUR/divisa', unidad: '%', tipo: 'porcentaje', defecto: '-5',
      ayuda: 'Negativo: el euro se deprecia (más EUR por cada unidad de divisa). Ejemplo del plan: EUR/USD −5 %.' },
  ],
  calcular(v) {
    const importe = positivo(v.importe, 'Importe');
    const tipo = positivo(v.tipo, 'Tipo de cambio');
    exigir(v.movimiento > -1, 'Movimiento: debe ser mayor que −100 %');
    const signo = v.posicion === 'cobro' ? 1 : -1; // en un pago, más EUR es una pérdida
    const e = escenarioTipoCambio({ importeDivisa: importe, tipo, movimiento: v.movimiento });
    const fila = (m) => {
      const x = escenarioTipoCambio({ importeDivisa: importe, tipo, movimiento: m });
      return { movimiento: m, tipo: x.tipoEscenario, contravalor: x.escenario, impacto: signo * x.diferencia };
    };
    const movs = [...new Set([...MOVIMIENTOS, v.movimiento])].sort((a, b) => a - b);
    return {
      resultados: [
        { id: 'actual', etiqueta: `Contravalor actual (${v.posicion === 'cobro' ? 'EUR a recibir' : 'EUR a pagar'})`, valor: e.actual, formato: 'eur' },
        { id: 'tipoEscenario', etiqueta: `Tipo EUR/${v.divisa} en el escenario`, valor: e.tipoEscenario, formato: `num:${v.divisa === 'JPY' ? 2 : 4}` },
        { id: 'escenario', etiqueta: 'Contravalor en el escenario', valor: e.escenario, formato: 'eur' },
        { id: 'impacto', etiqueta: 'Impacto en resultado (+ ganancia / − pérdida)', valor: signo * e.diferencia, formato: 'eur', variacion: true, destacado: true,
          nota: v.posicion === 'cobro' ? 'Cobro: si el euro se deprecia, recibes más EUR.' : 'Pago: si el euro se deprecia, pagas más EUR.' },
        { id: 'impactoPct', etiqueta: 'Impacto sobre el contravalor actual', valor: (signo * e.diferencia) / e.actual, formato: 'pct:2', variacion: true },
      ],
      convenciones: {
        base: 'No aplica (contravalor al contado: importe / tipo)',
        periodicidad: 'Movimiento instantáneo del tipo; sin plazo ni intereses',
        nominalEfectivo: 'Importe nominal en divisa; tipo en divisa por 1 EUR',
        comisiones: 'Sin comisiones ni margen del banco',
      },
      avisos: [
        'Escenario hipotético ("qué pasaría si"), no una proyección de lo que va a ocurrir.',
        'Un seguro de cambio fija el tipo y elimina este impacto (operación «Seguro de cambio»).',
      ],
      tabla: {
        nombreCsv: `escenarios-eur${v.divisa.toLowerCase()}.csv`,
        columnas: [
          { id: 'movimiento', etiqueta: 'Movimiento', formato: 'pct:1' },
          { id: 'tipo', etiqueta: `EUR/${v.divisa}`, formato: `num:${v.divisa === 'JPY' ? 2 : 4}` },
          { id: 'contravalor', etiqueta: 'Contravalor (EUR)', formato: 'num:2' },
          { id: 'impacto', etiqueta: 'Impacto (EUR)', formato: 'num:2' },
        ],
        filas: movs.map(fila),
      },
    };
  },
};
