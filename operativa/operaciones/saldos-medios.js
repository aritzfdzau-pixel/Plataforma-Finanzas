import { liquidacionCuenta, redondear } from '../lib/finanzas.js';
import { leerFecha, leerNumero, diasEntre } from '../../web/js/lib/formato.js';
import { fechaEs } from '../../web/js/lib/divisas.js';
import { exigir, noNegativo, leerMovimientos, BASES_OPCIONES } from './_comun.js';

const sumarDias = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/**
 * Saldos «fecha; saldo» (saldo vigente desde esa fecha, incluida) → movimientos equivalentes:
 * cada importe es la diferencia con el saldo anterior. Si hay varios saldos el mismo día, vale el último.
 */
export function movimientosDesdeSaldos(saldoInicial, saldos) {
  let anterior = saldoInicial;
  return saldos.map((s) => { const m = { ...s, importe: s.saldo - anterior }; anterior = s.saldo; return m; });
}

const EJEMPLO_MOVIMIENTOS = '15/01/2026; 3.000\n10/02/2026; -9.000\n01/03/2026; 4.000';
const EJEMPLO_SALDOS = '15/01/2026; 8.000\n10/02/2026; -1.000\n01/03/2026; 3.000';

export default {
  id: 'saldos-medios',
  titulo: 'Saldo medio y liquidación de una cuenta',
  tituloIngles: 'Average balance and account interest',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/saldos-medios-y-liquidacion-de-cuentas.md',
  resumen: 'Saldo medio diario, números comerciales e intereses acreedores y deudores de un periodo (método hamburgués). Admite un extracto en Excel o CSV.',
  importador: 'extracto',
  campos: [
    { id: 'desde', etiqueta: 'Inicio del periodo', tipo: 'fecha', defecto: '01/01/2026', grupo: 'Periodo y datos' },
    { id: 'hasta', etiqueta: 'Fin del periodo (incluido)', tipo: 'fecha', defecto: '31/03/2026', grupo: 'Periodo y datos' },
    { id: 'entrada', etiqueta: 'Datos de la cuenta', tipo: 'seleccion', defecto: 'movimientos', grupo: 'Periodo y datos',
      opciones: [{ valor: 'movimientos', etiqueta: 'Movimientos (fecha valor; importe)' }, { valor: 'saldos', etiqueta: 'Saldos (fecha; saldo desde ese día)' }] },
    { id: 'saldoInicial', etiqueta: 'Saldo antes del primer dato', unidad: 'EUR', tipo: 'numero', defecto: '5.000', grupo: 'Periodo y datos',
      ayuda: 'Saldo de la cuenta antes de la primera línea de la lista.' },
    { id: 'movimientos', etiqueta: 'Movimientos (fecha valor; importe)', tipo: 'lineas', filas: 7, grupo: 'Periodo y datos', defecto: EJEMPLO_MOVIMIENTOS,
      visibleSi: { campo: 'entrada', valor: 'movimientos' },
      ayuda: 'Una línea por movimiento; cargos en negativo. Se puede añadir un concepto tras otro «;» (se ignora).' },
    { id: 'saldos', etiqueta: 'Saldos (fecha; saldo desde ese día)', tipo: 'lineas', filas: 7, grupo: 'Periodo y datos', defecto: EJEMPLO_SALDOS,
      visibleSi: { campo: 'entrada', valor: 'saldos' },
      ayuda: 'Una línea por cada cambio de saldo (o un saldo por día). Si un día se repite, vale el último.' },
    { id: 'conAcreedor', etiqueta: 'Aplicar intereses acreedores (saldos a favor)', tipo: 'casilla', defecto: 'si', grupo: 'Condiciones' },
    { id: 'tipoAcreedor', etiqueta: 'Tipo acreedor', unidad: '% anual', tipo: 'porcentaje', defecto: '1,00', grupo: 'Condiciones', visibleSi: { campo: 'conAcreedor', valor: 'si' } },
    { id: 'conDeudor', etiqueta: 'Aplicar intereses deudores (descubiertos)', tipo: 'casilla', defecto: 'si', grupo: 'Condiciones' },
    { id: 'tipoDeudor', etiqueta: 'Tipo deudor', unidad: '% anual', tipo: 'porcentaje', defecto: '7,00', grupo: 'Condiciones', visibleSi: { campo: 'conDeudor', valor: 'si' } },
    { id: 'conRetencion', etiqueta: 'Aplicar retención sobre los intereses acreedores', tipo: 'casilla', defecto: 'si', grupo: 'Condiciones' },
    { id: 'retencion', etiqueta: 'Retención', unidad: '%', tipo: 'porcentaje', defecto: '19,00', grupo: 'Condiciones', visibleSi: { campo: 'conRetencion', valor: 'si' },
      ayuda: 'Retención a cuenta del IRPF sobre rendimientos del capital mobiliario; comprueba el tipo vigente.' },
    { id: 'base', etiqueta: 'Base de cálculo', tipo: 'seleccion', defecto: 'ACT/365', opciones: BASES_OPCIONES, grupo: 'Condiciones' },
  ],
  calcular(v) {
    const dias = diasEntre(v.desde, v.hasta) + 1;
    exigir(dias >= 1, 'El fin del periodo debe ser igual o posterior al inicio');
    exigir(dias <= 3660, 'El periodo no puede superar 10 años');
    // Lo que no está marcado no se aplica (tipo 0 / sin retención).
    const tipoAcreedor = v.conAcreedor ? v.tipoAcreedor : 0;
    const tipoDeudor = v.conDeudor ? v.tipoDeudor : 0;
    const tasaRetencion = v.conAcreedor && v.conRetencion ? noNegativo(v.retencion, 'Retención') : 0;
    const porSaldos = v.entrada === 'saldos';
    const lineas = leerMovimientos(porSaldos ? v.saldos : v.movimientos, leerFecha, leerNumero)
      .map((m) => ({ ...m, dia: diasEntre(v.desde, m.fecha) }));
    // Orden por fecha estable: dentro de un día se respeta el orden escrito.
    lineas.sort((a, b) => a.dia - b.dia);
    const movs = porSaldos ? movimientosDesdeSaldos(v.saldoInicial, lineas.map((l) => ({ ...l, saldo: l.importe }))) : lineas;

    // Lo anterior al periodo forma el saldo de apertura; lo posterior se ignora.
    const antes = movs.filter((m) => m.dia < 0);
    const despues = movs.filter((m) => m.dia >= dias);
    const dentro = movs.filter((m) => m.dia >= 0 && m.dia < dias);
    const apertura = v.saldoInicial + antes.reduce((s, m) => s + m.importe, 0);
    const r = liquidacionCuenta({ saldoInicial: apertura, movimientos: dentro, dias, tipoAcreedor, tipoDeudor, base: v.base, retencion: tasaRetencion });

    // Liquidación como en un extracto: cada importe se redondea al céntimo (P-008).
    const brutos = redondear(r.interesesAcreedores);
    const retencion = redondear(brutos * tasaRetencion);
    const deudores = redondear(r.interesesDeudores);
    const liquidacion = redondear(brutos - retencion - deudores);

    const avisos = [];
    if (antes.length) avisos.push(`${antes.length} ${porSaldos ? 'saldos' : 'movimientos'} anteriores al ${fechaEs(v.desde)} forman el saldo de apertura: ${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(apertura)} €.`);
    if (despues.length) avisos.push(`${despues.length} ${porSaldos ? 'saldos' : 'movimientos'} posteriores al ${fechaEs(v.hasta)} quedan fuera del periodo y no se tienen en cuenta.`);
    if (!v.conAcreedor && !v.conDeudor) avisos.push('No se aplica ningún tipo: solo se calculan el saldo medio y los números comerciales.');
    if (r.numerosDeudores > 0 && v.conDeudor) avisos.push('Hay días en descubierto: además de los intereses deudores, la entidad puede cobrar una comisión de descubierto (no incluida). En cuentas de consumidores la TAE del descubierto tiene un límite legal (Ley 16/2011 de crédito al consumo).');
    if (!dentro.length) avisos.push('Ningún dato dentro del periodo: el saldo es constante todos los días.');
    return {
      resultados: [
        { id: 'saldoMedio', etiqueta: 'Saldo medio diario', valor: r.saldoMedio, formato: 'eur', destacado: true },
        { id: 'dias', etiqueta: 'Días del periodo', valor: r.dias, formato: 'entero' },
        { id: 'saldoApertura', etiqueta: 'Saldo al inicio del periodo', valor: apertura, formato: 'eur' },
        { id: 'saldoFinal', etiqueta: 'Saldo al final (sin la liquidación)', valor: r.saldoFinal, formato: 'eur' },
        { id: 'saldoMedioAcreedor', etiqueta: 'Saldo medio acreedor (números acreedores / días)', valor: r.saldoMedioAcreedor, formato: 'eur', grupo: 'Números comerciales' },
        { id: 'saldoMedioDeudor', etiqueta: 'Saldo medio deudor (números deudores / días)', valor: r.saldoMedioDeudor, formato: 'eur', grupo: 'Números comerciales' },
        { id: 'numerosAcreedores', etiqueta: 'Números acreedores (saldo × días)', valor: r.numerosAcreedores, formato: 'num:0', grupo: 'Números comerciales' },
        { id: 'numerosDeudores', etiqueta: 'Números deudores (saldo × días)', valor: r.numerosDeudores, formato: 'num:0', grupo: 'Números comerciales' },
        { id: 'diasDescubierto', etiqueta: 'Días en descubierto', valor: r.tramos.filter((t) => t.saldo < 0).reduce((s, t) => s + t.dias, 0), formato: 'entero', grupo: 'Números comerciales' },
        ...(v.conAcreedor ? [{ id: 'interesesAcreedores', etiqueta: 'Intereses acreedores brutos', valor: brutos, formato: 'eur', grupo: 'Liquidación' }] : []),
        ...(v.conAcreedor && v.conRetencion ? [
          { id: 'retencion', etiqueta: 'Retención', valor: -retencion, formato: 'eur', grupo: 'Liquidación' },
          { id: 'interesesNetos', etiqueta: 'Intereses acreedores netos', valor: brutos - retencion, formato: 'eur', grupo: 'Liquidación' }] : []),
        ...(v.conDeudor ? [{ id: 'interesesDeudores', etiqueta: 'Intereses deudores', valor: -deudores, formato: 'eur', grupo: 'Liquidación' }] : []),
        ...(v.conAcreedor || v.conDeudor ? [{ id: 'liquidacion', etiqueta: 'Liquidación neta del periodo', valor: liquidacion, formato: 'eur', grupo: 'Liquidación', destacado: true }] : []),
      ],
      convenciones: {
        base: `${v.base === 'ACT/360' ? 'Act/360' : 'Act/365'}; días naturales con el inicio y el fin incluidos; cada dato cuenta desde su fecha (fecha valor)`,
        periodicidad: `Una liquidación al final del periodo (${r.dias} días); importes redondeados al céntimo`,
        nominalEfectivo: [v.conAcreedor ? 'tipo acreedor aplicado' : 'sin tipo acreedor', v.conDeudor ? 'tipo deudor aplicado' : 'sin tipo deudor',
          v.conAcreedor && v.conRetencion ? 'con retención' : 'sin retención'].join(' · ') + ' (tipos nominales anuales, interés simple)',
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
