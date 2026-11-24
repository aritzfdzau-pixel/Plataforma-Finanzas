import { van, tir, cambiosDeSigno } from '../lib/finanzas.js';
import { exigir } from './_comun.js';

export default {
  id: 'van-tir',
  titulo: 'VAN y TIR',
  tituloIngles: 'NPV & IRR',
  categoria: 'bolsa-inversion',
  ficha: 'conocimiento/bolsa-inversion/van-tir.md',
  resumen: 'Valor actual neto y tasa interna de rentabilidad de una serie de flujos.',
  campos: [
    { id: 'flujos', etiqueta: 'Flujos de caja (el primero en t = 0)', tipo: 'serie',
      defecto: '-1000\n300\n400\n500', ayuda: 'Un flujo por línea; pagos en negativo. Periodos iguales.' },
    { id: 'tasa', etiqueta: 'Tasa de descuento por periodo', unidad: '%', tipo: 'porcentaje', defecto: '8,00' },
  ],
  calcular(v) {
    const f = v.flujos;
    exigir(Array.isArray(f) && f.length >= 2, 'Se necesitan al menos 2 flujos');
    exigir(Number.isFinite(v.tasa) && v.tasa > -1, 'Tasa no válida');
    const resVan = van(v.tasa, f);
    const r = tir(f);
    const cambios = cambiosDeSigno(f);
    const avisos = [];
    if (cambios > 1) avisos.push(`Los flujos cambian ${cambios} veces de signo: puede haber varias TIR. Se muestra una de ellas.`);
    if (r.tir === null) avisos.push(r.motivo);
    const resultados = [
      { id: 'van', etiqueta: 'VAN (NPV)', valor: resVan, formato: 'num:2', variacion: true, destacado: true },
      { id: 'tir', etiqueta: 'TIR (IRR) por periodo', valor: r.tir ?? NaN, formato: 'pct:4', destacado: true },
      { id: 'metodo', etiqueta: 'Método de cálculo de la TIR', valor: r.tir === null ? '—' : `${r.metodo} (${r.iteraciones} iteraciones)`, formato: 'texto' },
      { id: 'cambios', etiqueta: 'Cambios de signo', valor: cambios, formato: 'entero' },
    ];
    return {
      resultados,
      convenciones: {
        base: 'Periodos iguales; el primer flujo no se descuenta',
        periodicidad: 'La de los flujos (p. ej. anual): la TIR es por periodo',
        nominalEfectivo: 'Tasa efectiva por periodo',
        comisiones: 'Inclúyelas como flujos si existen',
      },
      avisos,
    };
  },
};
