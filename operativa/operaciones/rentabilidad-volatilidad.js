import { rentabilidadesSimples, rentabilidadesLog, media, varianzaMuestral, desviacionMuestral, volatilidadAnualizada } from '../lib/finanzas.js';
import { exigir } from './_comun.js';

export default {
  id: 'rentabilidad-volatilidad',
  titulo: 'Rentabilidad, varianza y volatilidad anualizada',
  tituloIngles: 'Returns & volatility',
  categoria: 'bolsa-inversion',
  ficha: 'conocimiento/bolsa-inversion/rentabilidad-volatilidad.md',
  resumen: 'Rentabilidades simples y logarítmicas de una serie de precios pegada.',
  campos: [
    { id: 'precios', etiqueta: 'Serie de precios (del más antiguo al más reciente)', tipo: 'serie',
      defecto: '100\n102\n101\n105\n104\n108', ayuda: 'Un precio por línea (o separados por «;»). Decimales con coma o punto.' },
    { id: 'periodosAnio', etiqueta: 'Frecuencia de la serie', tipo: 'seleccion', defecto: '252',
      opciones: [{ valor: '252', etiqueta: 'Diaria (252 sesiones/año)' }, { valor: '52', etiqueta: 'Semanal (52/año)' }, { valor: '12', etiqueta: 'Mensual (12/año)' }] },
  ],
  calcular(v) {
    const p = v.precios;
    exigir(Array.isArray(p) && p.length >= 3, 'Se necesitan al menos 3 precios (2 rentabilidades)');
    exigir(p.every((x) => x > 0), 'Todos los precios deben ser positivos');
    const n = Number(v.periodosAnio);
    const s = rentabilidadesSimples(p);
    const l = rentabilidadesLog(p);
    return {
      resultados: [
        { id: 'total', etiqueta: 'Rentabilidad total del periodo', valor: p.at(-1) / p[0] - 1, formato: 'pct:2', variacion: true },
        { id: 'volLog', etiqueta: 'Volatilidad anualizada (log)', valor: volatilidadAnualizada(l, n), formato: 'pct:2', destacado: true },
        { id: 'volSimple', etiqueta: 'Volatilidad anualizada (simple)', valor: volatilidadAnualizada(s, n), formato: 'pct:2' },
        { id: 'mediaSimple', etiqueta: 'Media de rentabilidades simples', valor: media(s), formato: 'pct:4' },
        { id: 'mediaLog', etiqueta: 'Media de rentabilidades log', valor: media(l), formato: 'pct:4' },
        { id: 'varLog', etiqueta: 'Varianza muestral (log)', valor: varianzaMuestral(l), formato: 'num:8' },
        { id: 'sdLog', etiqueta: 'Desviación típica muestral (log)', valor: desviacionMuestral(l), formato: 'pct:4' },
        { id: 'observaciones', etiqueta: 'Rentabilidades calculadas', valor: s.length, formato: 'entero' },
      ],
      convenciones: {
        base: `Anualización × √${n}`,
        periodicidad: `Serie ${n === 252 ? 'diaria' : n === 52 ? 'semanal' : 'mensual'}`,
        nominalEfectivo: 'Rentabilidades por periodo (no anualizadas salvo la volatilidad)',
        comisiones: 'No aplica (precios sin dividendos ni costes)',
      },
      avisos: ['Varianza y desviación muestrales (divisor n − 1), como VAR.S / DESVEST.M.'],
      tabla: {
        nombreCsv: 'rentabilidades.csv',
        columnas: [
          { id: 't', etiqueta: 'Periodo', formato: 'entero' },
          { id: 'precio', etiqueta: 'Precio', formato: 'num:4' },
          { id: 'simple', etiqueta: 'Rent. simple', formato: 'pct:4' },
          { id: 'log', etiqueta: 'Rent. log', formato: 'pct:4' },
        ],
        filas: p.map((precio, t) => ({ t, precio, simple: t === 0 ? NaN : s[t - 1], log: t === 0 ? NaN : l[t - 1] })),
      },
    };
  },
};
