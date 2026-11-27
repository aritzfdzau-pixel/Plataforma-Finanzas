import { liquidacionCuenta } from '../lib/finanzas.js';
import { leerFecha, leerNumero, diasEntre } from '../../web/js/lib/formato.js';
import { fechaEs } from '../../web/js/lib/divisas.js';
import { exigir, noNegativo, leerMovimientos, BASES_OPCIONES } from './_comun.js';

const sumarDias = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export default {
  id: 'saldos-medios',
  titulo: 'Saldo medio y liquidación de una cuenta',
  tituloIngles: 'Average balance and account interest',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/saldos-medios-y-liquidacion-de-cuentas.md',
  resumen: 'Saldo medio diario, números comerciales e intereses acreedores y deudores de un periodo (método hamburgués).',
  campos: [
    { id: 'desde', etiqueta: 'Inicio del periodo', tipo: 'fecha', defecto: '01/01/2026', grupo: 'Periodo y saldo' },
    { id: 'hasta', etiqueta: 'Fin del periodo (incluido)', tipo: 'fecha', defecto: '31/03/2026', grupo: 'Periodo y saldo' },
    { id: 'saldoInicial', etiqueta: 'Saldo al inicio', unidad: 'EUR', tipo: 'numero', defecto: '5.000', grupo: 'Periodo y saldo' },
    { id: 'movimientos', etiqueta: 'Movimientos (fecha valor; importe; concepto)', tipo: 'lineas', filas: 7, grupo: 'Periodo y saldo',
      defecto: '15/01/2026; 3.000; Abono (ejemplo)\n10/02/2026; -9.000; Cargo (ejemplo)\n01/03/2026; 4.000; Abono (ejemplo)',
      ayuda: 'Una línea por movimiento; los cargos en negativo. Datos inventados: no pegues movimientos de clientes.' },
    { id: 'tipoAcreedor', etiqueta: 'Tipo acreedor (saldos a favor)', unidad: '% anual', tipo: 'porcentaje', defecto: '1,00', grupo: 'Condiciones' },
    { id: 'tipoDeudor', etiqueta: 'Tipo deudor (descubiertos)', unidad: '% anual', tipo: 'porcentaje', defecto: '7,00', grupo: 'Condiciones' },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/365', opciones: BASES_OPCIONES, grupo: 'Condiciones' },
    { id: 'retencion', etiqueta: 'Retención sobre intereses acreedores', unidad: '%', tipo: 'porcentaje', defecto: '19,00', grupo: 'Condiciones',
      ayuda: 'Retención a cuenta del IRPF sobre rendimientos del capital mobiliario; comprueba el tipo vigente.' },
  ],
  calcular(v) {
    const dias = diasEntre(v.desde, v.hasta) + 1;
    exigir(dias >= 1, 'El fin del periodo debe ser igual o posterior al inicio');
    noNegativo(v.retencion, 'Retención');
    const movs = leerMovimientos(v.movimientos, leerFecha, leerNumero).map((m) => {
      const dia = diasEntre(v.desde, m.fecha);
      exigir(dia >= 0 && dia < dias, `Línea ${m.linea}: la fecha ${fechaEs(m.fecha)} está fuera del periodo`);
      return { ...m, dia };
    });
    const r = liquidacionCuenta({ saldoInicial: v.saldoInicial, movimientos: movs, dias, tipoAcreedor: v.tipoAcreedor, tipoDeudor: v.tipoDeudor, base: v.base, retencion: v.retencion });
    const avisos = [];
    if (r.numerosDeudores > 0) avisos.push('Hay días en descubierto: además de los intereses deudores, la entidad puede cobrar una comisión de descubierto (no incluida). En cuentas de consumidores la TAE del descubierto tiene un límite legal (Ley 16/2011 de crédito al consumo).');
    if (!movs.length) avisos.push('Sin movimientos: el saldo es constante en todo el periodo.');
    return {
      resultados: [
        { id: 'saldoMedio', etiqueta: 'Saldo medio diario', valor: r.saldoMedio, formato: 'eur', destacado: true },
        { id: 'dias', etiqueta: 'Días del periodo', valor: r.dias, formato: 'entero' },
        { id: 'saldoFinal', etiqueta: 'Saldo al final (sin la liquidación)', valor: r.saldoFinal, formato: 'eur' },
        { id: 'saldoMedioAcreedor', etiqueta: 'Saldo medio acreedor (solo días a favor)', valor: r.saldoMedioAcreedor, formato: 'eur', grupo: 'Números comerciales' },
        { id: 'saldoMedioDeudor', etiqueta: 'Saldo medio deudor (solo días en descubierto)', valor: r.saldoMedioDeudor, formato: 'eur', grupo: 'Números comerciales' },
        { id: 'numerosAcreedores', etiqueta: 'Números acreedores (saldo × días)', valor: r.numerosAcreedores, formato: 'num:0', grupo: 'Números comerciales' },
        { id: 'numerosDeudores', etiqueta: 'Números deudores (saldo × días)', valor: r.numerosDeudores, formato: 'num:0', grupo: 'Números comerciales' },
        { id: 'interesesAcreedores', etiqueta: 'Intereses acreedores brutos', valor: r.interesesAcreedores, formato: 'eur', grupo: 'Liquidación' },
        { id: 'retencion', etiqueta: 'Retención', valor: -r.retencion, formato: 'eur', grupo: 'Liquidación' },
        { id: 'interesesNetos', etiqueta: 'Intereses acreedores netos', valor: r.interesesNetos, formato: 'eur', grupo: 'Liquidación' },
        { id: 'interesesDeudores', etiqueta: 'Intereses deudores', valor: -r.interesesDeudores, formato: 'eur', grupo: 'Liquidación' },
        { id: 'liquidacion', etiqueta: 'Liquidación neta del periodo', valor: r.liquidacion, formato: 'eur', grupo: 'Liquidación', destacado: true },
      ],
      convenciones: {
        base: `${v.base === 'ACT/360' ? 'Act/360' : 'Act/365'}; días naturales, el día del movimiento cuenta con el saldo nuevo (fecha valor)`,
        periodicidad: `Una liquidación al final del periodo (${r.dias} días)`,
        nominalEfectivo: 'Tipos nominales anuales, interés simple',
        comisiones: 'No incluidas (mantenimiento, descubierto)',
      },
      avisos,
      tabla: {
        nombreCsv: 'saldos-medios.csv',
        columnas: [
          { id: 'desde', etiqueta: 'Desde', formato: 'texto' },
          { id: 'hasta', etiqueta: 'Hasta', formato: 'texto' },
          { id: 'dias', etiqueta: 'Días', formato: 'entero' },
          { id: 'saldo', etiqueta: 'Saldo', formato: 'num:2' },
          { id: 'numeros', etiqueta: 'Números', formato: 'num:0' },
        ],
        filas: r.tramos.map((t) => ({ desde: fechaEs(sumarDias(v.desde, t.desde)), hasta: fechaEs(sumarDias(v.desde, t.hasta - 1)), dias: t.dias, saldo: t.saldo, numeros: t.numeros })),
      },
    };
  },
};
