import { interesSimple, costeEfectivoAnual } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir } from './_comun.js';

export default {
  id: 'descuento-comercial',
  titulo: 'Coste efectivo de descuento comercial / confirming',
  tituloIngles: 'Trade bill discounting / reverse factoring',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/descuento-comercial-confirming.md',
  resumen: 'Efectivo recibido y coste efectivo anual de anticipar un cobro.',
  campos: [
    { id: 'modalidad', etiqueta: 'Modalidad', tipo: 'seleccion', defecto: 'descuento',
      opciones: [{ valor: 'descuento', etiqueta: 'Descuento comercial' }, { valor: 'confirming', etiqueta: 'Confirming (anticipo al proveedor)' }] },
    { id: 'nominal', etiqueta: 'Nominal del efecto / factura', unidad: 'EUR', tipo: 'numero', defecto: '20.000' },
    { id: 'dias', etiqueta: 'Días hasta el vencimiento', unidad: 'días', tipo: 'entero', defecto: '60' },
    { id: 'tipo', etiqueta: 'Tipo de descuento anual', unidad: '%', tipo: 'porcentaje', defecto: '6,00' },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/360',
      opciones: [{ valor: 'ACT/360', etiqueta: 'Act/360' }, { valor: 'ACT/365', etiqueta: 'Act/365' }] },
    { id: 'comision', etiqueta: 'Comisión sobre el nominal', unidad: '%', tipo: 'porcentaje', defecto: '0,50' },
    { id: 'comisionMinima', etiqueta: 'Comisión mínima', unidad: 'EUR', tipo: 'numero', defecto: '6' },
    { id: 'gastos', etiqueta: 'Otros gastos fijos', unidad: 'EUR', tipo: 'numero', defecto: '3' },
  ],
  calcular(v) {
    const nominal = positivo(v.nominal, 'Nominal');
    const dias = entero(v.dias, 'Días');
    noNegativo(v.tipo, 'Tipo'); noNegativo(v.comision, 'Comisión');
    noNegativo(v.comisionMinima, 'Comisión mínima'); noNegativo(v.gastos, 'Gastos');
    const intereses = interesSimple(nominal, v.tipo, dias, v.base);
    const comision = Math.max(nominal * v.comision, v.comisionMinima);
    const efectivo = nominal - intereses - comision - v.gastos;
    exigir(efectivo > 0, 'Los costes superan el nominal: revisa los datos');
    const coste = nominal - efectivo;
    const avisos = [];
    if (comision === v.comisionMinima && v.comisionMinima > 0) avisos.push('Se aplica la comisión mínima.');
    if (v.modalidad === 'confirming') avisos.push('En el confirming el proveedor solo soporta este coste si pide el anticipo; si espera al vencimiento, cobra el nominal.');
    return {
      resultados: [
        { id: 'efectivo', etiqueta: 'Efectivo recibido', valor: efectivo, formato: 'eur', destacado: true },
        { id: 'intereses', etiqueta: 'Intereses de descuento', valor: intereses, formato: 'eur' },
        { id: 'comision', etiqueta: 'Comisión', valor: comision, formato: 'eur' },
        { id: 'gastos', etiqueta: 'Otros gastos', valor: v.gastos, formato: 'eur' },
        { id: 'coste', etiqueta: 'Coste total', valor: coste, formato: 'eur' },
        { id: 'costeEfectivo', etiqueta: 'Coste efectivo anual (compuesto, base 365)', valor: costeEfectivoAnual(efectivo, nominal, dias), formato: 'pct:3', destacado: true },
      ],
      convenciones: {
        base: `Intereses en ${v.base === 'ACT/365' ? 'Act/365' : 'Act/360'}; coste efectivo en base 365`,
        periodicidad: 'Un único flujo al vencimiento',
        nominalEfectivo: 'Tipo de descuento nominal; coste efectivo anual equivalente',
        comisiones: 'Incluidas: comisión (con mínimo) y gastos fijos',
      },
      avisos,
    };
  },
};
