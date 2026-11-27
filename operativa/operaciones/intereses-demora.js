import { interesSimple } from '../lib/finanzas.js';
import { diasEntre } from '../../web/js/lib/formato.js';
import { positivo, exigir } from './_comun.js';

export const DIFERENCIAL_DEMORA_COMERCIAL = 0.08; // Ley 3/2004, art. 7: tipo BCE + 8 puntos

export default {
  id: 'intereses-demora',
  titulo: 'Intereses de demora',
  tituloIngles: 'Late-payment interest',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/intereses-de-demora.md',
  resumen: 'Intereses por retraso en un pago entre dos fechas: tipo legal del dinero, demora comercial (BCE + 8 pp) o pactado.',
  campos: [
    { id: 'importe', etiqueta: 'Importe impagado', unidad: 'EUR', tipo: 'numero', defecto: '15.000' },
    { id: 'vencimiento', etiqueta: 'Fecha de vencimiento', tipo: 'fecha', defecto: '01/10/2026' },
    { id: 'pago', etiqueta: 'Fecha de pago', tipo: 'fecha', defecto: '15/12/2026' },
    { id: 'regimen', etiqueta: 'Tipo aplicable', tipo: 'seleccion', defecto: 'legal',
      opciones: [
        { valor: 'legal', etiqueta: 'Interés legal del dinero' },
        { valor: 'comercial', etiqueta: 'Demora en operaciones comerciales (Ley 3/2004)' },
        { valor: 'pactado', etiqueta: 'Tipo pactado en el contrato' },
      ] },
    { id: 'tipoLegal', etiqueta: 'Interés legal del dinero', unidad: '%', tipo: 'porcentaje', defecto: '3,25', visibleSi: { campo: 'regimen', valor: 'legal' },
      ayuda: '⚠️ Pendiente de verificar: lo fija cada año la Ley de Presupuestos; comprueba el del año del retraso.' },
    { id: 'tipoBce', etiqueta: 'Tipo de referencia del BCE (MRO) del semestre', unidad: '%', tipo: 'porcentaje', defecto: '2,15', visibleSi: { campo: 'regimen', valor: 'comercial' },
      ayuda: 'El vigente el 1 de enero o el 1 de julio; Hacienda lo publica en el BOE cada semestre. El MRO actual está en la zona Tipos de interés.' },
    { id: 'tipoPactado', etiqueta: 'Tipo pactado', unidad: '% anual', tipo: 'porcentaje', defecto: '5,00', visibleSi: { campo: 'regimen', valor: 'pactado' } },
  ],
  calcular(v) {
    const C = positivo(v.importe, 'Importe');
    const dias = diasEntre(v.vencimiento, v.pago);
    exigir(dias > 0, 'La fecha de pago debe ser posterior al vencimiento');
    const tipo = v.regimen === 'legal' ? v.tipoLegal : v.regimen === 'comercial' ? v.tipoBce + DIFERENCIAL_DEMORA_COMERCIAL : v.tipoPactado;
    exigir(Number.isFinite(tipo) && tipo >= 0, 'Tipo no válido');
    const intereses = interesSimple(C, tipo, dias, 'ACT/365');
    const avisos = [];
    if (v.regimen === 'comercial') avisos.push('Ley 3/2004: entre empresas, o entre empresas y la Administración, salvo pacto distinto. Además se puede reclamar una indemnización por costes de cobro (no incluida).');
    if (v.regimen === 'legal') avisos.push('El interés legal del dinero se aplica a falta de pacto (Código Civil, art. 1108); para deudas tributarias se usa el interés de demora tributario, otro tipo distinto.');
    avisos.push('Si el retraso abarca dos años o dos semestres con tipos distintos, calcula cada tramo por separado.');
    return {
      resultados: [
        { id: 'intereses', etiqueta: 'Intereses de demora', valor: intereses, formato: 'eur', destacado: true },
        { id: 'dias', etiqueta: 'Días de retraso', valor: dias, formato: 'entero' },
        { id: 'tipo', etiqueta: 'Tipo anual aplicado', valor: tipo, formato: 'pct:4' },
        { id: 'total', etiqueta: 'Importe total a reclamar', valor: C + intereses, formato: 'eur' },
      ],
      convenciones: {
        base: 'Días naturales / 365 (desde el día siguiente al vencimiento hasta el de pago)',
        periodicidad: 'Interés simple, sin capitalizar', nominalEfectivo: 'Tipo nominal anual',
        comisiones: 'Sin costes de cobro ni gastos judiciales',
      },
      avisos,
    };
  },
};
