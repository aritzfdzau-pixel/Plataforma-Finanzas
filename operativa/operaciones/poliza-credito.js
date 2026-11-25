import { costePolizaCredito } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir } from './_comun.js';

const BASES = [{ valor: 'ACT/360', etiqueta: 'Act/360' }, { valor: 'ACT/365', etiqueta: 'Act/365' }];

export default {
  id: 'poliza-credito',
  titulo: 'Coste de una póliza de crédito',
  tituloIngles: 'Credit line cost',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/poliza-de-credito.md',
  resumen: 'Intereses sobre lo dispuesto, comisiones de apertura, estudio y no disponibilidad, excedido y coste efectivo anual.',
  campos: [
    { id: 'limite', etiqueta: 'Límite de la póliza (credit limit)', unidad: 'EUR', tipo: 'numero', defecto: '200.000' },
    { id: 'meses', etiqueta: 'Plazo', unidad: 'meses', tipo: 'entero', defecto: '12' },
    { id: 'saldoMedio', etiqueta: 'Saldo medio dispuesto (average drawn balance)', unidad: 'EUR', tipo: 'numero', defecto: '120.000' },
    { id: 'tipo', etiqueta: 'Tipo deudor sobre el dispuesto (TIN)', unidad: '%', tipo: 'porcentaje', defecto: '5,00' },
    { id: 'periodicidad', etiqueta: 'Liquidación de intereses', tipo: 'seleccion', defecto: '4',
      opciones: [{ valor: '12', etiqueta: 'Mensual' }, { valor: '4', etiqueta: 'Trimestral' }] },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/360', opciones: BASES },
    { id: 'apertura', etiqueta: 'Comisión de apertura (sobre el límite)', unidad: '%', tipo: 'porcentaje', defecto: '0,50' },
    { id: 'estudio', etiqueta: 'Comisión de estudio (sobre el límite)', unidad: '%', tipo: 'porcentaje', defecto: '0,25' },
    { id: 'noDisponibilidad', etiqueta: 'Comisión de no disponibilidad (anual, sobre el saldo medio no dispuesto)', unidad: '%', tipo: 'porcentaje', defecto: '0,10' },
    { id: 'conExcedido', etiqueta: 'Incluir excedido (overdraft over the limit)', tipo: 'casilla', defecto: 'no' },
    { id: 'saldoExcedido', etiqueta: 'Saldo medio excedido', unidad: 'EUR', tipo: 'numero', defecto: '0', visibleSi: { campo: 'conExcedido', valor: 'si' } },
    { id: 'tipoExcedido', etiqueta: 'Tipo de excedido', unidad: '%', tipo: 'porcentaje', defecto: '0', visibleSi: { campo: 'conExcedido', valor: 'si' } },
  ],
  calcular(v) {
    positivo(v.limite, 'Límite'); positivo(v.saldoMedio, 'Saldo medio dispuesto');
    entero(v.meses, 'Plazo');
    exigir(v.saldoMedio <= v.limite, 'El saldo medio dispuesto no puede superar el límite (lo que lo supera es excedido)');
    for (const [x, n] of [[v.tipo, 'Tipo deudor'], [v.apertura, 'Comisión de apertura'], [v.estudio, 'Comisión de estudio'], [v.noDisponibilidad, 'Comisión de no disponibilidad']]) noNegativo(x, n);
    const m = Number(v.periodicidad);
    exigir(m === 12 || v.meses % 3 === 0, 'Con liquidación trimestral el plazo debe ser múltiplo de 3 meses');
    const saldoExcedido = v.conExcedido ? noNegativo(v.saldoExcedido, 'Saldo excedido') : 0;
    const tipoExcedido = v.conExcedido ? noNegativo(v.tipoExcedido, 'Tipo de excedido') : 0;
    const c = costePolizaCredito({ limite: v.limite, meses: v.meses, tipo: v.tipo, saldoMedio: v.saldoMedio, apertura: v.apertura,
      estudio: v.estudio, noDisponibilidad: v.noDisponibilidad, periodosAnio: m, base: v.base, tipoExcedido, saldoExcedido });
    exigir(c.costeEfectivo !== null, 'No se ha podido calcular el coste efectivo con estos datos');
    const resultados = [
      { id: 'costeTotal', etiqueta: 'Coste total en EUR', valor: c.costeTotal, formato: 'eur', destacado: true },
      { id: 'costeEfectivo', etiqueta: 'Coste efectivo anual sobre el saldo medio dispuesto', valor: c.costeEfectivo, formato: 'pct:3', destacado: true },
      { id: 'sobrecoste', etiqueta: 'Sobrecoste frente al tipo deudor (coste efectivo − TIN)', valor: c.costeEfectivo - v.tipo, formato: 'pct:3', variacion: 'coste' },
      { grupo: 'Desglose', id: 'intereses', etiqueta: 'Intereses sobre el dispuesto', valor: c.intereses, formato: 'eur' },
      { grupo: 'Desglose', id: 'interesesPeriodo', etiqueta: `Intereses por liquidación (${c.periodos} liquidaciones)`, valor: c.interesesPeriodo, formato: 'eur' },
      { grupo: 'Desglose', id: 'comisionApertura', etiqueta: 'Comisión de apertura', valor: c.comisionApertura, formato: 'eur' },
      { grupo: 'Desglose', id: 'comisionEstudio', etiqueta: 'Comisión de estudio', valor: c.comisionEstudio, formato: 'eur' },
      { grupo: 'Desglose', id: 'comisionNoDisponibilidad', etiqueta: 'Comisión de no disponibilidad', valor: c.comisionNoDisponibilidad, formato: 'eur' },
    ];
    if (v.conExcedido) resultados.push({ grupo: 'Desglose', id: 'interesesExcedido', etiqueta: 'Intereses de excedido', valor: c.interesesExcedido, formato: 'eur' });
    return {
      resultados,
      convenciones: {
        base: `Intereses y no disponibilidad en ${v.base === 'ACT/365' ? 'Act/365' : 'Act/360'}; cada liquidación dura 365/${m} días (año de 365 días)`,
        periodicidad: `Liquidación ${m === 12 ? 'mensual' : 'trimestral'} durante ${v.meses} meses`,
        nominalEfectivo: 'Tipo deudor nominal; coste efectivo anual compuesto (TIR de los flujos) sobre el saldo medio dispuesto',
        comisiones: 'Incluidas: apertura y estudio al inicio (sobre el límite); no disponibilidad en cada liquidación; excedido si se marca',
      },
      avisos: [
        'Supone un saldo dispuesto constante igual al saldo medio. En la realidad el saldo cambia cada día y los intereses se calculan sobre los saldos diarios.',
        '⚠️ Pendiente de verificar: la TAE que publica una entidad para una póliza usa hipótesis normalizadas de disposición; este coste efectivo usa el saldo medio que introduces y no es comparable con ella.',
        'El excedido suele llevar además una comisión propia y está limitado por la normativa en los créditos a consumidores; aquí solo se incluyen sus intereses.',
      ],
    };
  },
};
