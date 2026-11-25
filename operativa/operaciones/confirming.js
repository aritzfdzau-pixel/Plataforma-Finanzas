import { interesSimple, costeEfectivoAnual } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir } from './_comun.js';

export default {
  id: 'confirming',
  titulo: 'Confirming: visión del cliente pagador',
  tituloIngles: 'Reverse factoring (buyer side)',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/descuento-comercial-confirming.md',
  resumen: 'Coste del servicio y del aplazamiento del pago para la empresa que paga a sus proveedores.',
  campos: [
    { id: 'nominal', etiqueta: 'Importe de las facturas de proveedores', unidad: 'EUR', tipo: 'numero', defecto: '50.000' },
    { id: 'comision', etiqueta: 'Comisión del servicio a cargo del cliente (sobre el nominal)', unidad: '%', tipo: 'porcentaje', defecto: '0,10' },
    { id: 'gastos', etiqueta: 'Gastos fijos de la remesa', unidad: 'EUR', tipo: 'numero', defecto: '0' },
    { id: 'diasAplazamiento', etiqueta: 'Días de aplazamiento sobre el vencimiento original', unidad: 'días', tipo: 'entero', defecto: '30',
      ayuda: '0 si el cliente paga en la fecha original (sin financiación).' },
    { id: 'tipo', etiqueta: 'Tipo de interés del aplazamiento', unidad: '%', tipo: 'porcentaje', defecto: '4,50' },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/360',
      opciones: [{ valor: 'ACT/360', etiqueta: 'Act/360' }, { valor: 'ACT/365', etiqueta: 'Act/365' }] },
  ],
  calcular(v) {
    const nominal = positivo(v.nominal, 'Importe');
    noNegativo(v.comision, 'Comisión'); noNegativo(v.gastos, 'Gastos'); noNegativo(v.tipo, 'Tipo');
    const dias = entero(v.diasAplazamiento, 'Días de aplazamiento', 0);
    const comision = nominal * v.comision;
    const intereses = dias > 0 ? interesSimple(nominal, v.tipo, dias, v.base) : 0; // P-002
    const costeTotal = comision + v.gastos + intereses;
    const resultados = [
      { id: 'costeTotal', etiqueta: 'Coste total para el cliente pagador', valor: costeTotal, formato: 'eur', destacado: true },
      { grupo: 'Desglose', id: 'comision', etiqueta: 'Comisión del servicio', valor: comision, formato: 'eur' },
      { grupo: 'Desglose', id: 'gastos', etiqueta: 'Gastos fijos', valor: v.gastos, formato: 'eur' },
      { grupo: 'Desglose', id: 'intereses', etiqueta: 'Intereses del aplazamiento', valor: intereses, formato: 'eur' },
      { grupo: 'Desglose', id: 'pagoAplazado', etiqueta: 'Pago en la fecha aplazada (nominal + intereses)', valor: nominal + intereses, formato: 'eur' },
    ];
    const avisos = [
      'El proveedor cobra el nominal al vencimiento o lo anticipa a su cargo: su coste se calcula en «Coste efectivo de descuento comercial / confirming» (modalidad confirming).',
      '⚠️ Pendiente de verificar: muchas líneas de confirming no cobran nada al cliente pagador; si hay aplazamiento, se supone que la comisión y los gastos se pagan en la fecha original y los intereses en la fecha aplazada.',
    ];
    if (dias > 0) {
      const financiado = nominal - comision - v.gastos;
      exigir(financiado > 0, 'La comisión y los gastos superan el importe: revisa los datos');
      const costeEfectivo = costeEfectivoAnual(financiado, nominal + intereses, dias); // P-009
      resultados.splice(1, 0,
        { id: 'costeEfectivo', etiqueta: 'Coste efectivo anual del aplazamiento (compuesto, base 365)', valor: costeEfectivo, formato: 'pct:3', destacado: true },
        { id: 'sobrecoste', etiqueta: 'Sobrecoste frente al tipo del aplazamiento (coste efectivo − tipo)', valor: costeEfectivo - v.tipo, formato: 'pct:3', variacion: 'coste' });
    } else {
      avisos.unshift('Sin aplazamiento no hay financiación: el coste es solo el del servicio (no tiene sentido un coste efectivo anual).');
    }
    return {
      resultados,
      convenciones: {
        base: `Intereses del aplazamiento en ${v.base === 'ACT/365' ? 'Act/365' : 'Act/360'}; coste efectivo en base 365`,
        periodicidad: 'Un único pago aplazado',
        nominalEfectivo: 'Tipo nominal del aplazamiento; coste efectivo anual equivalente',
        comisiones: 'Incluidas: comisión del servicio y gastos fijos a cargo del cliente pagador',
      },
      avisos,
    };
  },
};
