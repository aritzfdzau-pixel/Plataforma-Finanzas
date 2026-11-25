import { periodosMedios, necesidadesOperativas } from '../lib/finanzas.js';
import { positivo, noNegativo, exigir } from './_comun.js';

export default {
  id: 'circulante-nof',
  titulo: 'Circulante: periodos medios y NOF',
  tituloIngles: 'Working capital: cash conversion cycle and operating needs',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/circulante-nof.md',
  resumen: 'PMC (alias PMR), PMP, PMA, ciclo de maduración y de caja; NOF frente al fondo de maniobra.',
  campos: [
    { id: 'ventas', etiqueta: 'Ventas del periodo (sin IVA)', unidad: 'EUR', tipo: 'numero', defecto: '2.400.000', grupo: 'Cuenta de resultados' },
    { id: 'compras', etiqueta: 'Compras del periodo (sin IVA)', unidad: 'EUR', tipo: 'numero', defecto: '1.500.000', grupo: 'Cuenta de resultados' },
    { id: 'costeVentas', etiqueta: 'Coste de ventas (COGS)', unidad: 'EUR', tipo: 'numero', defecto: '1.600.000', grupo: 'Cuenta de resultados' },
    { id: 'dias', etiqueta: 'Días del periodo', unidad: 'días', tipo: 'entero', defecto: '365', grupo: 'Cuenta de resultados' },
    { id: 'clientes', etiqueta: 'Saldo medio de clientes (receivables)', unidad: 'EUR', tipo: 'numero', defecto: '480.000', grupo: 'Balance (saldos medios)' },
    { id: 'proveedores', etiqueta: 'Saldo medio de proveedores (payables)', unidad: 'EUR', tipo: 'numero', defecto: '300.000', grupo: 'Balance (saldos medios)' },
    { id: 'existencias', etiqueta: 'Saldo medio de existencias (inventory)', unidad: 'EUR', tipo: 'numero', defecto: '250.000', grupo: 'Balance (saldos medios)' },
    { id: 'conIva', etiqueta: 'Los saldos de clientes y proveedores incluyen IVA', tipo: 'casilla', defecto: 'no', grupo: 'Balance (saldos medios)',
      ayuda: 'En el balance suelen incluirlo; en la cuenta de resultados, no. Se homogeneiza dividiendo el saldo entre (1 + IVA).' },
    { id: 'iva', etiqueta: 'Tipo de IVA', unidad: '%', tipo: 'porcentaje', defecto: '21', grupo: 'Balance (saldos medios)', visibleSi: { campo: 'conIva', valor: 'si' } },
    { id: 'tesoreriaOperativa', etiqueta: 'Tesorería operativa mínima (opcional)', unidad: 'EUR', tipo: 'numero', defecto: '0', grupo: 'NOF y fondo de maniobra' },
    { id: 'otrosAcreedores', etiqueta: 'Otros acreedores operativos (opcional: Hacienda, Seguridad Social, salarios)', unidad: 'EUR', tipo: 'numero', defecto: '0', grupo: 'NOF y fondo de maniobra' },
    { id: 'fondoManiobra', etiqueta: 'Fondo de maniobra (working capital) = AC − PC', unidad: 'EUR', tipo: 'numero', defecto: '300.000', grupo: 'NOF y fondo de maniobra' },
  ],
  calcular(v) {
    positivo(v.ventas, 'Ventas'); positivo(v.compras, 'Compras'); positivo(v.costeVentas, 'Coste de ventas');
    positivo(v.dias, 'Días del periodo');
    noNegativo(v.clientes, 'Clientes'); noNegativo(v.proveedores, 'Proveedores'); noNegativo(v.existencias, 'Existencias');
    noNegativo(v.tesoreriaOperativa, 'Tesorería operativa'); noNegativo(v.otrosAcreedores, 'Otros acreedores');
    exigir(Number.isFinite(v.fondoManiobra), 'Fondo de maniobra: introduce un valor');
    const iva = v.conIva ? noNegativo(v.iva, 'IVA') : 0;
    const p = periodosMedios({ ventas: v.ventas, compras: v.compras, costeVentas: v.costeVentas, clientes: v.clientes,
      proveedores: v.proveedores, existencias: v.existencias, dias: v.dias, iva });
    const nof = necesidadesOperativas({ existencias: v.existencias, clientes: v.clientes, proveedores: v.proveedores,
      tesoreriaOperativa: v.tesoreriaOperativa, otrosAcreedores: v.otrosAcreedores });
    const diferencia = v.fondoManiobra - nof;
    const estado = diferencia >= 0
      ? { nivel: 'ok', texto: 'exceso de financiación del circulante' }
      : { nivel: 'alto', texto: 'déficit de financiación del circulante' };
    const avisos = [];
    if (p.cicloCaja < 0) avisos.push('Ciclo de caja negativo: los proveedores financian más que el ciclo de maduración (habitual en distribución minorista).');
    if (diferencia >= 0) avisos.push('El fondo de maniobra cubre las NOF. Un exceso grande puede indicar tesorería ociosa o financiación a largo plazo que no se usa en el circulante.');
    else avisos.push('El déficit se suele cubrir con pólizas de crédito, descuento, factoring o confirming: es financiación a corto que hay que renovar.');
    avisos.push('Los saldos medios dan mejores periodos que los de cierre (el cierre puede estar afectado por la estacionalidad).');
    if (v.conIva) avisos.push('⚠️ Pendiente de verificar: se supone que todas las ventas y compras llevan el mismo tipo de IVA (exportaciones y operaciones exentas no lo llevan).');
    return {
      resultados: [
        { id: 'cicloCaja', etiqueta: 'Ciclo de caja (cash conversion cycle) = PMA + PMC − PMP', valor: p.cicloCaja, formato: 'dias:1', destacado: true },
        { id: 'nof', etiqueta: 'NOF (necesidades operativas de fondos)', valor: nof, formato: 'eur', destacado: true },
        { id: 'diferencia', etiqueta: 'Fondo de maniobra − NOF', valor: diferencia, formato: 'eur', estado },
        { grupo: 'Periodos medios', id: 'pmc', etiqueta: 'PMC: periodo medio de cobro (DSO; alias PMR)', valor: p.pmc, formato: 'dias:1' },
        { grupo: 'Periodos medios', id: 'pmp', etiqueta: 'PMP: periodo medio de pago (DPO)', valor: p.pmp, formato: 'dias:1' },
        { grupo: 'Periodos medios', id: 'pma', etiqueta: 'PMA: periodo medio de almacenamiento (DIO)', valor: p.pma, formato: 'dias:1' },
        { grupo: 'Periodos medios', id: 'cicloMaduracion', etiqueta: 'Ciclo de maduración (operating cycle) = PMA + PMC', valor: p.cicloMaduracion, formato: 'dias:1' },
        { grupo: 'NOF y fondo de maniobra', id: 'fondoManiobra', etiqueta: 'Fondo de maniobra (working capital)', valor: v.fondoManiobra, formato: 'eur' },
        { grupo: 'NOF y fondo de maniobra', id: 'nofDetalle', etiqueta: 'NOF = existencias + clientes + tesorería operativa − proveedores − otros acreedores', valor: nof, formato: 'eur' },
      ],
      convenciones: {
        base: `Periodo de ${v.dias} días; saldos medios del periodo`,
        periodicidad: 'Un periodo (normalmente el ejercicio)',
        nominalEfectivo: v.conIva ? 'Saldos de clientes y proveedores sin IVA para los periodos; con IVA en las NOF (son los saldos reales)' : 'Saldos tal como se introducen (sin ajuste de IVA)',
        comisiones: 'No aplica',
      },
      avisos,
    };
  },
};
