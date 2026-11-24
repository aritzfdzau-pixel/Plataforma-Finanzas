import { tinATae, taeATin, cuotaFrancesa, tir, periodicoAAnual } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir, PERIODICIDADES, NOMBRE_PERIODICIDAD } from './_comun.js';

export default {
  id: 'tin-tae',
  titulo: 'Conversor TIN ↔ TAE',
  tituloIngles: 'Nominal rate ↔ APR',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/tin-tae.md',
  resumen: 'Convierte TIN y TAE; opcionalmente, TAE de un préstamo con comisión de apertura.',
  campos: [
    { id: 'sentido', etiqueta: 'Conversión', tipo: 'seleccion', defecto: 'TIN->TAE',
      opciones: [{ valor: 'TIN->TAE', etiqueta: 'De TIN a TAE' }, { valor: 'TAE->TIN', etiqueta: 'De TAE a TIN' }] },
    { id: 'tipo', etiqueta: 'Tipo de partida (TIN o TAE)', unidad: '%', tipo: 'porcentaje', defecto: '6,00' },
    { id: 'periodicidad', etiqueta: 'Liquidaciones al año', tipo: 'seleccion', defecto: '12', opciones: PERIODICIDADES },
    { id: 'comision', etiqueta: 'Comisión de apertura (solo TIN → TAE)', unidad: '%', tipo: 'porcentaje', defecto: '0,00' },
    { id: 'capital', etiqueta: 'Capital del préstamo (si hay comisión)', unidad: 'EUR', tipo: 'numero', defecto: '10.000' },
    { id: 'cuotas', etiqueta: 'Número de cuotas (si hay comisión)', tipo: 'entero', defecto: '36' },
  ],
  calcular(v) {
    const m = Number(v.periodicidad);
    exigir(Number.isFinite(v.tipo) && v.tipo > -1, 'Tipo no válido');
    noNegativo(v.comision, 'Comisión');
    const avisos = [];
    const resultados = [];
    if (v.sentido === 'TAE->TIN') {
      resultados.push({ id: 'tin', etiqueta: `TIN (${NOMBRE_PERIODICIDAD[m]})`, valor: taeATin(v.tipo, m), formato: 'pct:4', destacado: true });
      if (v.comision > 0) avisos.push('La comisión solo se tiene en cuenta en la conversión de TIN a TAE.');
    } else {
      resultados.push({ id: 'tae', etiqueta: 'TAE sin comisiones', valor: tinATae(v.tipo, m), formato: 'pct:4', destacado: true });
      if (v.comision > 0) {
        const capital = positivo(v.capital, 'Capital');
        const n = entero(v.cuotas, 'Número de cuotas');
        const cuota = cuotaFrancesa(capital, v.tipo / m, n);
        const flujos = [capital * (1 - v.comision), ...Array(n).fill(-cuota)];
        const r = tir(flujos);
        exigir(r.tir !== null, 'No se ha podido calcular la TAE con comisiones');
        resultados.push(
          { id: 'taeComision', etiqueta: 'TAE con comisión de apertura', valor: periodicoAAnual(r.tir, m), formato: 'pct:4', destacado: true },
          { id: 'cuota', etiqueta: 'Cuota (sistema francés)', valor: cuota, formato: 'eur' },
          { id: 'recibido', etiqueta: 'Importe neto recibido', valor: capital * (1 - v.comision), formato: 'eur' },
        );
        avisos.push('⚠️ Pendiente de verificar: la TAE con comisiones se calcula con periodos iguales (1/m de año); la normativa del Banco de España mide el tiempo en días/365, lo que puede dar diferencias mínimas.');
      }
    }
    return {
      resultados,
      convenciones: {
        base: 'Periodos iguales de 1/m año',
        periodicidad: `${m} liquidaciones al año`,
        nominalEfectivo: 'TIN nominal ↔ TAE efectiva anual',
        comisiones: v.comision > 0 && v.sentido === 'TIN->TAE' ? 'Comisión de apertura incluida' : 'Sin comisiones',
      },
      avisos,
    };
  },
};
