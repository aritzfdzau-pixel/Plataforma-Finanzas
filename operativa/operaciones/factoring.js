import { interesSimple, costeEfectivoAnual } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir } from './_comun.js';

export default {
  id: 'factoring',
  titulo: 'Coste efectivo de factoring',
  tituloIngles: 'Factoring cost',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/factoring.md',
  resumen: 'Anticipo, intereses, comisiones, efectivo recibido y coste efectivo anual; con o sin recurso.',
  campos: [
    { id: 'modalidad', etiqueta: 'Modalidad', tipo: 'seleccion', defecto: 'con',
      opciones: [{ valor: 'con', etiqueta: 'Con recurso (with recourse)' }, { valor: 'sin', etiqueta: 'Sin recurso (without recourse)' }] },
    { id: 'nominal', etiqueta: 'Nominal de las facturas cedidas', unidad: 'EUR', tipo: 'numero', defecto: '100.000' },
    { id: 'anticipo', etiqueta: 'Porcentaje de anticipo', unidad: '%', tipo: 'porcentaje', defecto: '80' },
    { id: 'dias', etiqueta: 'Días hasta el vencimiento de las facturas', unidad: 'días', tipo: 'entero', defecto: '90' },
    { id: 'tipo', etiqueta: 'Tipo de interés anual sobre lo anticipado', unidad: '%', tipo: 'porcentaje', defecto: '5,00' },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/360',
      opciones: [{ valor: 'ACT/360', etiqueta: 'Act/360' }, { valor: 'ACT/365', etiqueta: 'Act/365' }] },
    { id: 'comision', etiqueta: 'Comisión de factoring (gestión y cobro, sobre el nominal)', unidad: '%', tipo: 'porcentaje', defecto: '0,80' },
    { id: 'estudio', etiqueta: 'Comisión de estudio por deudor', unidad: 'EUR', tipo: 'numero', defecto: '60' },
    { id: 'deudores', etiqueta: 'Número de deudores estudiados', tipo: 'entero', defecto: '1' },
  ],
  calcular(v) {
    const nominal = positivo(v.nominal, 'Nominal');
    exigir(Number.isFinite(v.anticipo) && v.anticipo > 0 && v.anticipo <= 1, 'Porcentaje de anticipo: entre 0 % (excluido) y 100 %');
    const dias = entero(v.dias, 'Días');
    noNegativo(v.tipo, 'Tipo'); noNegativo(v.comision, 'Comisión de factoring'); noNegativo(v.estudio, 'Comisión de estudio');
    const deudores = entero(v.deudores, 'Número de deudores', 0);
    const anticipado = nominal * v.anticipo;
    const intereses = interesSimple(anticipado, v.tipo, dias, v.base); // P-002
    const comisionFactoring = nominal * v.comision;
    const comisionEstudio = v.estudio * deudores;
    const costeTotal = intereses + comisionFactoring + comisionEstudio;
    const efectivo = anticipado - costeTotal;
    exigir(efectivo > 0, 'Los costes superan el importe anticipado: revisa los datos');
    const costeEfectivo = costeEfectivoAnual(efectivo, anticipado, dias); // P-009
    return {
      resultados: [
        { id: 'efectivo', etiqueta: 'Efectivo recibido hoy', valor: efectivo, formato: 'eur', destacado: true },
        { id: 'costeEfectivo', etiqueta: 'Coste efectivo anual (compuesto, base 365)', valor: costeEfectivo, formato: 'pct:3', destacado: true },
        { id: 'sobrecoste', etiqueta: 'Sobrecoste frente al tipo de interés (coste efectivo − tipo)', valor: costeEfectivo - v.tipo, formato: 'pct:3', variacion: 'coste' },
        { grupo: 'Desglose', id: 'anticipado', etiqueta: 'Importe anticipado', valor: anticipado, formato: 'eur' },
        { grupo: 'Desglose', id: 'intereses', etiqueta: 'Intereses (cobrados por anticipado)', valor: intereses, formato: 'eur' },
        { grupo: 'Desglose', id: 'comisionFactoring', etiqueta: 'Comisión de factoring', valor: comisionFactoring, formato: 'eur' },
        { grupo: 'Desglose', id: 'comisionEstudio', etiqueta: 'Comisión de estudio', valor: comisionEstudio, formato: 'eur' },
        { grupo: 'Desglose', id: 'costeTotal', etiqueta: 'Coste total', valor: costeTotal, formato: 'eur' },
        { grupo: 'Desglose', id: 'resto', etiqueta: 'Resto que se cobra al vencimiento (si el deudor paga)', valor: nominal - anticipado, formato: 'eur' },
      ],
      convenciones: {
        base: `Intereses en ${v.base === 'ACT/365' ? 'Act/365' : 'Act/360'} sobre lo anticipado; coste efectivo en base 365`,
        periodicidad: 'Un único vencimiento',
        nominalEfectivo: 'Tipo nominal anual; coste efectivo anual equivalente sobre lo anticipado',
        comisiones: 'Incluidas: comisión de factoring sobre el nominal y estudio por deudor',
      },
      avisos: [
        v.modalidad === 'con'
          ? 'Con recurso: si el deudor no paga, la empresa devuelve lo anticipado; el riesgo de impago sigue siendo suyo (en balance, es como una deuda).'
          : 'Sin recurso: la entidad asume la insolvencia del deudor aprobado (no los litigios comerciales); suele ser más caro y solo cubre a los deudores que acepta.',
        '⚠️ Pendiente de verificar: se suponen intereses cobrados por anticipado sobre lo anticipado; algunas entidades los liquidan a vencimiento. Las comisiones de servicio del factoring pueden llevar IVA (no incluido).',
      ],
    };
  },
};
