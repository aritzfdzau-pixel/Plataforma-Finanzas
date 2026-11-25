import { comisionesPeriodicas } from '../lib/finanzas.js';
import { positivo, noNegativo, entero } from './_comun.js';

export default {
  id: 'avales',
  titulo: 'Coste de avales y garantías',
  tituloIngles: 'Bank guarantees cost',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/avales-y-garantias.md',
  resumen: 'Comisión de riesgo por periodo (con mínimo), formalización, gastos, coste total y % anual equivalente.',
  campos: [
    { id: 'tipoAval', etiqueta: 'Tipo de aval (solo informativo)', tipo: 'seleccion', defecto: 'tecnico',
      opciones: [{ valor: 'tecnico', etiqueta: 'Técnico (performance / bid bond)' }, { valor: 'financiero', etiqueta: 'Financiero (garantiza un pago o una deuda)' }] },
    { id: 'importe', etiqueta: 'Importe avalado', unidad: 'EUR', tipo: 'numero', defecto: '100.000' },
    { id: 'dias', etiqueta: 'Plazo del aval', unidad: 'días', tipo: 'entero', defecto: '365' },
    { id: 'riesgo', etiqueta: 'Comisión de riesgo anual (sobre el importe)', unidad: '%', tipo: 'porcentaje', defecto: '1,00' },
    { id: 'periodicidad', etiqueta: 'Liquidación de la comisión de riesgo', tipo: 'seleccion', defecto: '4',
      opciones: [{ valor: '4', etiqueta: 'Trimestral' }, { valor: '12', etiqueta: 'Mensual' }, { valor: '2', etiqueta: 'Semestral' }, { valor: '1', etiqueta: 'Anual' }] },
    { id: 'minimo', etiqueta: 'Mínimo por periodo', unidad: 'EUR', tipo: 'numero', defecto: '30' },
    { id: 'formalizacion', etiqueta: 'Comisión de formalización (sobre el importe)', unidad: '%', tipo: 'porcentaje', defecto: '0,50' },
    { id: 'gastos', etiqueta: 'Gastos fijos (intervención, correo…)', unidad: 'EUR', tipo: 'numero', defecto: '50' },
  ],
  calcular(v) {
    const importe = positivo(v.importe, 'Importe avalado');
    const dias = entero(v.dias, 'Plazo');
    noNegativo(v.riesgo, 'Comisión de riesgo'); noNegativo(v.minimo, 'Mínimo'); noNegativo(v.formalizacion, 'Formalización'); noNegativo(v.gastos, 'Gastos');
    const m = Number(v.periodicidad);
    const c = comisionesPeriodicas({ importe, tasaAnual: v.riesgo, dias, periodosAnio: m, minimo: v.minimo }); // P-022
    const formalizacion = importe * v.formalizacion;
    const costeTotal = c.total + formalizacion + v.gastos;
    const costeAnual = (costeTotal / importe) * (365 / dias);
    const avisos = [
      `Aval ${v.tipoAval === 'tecnico' ? 'técnico: garantiza el cumplimiento de un contrato (licitaciones, buena ejecución, anticipos)' : 'financiero: garantiza el pago de una deuda; suele tener una comisión de riesgo mayor'}. El tipo es solo una etiqueta: no cambia el cálculo.`,
      'Un aval no es financiación: no hay dinero recibido, así que el % anual equivalente es un coste simple sobre el importe avalado, no un tipo de interés.',
      '⚠️ Pendiente de verificar: se supone que cada periodo iniciado se cobra entero (sin prorrata) y por anticipado; algunas entidades prorratean el último periodo o liquidan hasta la devolución del documento original del aval.',
    ];
    if (c.aplicaMinimo) avisos.unshift('Se aplica el mínimo por periodo.');
    return {
      resultados: [
        { id: 'costeTotal', etiqueta: 'Coste total', valor: costeTotal, formato: 'eur', destacado: true },
        { id: 'costeAnual', etiqueta: 'Coste en % anual equivalente (simple, base 365)', valor: costeAnual, formato: 'pct:3', destacado: true },
        { id: 'sobrecoste', etiqueta: 'Sobrecoste frente a la comisión de riesgo (% anual − comisión)', valor: costeAnual - v.riesgo, formato: 'pct:3', variacion: 'coste' },
        { grupo: 'Desglose', id: 'periodos', etiqueta: 'Periodos de liquidación cobrados', valor: c.periodos, formato: 'entero' },
        { grupo: 'Desglose', id: 'comisionPeriodo', etiqueta: 'Comisión de riesgo por periodo', valor: c.comisionPeriodo, formato: 'eur' },
        { grupo: 'Desglose', id: 'comisionRiesgo', etiqueta: 'Comisión de riesgo total', valor: c.total, formato: 'eur' },
        { grupo: 'Desglose', id: 'formalizacion', etiqueta: 'Comisión de formalización', valor: formalizacion, formato: 'eur' },
        { grupo: 'Desglose', id: 'gastos', etiqueta: 'Gastos fijos', valor: v.gastos, formato: 'eur' },
      ],
      convenciones: {
        base: 'Periodos de 365/m días; % anual equivalente en base 365',
        periodicidad: `Comisión de riesgo ${{ 12: 'mensual', 4: 'trimestral', 2: 'semestral', 1: 'anual' }[m]}, por periodo iniciado`,
        nominalEfectivo: 'Comisión anual nominal sobre el importe avalado; % anual equivalente simple (no hay financiación)',
        comisiones: 'Incluidas: riesgo (con mínimo por periodo), formalización y gastos fijos',
      },
      avisos,
    };
  },
};
