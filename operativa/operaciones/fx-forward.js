import { forwardParidad, fraccionAnio } from '../lib/finanzas.js';
import { positivo, entero, exigir } from './_comun.js';

// Base del mercado monetario de cada divisa (tipo de referencia a un día entre paréntesis).
// Verificadas (D-021): USD (SOFR) Act/360, GBP (SONIA) Act/365, JPY (TONA) Act/365,
// CHF (SARON) Act/360, AUD (AONIA/BBSW, ASX y AFMA) Act/365, CAD (CORRA, Banco de Canadá)
// Act/365, HKD (HONIA) Act/365.
// ⚠️ Pendiente de verificar: CNY (SHIBOR) Act/360 y NZD (BKBM) Act/365 — ver BASES_SIN_VERIFICAR.
export const BASE_POR_DIVISA = {
  USD: 'ACT/360', GBP: 'ACT/365', JPY: 'ACT/365', CHF: 'ACT/360', CNY: 'ACT/360',
  AUD: 'ACT/365', CAD: 'ACT/365', HKD: 'ACT/365', NZD: 'ACT/365',
};
export const BASES_SIN_VERIFICAR = Object.freeze(['CNY', 'NZD']);

export default {
  id: 'fx-forward',
  titulo: 'Seguro de cambio (forward)',
  tituloIngles: 'FX forward',
  categoria: 'fx',
  ficha: 'conocimiento/fx/seguro-de-cambio.md',
  resumen: 'Tipo a plazo teórico por paridad cubierta de tipos de interés.',
  campos: [
    { id: 'par', etiqueta: 'Par (unidades de divisa por 1 EUR)', tipo: 'seleccion', defecto: 'USD',
      opciones: [
        ...Object.keys(BASE_POR_DIVISA).map((c) => ({ valor: c, etiqueta: `EUR/${c}` })),
        { valor: 'OTRA', etiqueta: 'Otra divisa' },
      ] },
    { id: 'spot', etiqueta: 'Tipo de contado (spot)', tipo: 'numero', defecto: '1,0850',
      ayuda: 'Se precarga con la referencia BCE; para cotizar, usa el spot de mercado.',
      rellenarCon: { fuente: 'bce', divisa: 'par' } },
    { id: 'dias', etiqueta: 'Plazo', unidad: 'días', tipo: 'entero', defecto: '90' },
    { id: 'tipoEur', etiqueta: 'Tipo del euro al plazo', unidad: '%', tipo: 'porcentaje', defecto: '3,00',
      ayuda: 'Referencia: €STR (o su equivalente al plazo). Act/360.' },
    { id: 'tipoDivisa', etiqueta: 'Tipo de la divisa al plazo', unidad: '%', tipo: 'porcentaje', defecto: '4,50',
      ayuda: 'El de la divisa elegida (p. ej. SOFR para USD, SONIA para GBP, TONA para JPY), al mismo plazo.' },
    { id: 'baseDivisa', etiqueta: 'Base de la divisa', tipo: 'seleccion', defecto: 'AUTO',
      opciones: [
        { valor: 'AUTO', etiqueta: 'Según la divisa' },
        { valor: 'ACT/360', etiqueta: 'Act/360' }, { valor: 'ACT/365', etiqueta: 'Act/365' },
      ] },
    { id: 'importe', etiqueta: 'Importe a cubrir', unidad: 'EUR', tipo: 'numero', defecto: '100.000' },
  ],
  calcular(v) {
    const spot = positivo(v.spot, 'Spot');
    const dias = entero(v.dias, 'Plazo');
    const importe = positivo(v.importe, 'Importe');
    exigir(v.tipoEur > -1 && v.tipoDivisa > -1, 'Tipos de interés no válidos');
    const avisos = [
      'El €STR es un tipo a un día: para un plazo usa un tipo a ese plazo (p. ej. €STR compuesto u OIS).',
      'Si el spot es la referencia BCE (precargada), el resultado es orientativo: esa referencia no es un precio negociable.',
    ];
    let baseDivisa = v.baseDivisa;
    if (baseDivisa === 'AUTO') {
      baseDivisa = BASE_POR_DIVISA[v.par] ?? 'ACT/360';
      if (!BASE_POR_DIVISA[v.par]) avisos.push('⚠️ Pendiente de verificar: base Act/360 supuesta para esta divisa.');
      else if (BASES_SIN_VERIFICAR.includes(v.par)) avisos.push(`⚠️ Pendiente de verificar: base ${baseDivisa === 'ACT/365' ? 'Act/365' : 'Act/360'} del ${v.par} (fuentes contradictorias o indirectas). Puedes forzarla en «Base de la divisa».`);
    }
    const codigo = v.par === 'OTRA' ? 'DIV' : v.par;
    const dec = codigo === 'JPY' ? 2 : 4;
    const pip = codigo === 'JPY' ? 100 : 10000;
    const forward = forwardParidad({ spot, tipoEur: v.tipoEur, tipoDivisa: v.tipoDivisa, dias, baseEur: 'ACT/360', baseDivisa });
    const puntos = (forward - spot) * pip;
    return {
      resultados: [
        { id: 'forward', etiqueta: `Tipo a plazo (forward) EUR/${codigo}`, valor: forward, formato: `num:${dec + 2}`, destacado: true },
        { id: 'puntos', etiqueta: 'Puntos swap (forward − spot)', valor: puntos, formato: 'num:2', variacion: true,
          nota: puntos >= 0 ? 'El euro cotiza con prima a plazo.' : 'El euro cotiza con descuento a plazo.' },
        { id: 'contravalorPlazo', etiqueta: 'Contravalor al plazo', valor: importe * forward, formato: `divisa:${codigo}:2` },
        { id: 'contravalorSpot', etiqueta: 'Contravalor al contado', valor: importe * spot, formato: `divisa:${codigo}:2` },
        { id: 'fraccion', etiqueta: 'Fracción de año (euro)', valor: fraccionAnio(dias, 'ACT/360'), formato: 'num:6' },
      ],
      convenciones: {
        base: `EUR Act/360 · ${codigo} ${baseDivisa === 'ACT/365' ? 'Act/365' : 'Act/360'}`,
        periodicidad: 'Interés simple al plazo (sin capitalización)',
        nominalEfectivo: 'Tipos nominales anuales',
        comisiones: 'Precio teórico sin margen del banco ni comisiones',
      },
      avisos,
    };
  },
};
