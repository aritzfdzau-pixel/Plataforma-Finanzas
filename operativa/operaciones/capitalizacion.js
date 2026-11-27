import { capitalFinal, tinATae } from '../lib/finanzas.js';
import { positivo, exigir, PERIODICIDADES, NOMBRE_PERIODICIDAD } from './_comun.js';

export default {
  id: 'capitalizacion',
  titulo: 'Interés simple, compuesto y continuo',
  tituloIngles: 'Simple, compound and continuous interest',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/capitalizacion-y-depositos.md',
  resumen: 'Compara el capital final con capitalización simple, compuesta (con su periodicidad) y continua.',
  campos: [
    { id: 'capital', etiqueta: 'Capital inicial', unidad: 'EUR', tipo: 'numero', defecto: '10.000' },
    { id: 'tipo', etiqueta: 'Tipo nominal anual', unidad: '%', tipo: 'porcentaje', defecto: '3,00' },
    { id: 'anios', etiqueta: 'Plazo', unidad: 'años', tipo: 'numero', defecto: '5' },
    { id: 'periodicidad', etiqueta: 'Capitalizaciones al año (compuesta)', tipo: 'seleccion', defecto: '1', opciones: PERIODICIDADES },
  ],
  calcular(v) {
    const C = positivo(v.capital, 'Capital');
    exigir(Number.isFinite(v.anios) && v.anios > 0 && v.anios <= 100, 'Plazo: entre 0 y 100 años');
    const m = Number(v.periodicidad);
    const simple = capitalFinal({ capital: C, tipo: v.tipo, anios: v.anios, regimen: 'simple' });
    const compuesto = capitalFinal({ capital: C, tipo: v.tipo, anios: v.anios, regimen: 'compuesto', m });
    const continuo = capitalFinal({ capital: C, tipo: v.tipo, anios: v.anios, regimen: 'continuo' });
    const filas = [];
    for (let k = 1; k <= Math.ceil(v.anios); k++) {
      const t = Math.min(k, v.anios);
      filas.push({
        anio: t,
        simple: capitalFinal({ capital: C, tipo: v.tipo, anios: t, regimen: 'simple' }),
        compuesto: capitalFinal({ capital: C, tipo: v.tipo, anios: t, regimen: 'compuesto', m }),
        continuo: capitalFinal({ capital: C, tipo: v.tipo, anios: t, regimen: 'continuo' }),
      });
    }
    const avisos = [];
    if (!Number.isInteger(v.anios * m)) avisos.push('El plazo no es un número entero de periodos: en compuesta se aplica la fórmula con exponente fraccionario (convenio exponencial).');
    return {
      resultados: [
        { id: 'compuesto', etiqueta: `Capital final, compuesta ${NOMBRE_PERIODICIDAD[m]}`, valor: compuesto, formato: 'eur', destacado: true },
        { id: 'simple', etiqueta: 'Capital final, simple', valor: simple, formato: 'eur' },
        { id: 'continuo', etiqueta: 'Capital final, continua', valor: continuo, formato: 'eur' },
        { id: 'interesesCompuesto', etiqueta: 'Intereses, compuesta', valor: compuesto - C, formato: 'eur', grupo: 'Intereses y diferencias' },
        { id: 'interesesSimple', etiqueta: 'Intereses, simple', valor: simple - C, formato: 'eur', grupo: 'Intereses y diferencias' },
        { id: 'interesDeIntereses', etiqueta: 'Intereses de los intereses (compuesta − simple)', valor: compuesto - simple, formato: 'eur', grupo: 'Intereses y diferencias' },
        { id: 'tae', etiqueta: `Tipo efectivo anual (compuesta ${NOMBRE_PERIODICIDAD[m]})`, valor: tinATae(v.tipo, m), formato: 'pct:4', grupo: 'Intereses y diferencias' },
        { id: 'taeContinua', etiqueta: 'Tipo efectivo anual (continua)', valor: Math.exp(v.tipo) - 1, formato: 'pct:4', grupo: 'Intereses y diferencias' },
      ],
      convenciones: {
        base: 'Años completos (o fracción de año)',
        periodicidad: `Compuesta: ${m} capitalizaciones al año; continua: límite con infinitas`,
        nominalEfectivo: 'Tipo nominal anual; se muestra el efectivo equivalente',
        comisiones: 'Sin comisiones ni impuestos',
      },
      avisos,
      tabla: {
        nombreCsv: 'capitalizacion.csv',
        columnas: [
          { id: 'anio', etiqueta: 'Año', formato: 'num:2' },
          { id: 'simple', etiqueta: 'Simple', formato: 'num:2' },
          { id: 'compuesto', etiqueta: 'Compuesta', formato: 'num:2' },
          { id: 'continuo', etiqueta: 'Continua', formato: 'num:2' },
        ],
        filas,
      },
    };
  },
};
