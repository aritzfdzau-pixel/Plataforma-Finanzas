import { interesSimple, costeEfectivoAnual, tinATae } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir, BASES_OPCIONES } from './_comun.js';

export default {
  id: 'deposito-plazo',
  titulo: 'Depósito a plazo fijo',
  tituloIngles: 'Fixed-term deposit',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/capitalizacion-y-depositos.md',
  resumen: 'Intereses brutos y netos y TAE de un depósito con pago al vencimiento o liquidaciones periódicas.',
  campos: [
    { id: 'capital', etiqueta: 'Importe del depósito', unidad: 'EUR', tipo: 'numero', defecto: '20.000' },
    { id: 'tipo', etiqueta: 'TIN anual', unidad: '%', tipo: 'porcentaje', defecto: '2,50' },
    { id: 'modalidad', etiqueta: 'Pago de intereses', tipo: 'seleccion', defecto: 'vencimiento',
      opciones: [{ valor: 'vencimiento', etiqueta: 'Al vencimiento (plazo en días)' }, { valor: 'periodico', etiqueta: 'Periódico (plazo en meses)' }] },
    { id: 'dias', etiqueta: 'Plazo', unidad: 'días', tipo: 'entero', defecto: '180', visibleSi: { campo: 'modalidad', valor: 'vencimiento' } },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/365', opciones: BASES_OPCIONES, visibleSi: { campo: 'modalidad', valor: 'vencimiento' } },
    { id: 'meses', etiqueta: 'Plazo', unidad: 'meses', tipo: 'entero', defecto: '12', visibleSi: { campo: 'modalidad', valor: 'periodico' } },
    { id: 'liquidacion', etiqueta: 'Liquidación de intereses', tipo: 'seleccion', defecto: '12', visibleSi: { campo: 'modalidad', valor: 'periodico' },
      opciones: [{ valor: '12', etiqueta: 'Mensual' }, { valor: '4', etiqueta: 'Trimestral' }, { valor: '2', etiqueta: 'Semestral' }, { valor: '1', etiqueta: 'Anual' }] },
    { id: 'retencion', etiqueta: 'Retención sobre intereses', unidad: '%', tipo: 'porcentaje', defecto: '19,00',
      ayuda: 'Retención a cuenta del IRPF; comprueba el tipo vigente.' },
  ],
  calcular(v) {
    const C = positivo(v.capital, 'Importe');
    exigir(Number.isFinite(v.tipo) && v.tipo >= 0, 'TIN no válido');
    noNegativo(v.retencion, 'Retención');
    const avisos = ['Los depósitos en entidades españolas están cubiertos por el Fondo de Garantía de Depósitos hasta 100.000 € por titular y entidad.'];
    if (v.modalidad === 'periodico') {
      const meses = entero(v.meses, 'Plazo en meses');
      const m = Number(v.liquidacion);
      exigir((meses * m) % 12 === 0, 'El plazo debe ser un número entero de periodos de liquidación');
      const periodos = (meses * m) / 12;
      const porPeriodo = C * v.tipo / m;
      const total = porPeriodo * periodos;
      avisos.push('Liquidación periódica: los intereses se abonan en cuenta y no se reinvierten en el depósito; la TAE supone que se reinvierten al mismo tipo (definición normativa).');
      return {
        resultados: [
          { id: 'tae', etiqueta: 'TAE', valor: tinATae(v.tipo, m), formato: 'pct:4', destacado: true },
          { id: 'porPeriodo', etiqueta: 'Intereses brutos de cada liquidación', valor: porPeriodo, formato: 'eur' },
          { id: 'brutos', etiqueta: `Intereses brutos totales (${periodos} liquidaciones)`, valor: total, formato: 'eur' },
          { id: 'retencionImporte', etiqueta: 'Retención', valor: -total * v.retencion, formato: 'eur' },
          { id: 'netos', etiqueta: 'Intereses netos', valor: total * (1 - v.retencion), formato: 'eur', destacado: true },
        ],
        convenciones: {
          base: 'Periodos iguales de 1/m de año (TIN / m)', periodicidad: `${m} liquidaciones al año durante ${meses} meses`,
          nominalEfectivo: 'TIN nominal → TAE efectiva (P-003)', comisiones: 'Sin comisiones',
        },
        avisos,
      };
    }
    const dias = entero(v.dias, 'Plazo en días');
    const brutos = interesSimple(C, v.tipo, dias, v.base);
    const tae = costeEfectivoAnual(C, C + brutos, dias);
    return {
      resultados: [
        { id: 'tae', etiqueta: 'TAE', valor: tae, formato: 'pct:4', destacado: true },
        { id: 'brutos', etiqueta: 'Intereses brutos', valor: brutos, formato: 'eur' },
        { id: 'retencionImporte', etiqueta: 'Retención', valor: -brutos * v.retencion, formato: 'eur' },
        { id: 'netos', etiqueta: 'Intereses netos', valor: brutos * (1 - v.retencion), formato: 'eur', destacado: true },
        { id: 'final', etiqueta: 'Importe al vencimiento (neto)', valor: C + brutos * (1 - v.retencion), formato: 'eur' },
      ],
      convenciones: {
        base: `${v.base === 'ACT/360' ? 'Act/360' : 'Act/365'} para los intereses; TAE en días/365`,
        periodicidad: `Un único pago al vencimiento (${dias} días)`,
        nominalEfectivo: 'TIN nominal (interés simple) → TAE = (1 + i·t)^(365/días) − 1',
        comisiones: 'Sin comisiones',
      },
      avisos,
    };
  },
};
