import { ratiosFinancieros, crecimiento, semaforoDfnEbitda, semaforoDscr, UMBRALES_DFN_EBITDA, UMBRALES_DSCR } from '../lib/finanzas.js';
import { positivo, noNegativo, exigir } from './_comun.js';

// Datos de un ejercicio: [id, etiqueta, defecto, signo] (signo: 'pos' > 0, 'noneg' ≥ 0, 'libre').
const DATOS = [
  ['ventas', 'Ventas (cifra de negocio, revenue)', '2.000.000', 'pos'],
  ['ebit', 'Beneficio operativo (EBIT)', '180.000', 'libre'],
  ['amortizaciones', 'Amortizaciones (D&A)', '70.000', 'noneg'],
  ['gastosFinancieros', 'Gastos financieros (interest expense)', '40.000', 'noneg'],
  ['beneficioNeto', 'Beneficio neto (net income)', '100.000', 'libre'],
  ['deudaCorto', 'Deuda financiera a corto plazo', '150.000', 'noneg'],
  ['deudaLargo', 'Deuda financiera a largo plazo', '650.000', 'noneg'],
  ['caja', 'Caja y bancos (cash)', '120.000', 'noneg'],
  ['fondosPropios', 'Fondos propios (equity)', '900.000', 'libre'],
  ['activoTotal', 'Activo total (total assets)', '2.400.000', 'pos'],
  ['activoCorriente', 'Activo corriente (current assets)', '1.000.000', 'noneg'],
  ['pasivoCorriente', 'Pasivo corriente (current liabilities)', '700.000', 'noneg'],
  ['flujoServicioDeuda', 'Flujo de caja disponible para el servicio de la deuda (CFADS)', '260.000', 'libre'],
  ['servicioDeuda', 'Cuotas de deuda del año (principal + intereses)', '200.000', 'noneg'],
];
const ANTERIOR = (id) => `${id}Ant`;

const campos = [
  ...DATOS.map(([id, etiqueta, defecto]) => ({ id, etiqueta, unidad: 'EUR', tipo: 'numero', defecto, grupo: 'Año actual' })),
  { id: 'conAnterior', etiqueta: 'Comparar con el año anterior', tipo: 'casilla', defecto: 'no', grupo: 'Año anterior (opcional)' },
  ...DATOS.map(([id, etiqueta]) => ({ id: ANTERIOR(id), etiqueta, unidad: 'EUR', tipo: 'numero', defecto: '', grupo: 'Año anterior (opcional)',
    visibleSi: { campo: 'conAnterior', valor: 'si' } })),
];

function leerEjercicio(v, sufijo, nombre) {
  const d = {};
  for (const [id, etiqueta, , signo] of DATOS) {
    const x = v[id + sufijo];
    const et = `${etiqueta}${nombre}`;
    exigir(Number.isFinite(x), `${et}: introduce un valor`);
    if (signo === 'pos') positivo(x, et);
    if (signo === 'noneg') noNegativo(x, et);
    d[id] = x;
  }
  return d;
}

const NO_CALC = 'no calculable';

export default {
  id: 'analisis-estados-financieros',
  titulo: 'Análisis de estados financieros (ratios)',
  tituloIngles: 'Financial statement analysis',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/ratios-analisis-financiero.md',
  resumen: 'EBITDA, márgenes, DFN/EBITDA, liquidez, DSCR, cobertura de intereses, ROE y ROA con semáforo orientativo.',
  campos,
  calcular(v) {
    const d = leerEjercicio(v, '', '');
    const r = ratiosFinancieros(d);
    const conAnt = v.conAnterior === true;
    const a = conAnt ? ratiosFinancieros(leerEjercicio(v, 'Ant', ' (año anterior)')) : null;
    const ant = (k) => (a ? a[k] : undefined);
    const avisos = [];
    const res = [];
    const add = (grupo, id, etiqueta, valor, formato, extra = {}) => {
      res.push(valor === null
        ? { grupo, id, etiqueta, valor: extra.textoNulo ?? NO_CALC, formato: 'texto', ...extra, anterior: undefined }
        : { grupo, id, etiqueta, valor, formato, ...extra });
    };

    // Semáforos (P-019)
    const semDfn = semaforoDfnEbitda({ dfn: r.dfn, ebitda: r.ebitda });
    const semDscr = semaforoDscr(r.dscr);
    if (r.ebitda <= 0) avisos.push('EBITDA ≤ 0: el ratio DFN/EBITDA no es significativo (no se calcula).');
    if (r.liquidez === null) avisos.push('Pasivo corriente = 0: el ratio de liquidez no se puede calcular (división por cero).');
    if (r.dscr === null) avisos.push('Cuotas de deuda = 0: el DSCR no se puede calcular (división por cero).');
    if (r.coberturaIntereses === null) avisos.push('Gastos financieros = 0: la cobertura de intereses no se puede calcular (división por cero).');
    if (r.roe === null) avisos.push('Fondos propios ≤ 0: el ROE no es significativo (no se calcula).');

    // Análisis financiero
    add('Análisis financiero', 'ebitda', 'EBITDA = EBIT + amortizaciones', r.ebitda, 'eur', { anterior: ant('ebitda') });
    add('Análisis financiero', 'margenEbitda', 'Margen EBITDA (EBITDA margin)', r.margenEbitda, 'pct:2', { anterior: ant('margenEbitda') });
    add('Análisis financiero', 'margenNeto', 'Margen neto (net margin)', r.margenNeto, 'pct:2', { anterior: ant('margenNeto') });
    if (conAnt) {
      add('Análisis financiero', 'crecimientoVentas', 'Crecimiento de ventas (revenue growth)', crecimiento(d.ventas, v.ventasAnt), 'pct:2',
        { textoNulo: 'no calculable (ventas anteriores = 0)' });
    }
    // Solvencia y endeudamiento
    add('Solvencia y endeudamiento', 'dfn', 'Deuda financiera neta (net debt) = deuda − caja', r.dfn, 'eur', { anterior: ant('dfn') });
    add('Solvencia y endeudamiento', 'dfnEbitda', 'DFN/EBITDA (Net debt/EBITDA)', r.dfnEbitda, 'veces:2',
      { anterior: ant('dfnEbitda'), estado: semDfn, textoNulo: 'no significativo' });
    add('Solvencia y endeudamiento', 'autonomia', 'Autonomía financiera = FP / activo total (equity ratio) ⚠️', r.autonomiaFinanciera, 'pct:2', { anterior: ant('autonomiaFinanciera') });
    // Liquidez
    add('Liquidez', 'fondoManiobra', 'Fondo de maniobra (working capital) = AC − PC', r.fondoManiobra, 'eur', { anterior: ant('fondoManiobra') });
    add('Liquidez', 'liquidez', 'Ratio de liquidez (current ratio) = AC / PC', r.liquidez, 'veces:2', { anterior: ant('liquidez') });
    add('Liquidez', 'tesoreriaNeta', 'Tesorería neta = caja y bancos − deuda financiera a corto', r.tesoreriaNeta, 'eur', { anterior: ant('tesoreriaNeta') });
    // Riesgo de crédito
    add('Riesgo de crédito', 'dscr', 'DSCR (debt service coverage ratio) ⚠️', r.dscr, 'veces:2', { anterior: ant('dscr'), estado: semDscr });
    add('Riesgo de crédito', 'coberturaIntereses', 'Cobertura de intereses (interest coverage) = EBITDA / gastos financieros', r.coberturaIntereses, 'veces:2', { anterior: ant('coberturaIntereses') });
    // Rentabilidad
    add('Rentabilidad', 'roe', 'ROE = beneficio neto / fondos propios', r.roe, 'pct:2', { anterior: ant('roe'), textoNulo: 'no significativo' });
    add('Rentabilidad', 'roa', 'ROA = beneficio neto / activo total', r.roa, 'pct:2', { anterior: ant('roa') });

    // Resumen a la vista: los dos ratios con semáforo.
    const resumen = [
      r.dfnEbitda === null
        ? { id: 'resumenDfnEbitda', etiqueta: 'DFN/EBITDA (Net debt/EBITDA)', valor: 'no significativo', formato: 'texto', destacado: true, estado: semDfn }
        : { id: 'resumenDfnEbitda', etiqueta: 'DFN/EBITDA (Net debt/EBITDA)', valor: r.dfnEbitda, formato: 'veces:2', destacado: true, estado: semDfn },
      r.dscr === null
        ? { id: 'resumenDscr', etiqueta: 'DSCR', valor: NO_CALC, formato: 'texto', destacado: true, estado: semDscr }
        : { id: 'resumenDscr', etiqueta: 'DSCR', valor: r.dscr, formato: 'veces:2', destacado: true, estado: semDscr },
      { id: 'resumenEbitda', etiqueta: 'EBITDA', valor: r.ebitda, formato: 'eur' },
    ];

    avisos.push(
      `Semáforo orientativo con referencias generales de mercado, no criterios de ningún banco: DFN/EBITDA < ${UMBRALES_DFN_EBITDA.comodo}x cómodo, ${UMBRALES_DFN_EBITDA.comodo}x–${UMBRALES_DFN_EBITDA.elevado}x zona de vigilancia, ≥ ${UMBRALES_DFN_EBITDA.elevado}x elevado; DSCR ≥ ${UMBRALES_DSCR.aceptable.toFixed(2).replace('.', ',')}x aceptable, < ${UMBRALES_DSCR.noCubre.toFixed(2).replace('.', ',')}x no cubre el servicio de la deuda, entre medias ajustado. Cada sector tiene sus propias referencias.`,
      '⚠️ Pendiente de verificar: hay variantes habituales de estas definiciones. Autonomía financiera también se calcula como fondos propios / pasivo exigible; el EBITDA a veces suma deterioros y otros resultados no recurrentes; el flujo del DSCR puede ser EBITDA − impuestos − CAPEX ± variación del circulante u otra definición pactada en cada contrato.',
    );
    return {
      resultados: [...resumen, ...res],
      convenciones: {
        base: 'Importes de un ejercicio (cuentas anuales); todos en la misma unidad (EUR o miles de EUR)',
        periodicidad: 'Anual; el año anterior es opcional y solo sirve para comparar',
        nominalEfectivo: 'Ratios contables sobre saldos de cierre (no medios)',
        comisiones: 'No aplica',
      },
      avisos,
    };
  },
};
