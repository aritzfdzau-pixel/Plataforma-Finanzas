import {
  ratiosFinancieros, crecimiento, semaforoDfnEbitda, valorarRatio, evolucionRatio, RANGOS_RATIOS, UMBRALES_DFN_EBITDA, UMBRALES_DSCR,
} from '../lib/finanzas.js';
import { formatear } from '../../web/js/lib/formato.js';
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
  ['caja', 'Disponible: caja y bancos (cash)', '120.000', 'noneg'],
  ['inversionesCorto', 'Inversiones financieras a corto plazo', '30.000', 'noneg'],
  ['fondosPropios', 'Patrimonio neto (PN, equity)', '900.000', 'libre'],
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

// Ratios que se muestran: [grupo, id del resultado, clave en ratiosFinancieros, nombre, formato].
// Los que no tienen rango en RANGOS_RATIOS (DFN en euros) se muestran sin valoración.
const RATIOS = [
  ['Análisis financiero', 'ebitda', 'ebitda', 'EBITDA = EBIT + amortizaciones', 'eur'],
  ['Análisis financiero', 'margenEbitda', 'margenEbitda', 'Margen EBITDA (EBITDA margin) = EBITDA / ventas', 'pct:2'],
  ['Análisis financiero', 'margenNeto', 'margenNeto', 'Margen neto (net margin) = beneficio neto / ventas', 'pct:2'],
  ['Solvencia y endeudamiento', 'dfn', 'dfn', 'Deuda financiera neta (net debt) = deuda financiera − caja', 'eur'],
  ['Solvencia y endeudamiento', 'dfnEbitda', 'dfnEbitda', 'DFN / EBITDA (Net debt/EBITDA)', 'veces:2'],
  ['Solvencia y endeudamiento', 'deudaEbitda', 'deudaEbitda', 'Deuda financiera / EBITDA (Debt/EBITDA)', 'veces:2'],
  ['Solvencia y endeudamiento', 'endeudamiento', 'endeudamiento', 'Endeudamiento (leverage) = pasivo / patrimonio neto', 'veces:2'],
  ['Solvencia y endeudamiento', 'solvencia', 'solvencia', 'Solvencia = activo / pasivo', 'veces:2'],
  ['Solvencia y endeudamiento', 'autonomia', 'autonomiaFinanciera', 'Autonomía financiera = patrimonio neto / activo total (equity ratio)', 'pct:2'],
  ['Liquidez', 'liquidez', 'liquidez', 'Liquidez (current ratio) = AC / PC', 'veces:2'],
  ['Liquidez', 'tesoreria', 'tesoreria', 'Tesorería (cash ratio) = (disponible + inversiones a corto) / PC', 'veces:2'],
  ['Liquidez', 'fondoManiobra', 'fondoManiobra', 'Fondo de maniobra (working capital) = AC − PC', 'eur'],
  ['Liquidez', 'tesoreriaNeta', 'tesoreriaNeta', 'Tesorería neta = disponible − deuda financiera a corto', 'eur'],
  ['Riesgo de crédito', 'dscr', 'dscr', 'DSCR (debt service coverage ratio) = CFADS / cuotas', 'veces:2'],
  ['Riesgo de crédito', 'coberturaIntereses', 'coberturaIntereses', 'Cobertura de intereses (interest coverage) = EBITDA / gastos financieros', 'veces:2'],
  ['Rentabilidad', 'roa', 'roa', 'ROA (return on assets) = beneficio neto / activo', 'pct:2'],
  ['Rentabilidad', 'roe', 'roe', 'ROE (return on equity) = beneficio neto / patrimonio neto', 'pct:2'],
];
const NOMBRE_CORTO = {
  ebitda: 'EBITDA', dfn: 'deuda financiera neta', margenEbitda: 'margen EBITDA', margenNeto: 'margen neto', crecimientoVentas: 'crecimiento de ventas',
  dfnEbitda: 'DFN/EBITDA', deudaEbitda: 'deuda financiera/EBITDA', endeudamiento: 'endeudamiento', solvencia: 'solvencia',
  autonomiaFinanciera: 'autonomía financiera', liquidez: 'liquidez', tesoreria: 'tesorería', fondoManiobra: 'fondo de maniobra',
  tesoreriaNeta: 'tesorería neta', dscr: 'DSCR', coberturaIntereses: 'cobertura de intereses', roa: 'ROA', roe: 'ROE',
};
const formatoEvolucion = (f) => (f.startsWith('pct') ? 'pp:2' : f);
/** Diferencia con signo: «+0,16x», «−130.000,00 €», «0,00 p. p.». */
const conSigno = (x, f) => (x > 0 ? '+' : x < 0 ? '−' : '') + formatear(Math.abs(x), f);
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** Matiz cualitativo de algunos ratios (texto fijo, sin cálculos). */
function matiz(clave, v) {
  if (clave === 'liquidez' && v > 2) return 'Por encima de 2 puede haber activo corriente ocioso.';
  if (clave === 'tesoreria' && v > 0.3) return 'Por encima de 0,3 puede haber exceso de liquidez sin rentabilizar.';
  if (clave === 'endeudamiento' && v !== null && v < 0.7) return 'Poco apalancada: tiene margen para financiarse con deuda.';
  if (clave === 'dfn' && v < 0) return 'Caja neta positiva: la caja supera a la deuda financiera.';
  return '';
}

/** Comentario de un ratio: valoración del año y, si hay año anterior, su evolución. */
function comentario(clave, formato, actual, anterior, valoracion, conAnt) {
  const f = (x) => formatear(x, formato);
  const partes = [];
  if (actual === null) partes.push('No significativo este año.');
  else if (conAnt) {
    if (anterior === null || anterior === undefined) partes.push(`${f(actual)}; el año anterior no es comparable.`);
    else {
      const ev = RANGOS_RATIOS[clave] ? evolucionRatio(clave, actual, anterior) : { mejora: null, diferencia: actual - anterior };
      const verbo = ev.diferencia === 0 ? 'Sin cambios' : ev.mejora === null ? (ev.diferencia > 0 ? 'Sube' : 'Baja') : ev.mejora ? 'Mejora' : 'Empeora';
      partes.push(`${verbo}: de ${f(anterior)} a ${f(actual)}.`);
    }
  }
  if (valoracion && valoracion.nivel !== 'nd') partes.push(`${mayus(valoracion.texto)} (${valoracion.rango}).`);
  const m = actual === null ? '' : matiz(clave, actual);
  if (m) partes.push(m);
  return partes.join(' ');
}

/** Resumen y conclusión del informe a partir de las valoraciones (texto generado por reglas). */
function resumenInforme(filas, conAnt, crecVentas) {
  const conRango = filas.filter((x) => x.valoracion && x.valoracion.nivel !== 'nd');
  const cuenta = (n) => conRango.filter((x) => x.valoracion.nivel === n);
  const ok = cuenta('ok'), vig = cuenta('vigilancia'), alto = cuenta('alto');
  const nombres = (l) => l.map((x) => NOMBRE_CORTO[x.clave] ?? x.clave).join(', ');
  const frases = [`Valoración global: ${ok.length} de ${conRango.length} ratios dentro del rango recomendado, ${vig.length} en zona de vigilancia y ${alto.length} fuera de rango.`];
  if (ok.length) frases.push(`Puntos fuertes: ${nombres(ok)}.`);
  if (vig.length) frases.push(`A vigilar: ${nombres(vig)}.`);
  if (alto.length) frases.push(`Puntos débiles: ${nombres(alto)}.`);
  if (conAnt) {
    const ev = filas.filter((x) => x.mejora !== null && x.mejora !== undefined);
    frases.push(`Respecto al año anterior mejoran ${ev.filter((x) => x.mejora).length} ratios y empeoran ${ev.filter((x) => !x.mejora).length}.`);
    if (Number.isFinite(crecVentas)) frases.push(`Las ventas ${crecVentas >= 0 ? 'crecen' : 'caen'} un ${formatear(Math.abs(crecVentas), 'pct:2')}.`);
  }
  const critico = alto.some((x) => ['dscr', 'ebitda', 'fondoManiobra', 'solvencia'].includes(x.clave));
  const conclusion = critico || alto.length >= 3
    ? 'Situación financiera tensionada: hay ratios clave fuera de rango; conviene analizar su causa antes de asumir más deuda.'
    : alto.length || vig.length > 2
      ? 'Situación financiera aceptable, con puntos que conviene vigilar.'
      : 'Situación financiera sólida en conjunto según estos ratios.';
  return { frases, conclusion };
}

const NO_CALC = 'no calculable';

export default {
  id: 'analisis-estados-financieros',
  titulo: 'Análisis de estados financieros (ratios)',
  tituloIngles: 'Financial statement analysis',
  categoria: 'empresas',
  ficha: 'conocimiento/empresas/ratios-analisis-financiero.md',
  resumen: 'Ratios de liquidez, tesorería, endeudamiento, solvencia, deuda/EBITDA, DSCR y rentabilidad con su rango recomendado, comparación entre años e informe.',
  campos,
  calcular(v) {
    const d = leerEjercicio(v, '', '');
    const r = ratiosFinancieros(d);
    const conAnt = v.conAnterior === true;
    const a = conAnt ? ratiosFinancieros(leerEjercicio(v, 'Ant', ' (año anterior)')) : null;
    const crecVentas = conAnt ? crecimiento(d.ventas, v.ventasAnt) : null;
    const avisos = [];
    if (r.ebitda <= 0) avisos.push('EBITDA ≤ 0: DFN/EBITDA y deuda financiera/EBITDA no son significativos (no se calculan).');
    if (r.liquidez === null) avisos.push('Pasivo corriente = 0: liquidez y tesorería no se pueden calcular (división por cero).');
    if (r.dscr === null) avisos.push('Cuotas de deuda = 0: el DSCR no se puede calcular (división por cero).');
    if (r.coberturaIntereses === null) avisos.push('Gastos financieros = 0: la cobertura de intereses no se puede calcular (división por cero).');
    if (r.roe === null) avisos.push('Patrimonio neto ≤ 0: ROE y endeudamiento no son significativos (no se calculan).');
    if (r.solvencia === null) avisos.push('Pasivo = 0 (activo igual al patrimonio neto): la solvencia no se puede calcular.');

    const res = [];
    const filasInforme = [];
    const semDfn = semaforoDfnEbitda({ dfn: r.dfn, ebitda: r.ebitda });
    const add = (grupo, id, clave, etiqueta, formato, valor, anterior) => {
      const tieneRango = Boolean(RANGOS_RATIOS[clave]);
      let valoracion = tieneRango ? valorarRatio(clave, valor) : null;
      if (clave === 'dfnEbitda') valoracion = { ...semDfn, rango: valoracion.rango, texto: valor === null ? 'no significativo' : semDfn.texto };
      const ev = conAnt && tieneRango ? evolucionRatio(clave, valor, anterior) : { diferencia: null, mejora: null };
      const fila = {
        grupo, id, etiqueta,
        valor: valor === null ? (clave === 'dfnEbitda' || clave === 'deudaEbitda' || clave === 'roe' || clave === 'endeudamiento' ? 'no significativo' : NO_CALC) : valor,
        formato: valor === null ? 'texto' : formato,
        rango: valoracion?.rango ?? null,
        estado: valoracion && valoracion.nivel !== 'nd' ? { nivel: valoracion.nivel, texto: valoracion.texto } : valoracion ? { nivel: 'nd', texto: 'no significativo' } : undefined,
        comentario: comentario(clave, formato, valor, anterior, valoracion, conAnt),
      };
      if (conAnt) {
        fila.anterior = anterior ?? null;
        if (ev.diferencia !== null) {
          fila.evolucion = { valor: ev.diferencia, formato: formatoEvolucion(formato), variacion: RANGOS_RATIOS[clave]?.mejor === 'bajo' ? 'coste' : 'normal' };
        }
      }
      res.push(fila);
      filasInforme.push({ clave, grupo, etiqueta, formato, valor, anterior, valoracion, mejora: ev.mejora, comentario: fila.comentario });
    };

    for (const [grupo, id, clave, etiqueta, formato] of RATIOS) add(grupo, id, clave, etiqueta, formato, r[clave], a ? a[clave] : undefined);
    if (conAnt) {
      const val = valorarRatio('crecimientoVentas', crecVentas);
      res.splice(3, 0, {
        grupo: 'Análisis financiero', id: 'crecimientoVentas', etiqueta: 'Crecimiento de ventas (revenue growth) = (Vt − Vt−1) / Vt−1',
        valor: crecVentas === null ? 'no calculable (ventas anteriores = 0)' : crecVentas, formato: crecVentas === null ? 'texto' : 'pct:2',
        rango: val.rango, estado: { nivel: val.nivel, texto: val.texto }, comentario: comentario('crecimientoVentas', 'pct:2', crecVentas, undefined, val, false),
      });
      filasInforme.splice(3, 0, { clave: 'crecimientoVentas', grupo: 'Análisis financiero', etiqueta: 'Crecimiento de ventas', formato: 'pct:2', valor: crecVentas, valoracion: val, mejora: null });
    }

    // Resumen a la vista: los dos ratios con semáforo principal.
    const dscrVal = valorarRatio('dscr', r.dscr);
    const resumen = [
      r.dfnEbitda === null
        ? { id: 'resumenDfnEbitda', etiqueta: 'DFN/EBITDA (Net debt/EBITDA)', valor: 'no significativo', formato: 'texto', destacado: true, estado: semDfn }
        : { id: 'resumenDfnEbitda', etiqueta: 'DFN/EBITDA (Net debt/EBITDA)', valor: r.dfnEbitda, formato: 'veces:2', destacado: true, estado: semDfn },
      r.dscr === null
        ? { id: 'resumenDscr', etiqueta: 'DSCR', valor: NO_CALC, formato: 'texto', destacado: true, estado: { nivel: 'nd', texto: 'no calculable (sin cuotas de deuda)' } }
        : { id: 'resumenDscr', etiqueta: 'DSCR', valor: r.dscr, formato: 'veces:2', destacado: true,
          estado: { nivel: dscrVal.nivel, texto: r.dscr >= UMBRALES_DSCR.aceptable ? 'aceptable' : r.dscr < UMBRALES_DSCR.noCubre ? 'no cubre el servicio de la deuda' : 'ajustado' } },
      { id: 'resumenEbitda', etiqueta: 'EBITDA', valor: r.ebitda, formato: 'eur' },
    ];

    const { frases, conclusion } = resumenInforme(filasInforme, conAnt, crecVentas);
    const fmt = (x, f) => (x === null || x === undefined ? '—' : formatear(x, f));
    const informe = {
      titulo: 'Informe de análisis de estados financieros',
      subtitulo: conAnt ? 'Año actual frente al año anterior' : 'Año actual',
      resumen: frases,
      conclusion,
      columnas: conAnt ? ['Ratio', 'Año actual', 'Año anterior', 'Evolución', 'Rango recomendado', 'Valoración'] : ['Ratio', 'Valor', 'Rango recomendado', 'Valoración'],
      bloques: [...new Set(filasInforme.map((x) => x.grupo))].map((g) => ({
        titulo: g,
        filas: filasInforme.filter((x) => x.grupo === g).map((x) => {
          const ev = conAnt && Number.isFinite(x.valor) && Number.isFinite(x.anterior) ? conSigno(x.valor - x.anterior, formatoEvolucion(x.formato)) : '—';
          const val = x.valoracion ? (x.valoracion.nivel === 'nd' ? 'no significativo' : x.valoracion.texto) : '—';
          const base = [x.etiqueta, fmt(Number.isFinite(x.valor) ? x.valor : null, x.formato)];
          return conAnt ? [...base, fmt(Number.isFinite(x.anterior) ? x.anterior : null, x.formato), ev, x.valoracion?.rango ?? '—', val]
            : [...base, x.valoracion?.rango ?? '—', val];
        }),
        comentarios: filasInforme.filter((x) => x.grupo === g && x.comentario).map((x) => `${mayus(NOMBRE_CORTO[x.clave] ?? x.clave)}: ${x.comentario}`),
      })),
      aviso: 'Herramienta de estudio; resultados orientativos. Los rangos recomendados son referencias generales de manuales de análisis financiero, dependen del sector y no son criterios de ningún banco.',
    };

    avisos.push(
      `Rangos recomendados: referencias generales de manuales de análisis financiero, no criterios de ningún banco; cada sector tiene los suyos. DFN/EBITDA < ${UMBRALES_DFN_EBITDA.comodo}x cómodo, ${UMBRALES_DFN_EBITDA.comodo}x–${UMBRALES_DFN_EBITDA.elevado}x zona de vigilancia, ≥ ${UMBRALES_DFN_EBITDA.elevado}x elevado; DSCR ≥ ${UMBRALES_DSCR.aceptable.toFixed(2).replace('.', ',')}x aceptable, < ${UMBRALES_DSCR.noCubre.toFixed(2).replace('.', ',')}x no cubre el servicio de la deuda.`,
      '⚠️ Pendiente de verificar: hay variantes habituales de estas definiciones. Autonomía financiera también se calcula como patrimonio neto / pasivo exigible; el EBITDA a veces suma deterioros y otros resultados no recurrentes; el flujo del DSCR puede ser EBITDA − impuestos − CAPEX ± variación del circulante u otra definición pactada en cada contrato; el pasivo se toma como activo − patrimonio neto (pasivo exigible).',
      '⚠️ Pendiente de verificar: los rangos recomendados (D-042) son orientativos y conviene contrastarlos con las medias del sector (p. ej., Central de Balances del Banco de España).',
    );
    return {
      resultados: [...resumen, ...res],
      convenciones: {
        base: 'Importes de un ejercicio (cuentas anuales); todos en la misma unidad (EUR o miles de EUR)',
        periodicidad: 'Anual; el año anterior es opcional y sirve para comparar y comentar la evolución',
        nominalEfectivo: 'Ratios contables sobre saldos de cierre (no medios)',
        comisiones: 'No aplica',
      },
      avisos,
      informe,
    };
  },
};
