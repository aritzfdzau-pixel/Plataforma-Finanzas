import { cuadroAmortizacion, tinATae } from '../lib/finanzas.js';
import { positivo, entero, exigir, PERIODICIDADES, NOMBRE_PERIODICIDAD } from './_comun.js';

export default {
  id: 'prestamo-frances-aleman',
  titulo: 'Préstamo francés y alemán con carencia',
  tituloIngles: 'Loan amortization schedule',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/prestamos-frances-aleman.md',
  resumen: 'Cuadro de amortización con carencia parcial o total, exportable a CSV.',
  campos: [
    { id: 'capital', etiqueta: 'Capital', unidad: 'EUR', tipo: 'numero', defecto: '100.000' },
    { id: 'tin', etiqueta: 'TIN anual', unidad: '%', tipo: 'porcentaje', defecto: '5,00' },
    { id: 'periodicidad', etiqueta: 'Periodicidad de las cuotas', tipo: 'seleccion', defecto: '12', opciones: PERIODICIDADES },
    { id: 'periodos', etiqueta: 'Número total de cuotas (incluida la carencia)', tipo: 'entero', defecto: '60' },
    { id: 'carencia', etiqueta: 'Periodos de carencia', tipo: 'entero', defecto: '6' },
    { id: 'tipoCarencia', etiqueta: 'Tipo de carencia', tipo: 'seleccion', defecto: 'parcial',
      opciones: [{ valor: 'parcial', etiqueta: 'Parcial (se pagan intereses)' }, { valor: 'total', etiqueta: 'Total (se capitalizan intereses)' }] },
    { id: 'sistema', etiqueta: 'Sistema', tipo: 'seleccion', defecto: 'frances',
      opciones: [{ valor: 'frances', etiqueta: 'Francés (cuota constante)' }, { valor: 'aleman', etiqueta: 'Alemán (amortización constante)' }] },
  ],
  calcular(v) {
    const capital = positivo(v.capital, 'Capital');
    exigir(Number.isFinite(v.tin) && v.tin >= 0, 'TIN: debe ser mayor o igual que 0');
    const m = Number(v.periodicidad);
    const periodos = entero(v.periodos, 'Número de cuotas');
    const carencia = entero(v.carencia, 'Carencia', 0);
    exigir(carencia < periodos, 'La carencia debe ser menor que el número total de cuotas');
    const i = v.tin / m;
    const { filas, totales } = cuadroAmortizacion({ capital, tipoPeriodo: i, periodos, carencia, tipoCarencia: v.tipoCarencia, sistema: v.sistema });
    const primera = filas[carencia];
    const resultados = [
      { id: 'cuota', etiqueta: v.sistema === 'frances' ? 'Cuota constante (tras la carencia)' : 'Primera cuota (tras la carencia)', valor: primera.cuota, formato: 'eur', destacado: true },
    ];
    if (v.sistema === 'aleman') resultados.push({ id: 'ultima', etiqueta: 'Última cuota', valor: filas.at(-1).cuota, formato: 'eur' });
    if (carencia > 0) {
      resultados.push({ id: 'cuotaCarencia', etiqueta: 'Cuota durante la carencia', valor: filas[0].cuota, formato: 'eur' });
      resultados.push({ id: 'capitalTrasCarencia', etiqueta: 'Capital pendiente al acabar la carencia', valor: filas[carencia - 1].pendiente, formato: 'eur' });
    }
    resultados.push(
      { id: 'intereses', etiqueta: 'Intereses totales', valor: totales.intereses, formato: 'eur' },
      { id: 'totalPagado', etiqueta: 'Total pagado', valor: totales.cuotas, formato: 'eur' },
      { id: 'tipoPeriodo', etiqueta: 'Tipo por periodo (TIN / m)', valor: i, formato: 'pct:4' },
      { id: 'tae', etiqueta: 'TAE sin comisiones', valor: tinATae(v.tin, m), formato: 'pct:4' },
    );
    return {
      resultados,
      convenciones: {
        base: 'Tipo periódico = TIN / número de cuotas al año',
        periodicidad: `Cuotas ${NOMBRE_PERIODICIDAD[m]}es`,
        nominalEfectivo: 'TIN nominal anual; TAE equivalente sin comisiones',
        comisiones: 'No incluidas (ni apertura ni amortización anticipada)',
      },
      avisos: ['Importes sin redondear a céntimos en cada cuota: el cuadro de un banco puede diferir en céntimos.'],
      tabla: {
        nombreCsv: `cuadro-${v.sistema}.csv`,
        columnas: [
          { id: 'periodo', etiqueta: 'Periodo', formato: 'entero' },
          { id: 'cuota', etiqueta: 'Cuota', formato: 'num:2' },
          { id: 'intereses', etiqueta: 'Intereses', formato: 'num:2' },
          { id: 'amortizacion', etiqueta: 'Amortización', formato: 'num:2' },
          { id: 'pendiente', etiqueta: 'Capital pendiente', formato: 'num:2' },
        ],
        filas,
      },
    };
  },
};
