import { cuadroAmortizacion, tinATae, tir, periodicoAAnual } from '../lib/finanzas.js';
import { positivo, noNegativo, entero, exigir, PERIODICIDADES, NOMBRE_PERIODICIDAD } from './_comun.js';

const ETIQUETA_CUOTA = {
  frances: 'Cuota constante (tras la carencia)',
  aleman: 'Primera cuota (tras la carencia)',
  americano: 'Cuota periódica: solo intereses (tras la carencia)',
};

export default {
  id: 'prestamo-amortizacion',
  titulo: 'Préstamo: cuadro de amortización (francés, alemán, americano)',
  tituloIngles: 'Loan amortization schedule',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/prestamos-sistemas-de-amortizacion.md',
  resumen: 'Cuota constante, amortización constante o bullet; con carencia, comisiones, coste total y TAE; exportable a CSV.',
  campos: [
    { id: 'capital', etiqueta: 'Capital', unidad: 'EUR', tipo: 'numero', defecto: '100.000' },
    { id: 'tin', etiqueta: 'TIN anual', unidad: '%', tipo: 'porcentaje', defecto: '5,00' },
    { id: 'periodicidad', etiqueta: 'Periodicidad de las cuotas', tipo: 'seleccion', defecto: '12', opciones: PERIODICIDADES },
    { id: 'periodos', etiqueta: 'Número total de cuotas (incluida la carencia)', tipo: 'entero', defecto: '60' },
    { id: 'carencia', etiqueta: 'Periodos de carencia', tipo: 'entero', defecto: '6' },
    { id: 'tipoCarencia', etiqueta: 'Tipo de carencia', tipo: 'seleccion', defecto: 'parcial',
      opciones: [{ valor: 'parcial', etiqueta: 'Parcial (se pagan intereses)' }, { valor: 'total', etiqueta: 'Total (se capitalizan intereses)' }] },
    { id: 'sistema', etiqueta: 'Sistema de amortización', tipo: 'seleccion', defecto: 'frances',
      opciones: [
        { valor: 'frances', etiqueta: 'Cuota constante (francés)' },
        { valor: 'aleman', etiqueta: 'Amortización constante (alemán)' },
        { valor: 'americano', etiqueta: 'Todo al vencimiento (americano / bullet)' },
      ] },
    { id: 'apertura', etiqueta: 'Comisión de apertura (sobre el capital)', unidad: '%', tipo: 'porcentaje', defecto: '1,00', grupo: 'Comisiones y gastos iniciales' },
    { id: 'estudio', etiqueta: 'Comisión de estudio (sobre el capital)', unidad: '%', tipo: 'porcentaje', defecto: '0,25', grupo: 'Comisiones y gastos iniciales' },
    { id: 'gastos', etiqueta: 'Gastos iniciales (notaría, tasación, gestoría…)', unidad: 'EUR', tipo: 'numero', defecto: '300', grupo: 'Comisiones y gastos iniciales' },
  ],
  calcular(v) {
    const capital = positivo(v.capital, 'Capital');
    exigir(Number.isFinite(v.tin) && v.tin >= 0, 'TIN: debe ser mayor o igual que 0');
    const m = Number(v.periodicidad);
    const periodos = entero(v.periodos, 'Número de cuotas');
    const carencia = entero(v.carencia, 'Carencia', 0);
    exigir(carencia < periodos, 'La carencia debe ser menor que el número total de cuotas');
    noNegativo(v.apertura, 'Comisión de apertura'); noNegativo(v.estudio, 'Comisión de estudio'); noNegativo(v.gastos, 'Gastos iniciales');
    const i = v.tin / m;
    const { filas, totales } = cuadroAmortizacion({ capital, tipoPeriodo: i, periodos, carencia, tipoCarencia: v.tipoCarencia, sistema: v.sistema });
    const primera = filas[carencia];
    const resultados = [
      { id: 'cuota', etiqueta: ETIQUETA_CUOTA[v.sistema], valor: primera.cuota, formato: 'eur', destacado: true },
    ];
    if (v.sistema !== 'frances') {
      resultados.push({ id: 'ultima', etiqueta: v.sistema === 'americano' ? 'Última cuota (intereses + todo el capital)' : 'Última cuota', valor: filas.at(-1).cuota, formato: 'eur' });
    }
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
    // Coste total y TAE con comisiones: TIR de los flujos (P-004) anualizada (P-003) sobre el cuadro (P-005).
    const comisiones = capital * (v.apertura + v.estudio);
    const iniciales = comisiones + v.gastos;
    const avisosComisiones = [];
    if (iniciales > 0) {
      exigir(iniciales < capital, 'Las comisiones y gastos iniciales superan el capital');
      const r = tir([capital - iniciales, ...filas.map((f) => -f.cuota)]);
      exigir(r.tir !== null, 'No se ha podido calcular la TAE con comisiones');
      const taeCom = periodicoAAnual(r.tir, m);
      resultados.push(
        { grupo: 'Coste total con comisiones', id: 'comisiones', etiqueta: 'Comisiones de apertura y estudio', valor: comisiones, formato: 'eur' },
        { grupo: 'Coste total con comisiones', id: 'gastos', etiqueta: 'Gastos iniciales', valor: v.gastos, formato: 'eur' },
        { grupo: 'Coste total con comisiones', id: 'costeTotal', etiqueta: 'Coste financiero total = intereses + comisiones + gastos', valor: totales.intereses + iniciales, formato: 'eur' },
        { grupo: 'Coste total con comisiones', id: 'recibido', etiqueta: 'Importe neto recibido', valor: capital - iniciales, formato: 'eur' },
        { id: 'taeComisiones', etiqueta: 'TAE con comisiones y gastos (APR)', valor: taeCom, formato: 'pct:4', destacado: true },
        { id: 'sobrecoste', etiqueta: 'Sobrecoste de comisiones y gastos (TAE con − sin)', valor: taeCom - tinATae(v.tin, m), formato: 'pct:4', variacion: 'coste' },
      );
      avisosComisiones.push('⚠️ Pendiente de verificar: la TAE con comisiones se calcula con periodos iguales (1/m de año); la normativa del Banco de España mide el tiempo en días/365, lo que puede dar diferencias mínimas. Incluir o no cada gasto en la TAE depende de la normativa (p. ej., algunos gastos los paga el prestamista en préstamos hipotecarios a consumidores).');
    }
    return {
      resultados,
      convenciones: {
        base: 'Tipo periódico = TIN / número de cuotas al año',
        periodicidad: `Cuotas ${NOMBRE_PERIODICIDAD[m]}es`,
        nominalEfectivo: 'TIN nominal anual; TAE equivalente sin comisiones',
        comisiones: iniciales > 0 ? 'Apertura, estudio y gastos iniciales incluidos en el coste total y en la TAE con comisiones; no incluye amortización anticipada' : 'Sin comisiones ni gastos iniciales',
      },
      avisos: [
        'Importes sin redondear a céntimos en cada cuota: el cuadro de un banco puede diferir en céntimos.',
        ...avisosComisiones,
        ...(v.sistema === 'americano' ? ['Bullet: la última cuota devuelve todo el capital; hay que prever esa liquidez (o refinanciarla).'] : []),
      ],
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
