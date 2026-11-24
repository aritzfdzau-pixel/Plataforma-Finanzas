// operativa/lib/finanzas.js
// Funciones financieras PURAS (sin DOM, sin red, sin estado).
// Cada bloque corresponde a un patrón del catálogo (patrones/README.md).
// Convención: los tipos se expresan en tanto por uno (3 % → 0.03).

// ---------------------------------------------------------------------------
// P-001 · Fracción de año según base de cálculo
// ---------------------------------------------------------------------------
export const BASES = Object.freeze({ 'ACT/360': 360, 'ACT/365': 365 });

/** Fracción de año de `dias` naturales en la base indicada (Act/360 por defecto). */
export function fraccionAnio(dias, base = 'ACT/360') {
  const divisor = BASES[base];
  if (!divisor) throw new Error(`Base de cálculo no soportada: ${base}`);
  comprobarFinito(dias, 'días');
  if (dias < 0) throw new Error('Los días no pueden ser negativos');
  return dias / divisor;
}

// ---------------------------------------------------------------------------
// P-002 · Capitalización simple a corto plazo
// ---------------------------------------------------------------------------
/** Factor 1 + r·d/B (interés simple, típico del mercado monetario). */
export function factorSimple(tipo, dias, base = 'ACT/360') {
  comprobarFinito(tipo, 'tipo');
  return 1 + tipo * fraccionAnio(dias, base);
}

/** Intereses simples de un nominal: N·r·d/B. */
export function interesSimple(nominal, tipo, dias, base = 'ACT/360') {
  comprobarFinito(nominal, 'nominal');
  return nominal * (factorSimple(tipo, dias, base) - 1);
}

// ---------------------------------------------------------------------------
// P-003 · Conversión de tipos entre periodicidades (TIN ↔ TAE)
// ---------------------------------------------------------------------------
/** TAE sin comisiones a partir de un TIN con m liquidaciones al año: (1+TIN/m)^m − 1. */
export function tinATae(tin, m) {
  comprobarFinito(tin, 'TIN'); comprobarPeriodos(m);
  return (1 + tin / m) ** m - 1;
}

/** TIN con m liquidaciones al año equivalente a una TAE: m·((1+TAE)^(1/m) − 1). */
export function taeATin(tae, m) {
  comprobarFinito(tae, 'TAE'); comprobarPeriodos(m);
  if (tae <= -1) throw new Error('La TAE debe ser mayor que −100 %');
  return m * ((1 + tae) ** (1 / m) - 1);
}

/** Tipo periódico (por periodo) → tipo efectivo anual: (1+i)^m − 1. */
export function periodicoAAnual(i, m) {
  comprobarFinito(i, 'tipo periódico'); comprobarPeriodos(m);
  return (1 + i) ** m - 1;
}

// ---------------------------------------------------------------------------
// P-004 · Descuento de flujos: VAN y TIR
// ---------------------------------------------------------------------------
/** VAN con el primer flujo en t = 0 (sin descontar). */
export function van(tasa, flujos) {
  comprobarFinito(tasa, 'tasa');
  if (tasa <= -1) throw new Error('La tasa debe ser mayor que −100 %');
  comprobarFlujos(flujos);
  return flujos.reduce((acc, f, t) => acc + f / (1 + tasa) ** t, 0);
}

/** Derivada del VAN respecto a la tasa. */
function vanDerivada(tasa, flujos) {
  return flujos.reduce((acc, f, t) => acc - (t * f) / (1 + tasa) ** (t + 1), 0);
}

/** Número de cambios de signo de una serie de flujos (ignorando ceros). */
export function cambiosDeSigno(flujos) {
  let cambios = 0; let previo = 0;
  for (const f of flujos) {
    if (f === 0) continue;
    const s = Math.sign(f);
    if (previo !== 0 && s !== previo) cambios++;
    previo = s;
  }
  return cambios;
}

/**
 * TIR por Newton-Raphson con respaldo por bisección.
 * Devuelve { tir, metodo, iteraciones } o { tir: null, motivo } si no existe.
 * Opciones: { estimacion, tolerancia, maxIter, forzarBiseccion }.
 */
export function tir(flujos, opciones = {}) {
  comprobarFlujos(flujos);
  const { estimacion = 0.1, tolerancia = 1e-10, maxIter = 100, forzarBiseccion = false } = opciones;
  if (cambiosDeSigno(flujos) === 0) {
    return { tir: null, motivo: 'Los flujos no cambian de signo: no existe TIR.' };
  }

  if (!forzarBiseccion) {
    let r = estimacion;
    for (let k = 1; k <= maxIter; k++) {
      const f = van(r, flujos);
      const d = vanDerivada(r, flujos);
      if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
      const siguiente = r - f / d;
      if (!Number.isFinite(siguiente) || siguiente <= -1) break;
      if (Math.abs(siguiente - r) < tolerancia) {
        return { tir: siguiente, metodo: 'Newton-Raphson', iteraciones: k };
      }
      r = siguiente;
    }
  }
  return biseccionTir(flujos, tolerancia);
}

function biseccionTir(flujos, tolerancia) {
  // Busca un intervalo con cambio de signo del VAN entre −99,99 % y 10.000 %.
  const puntos = [-0.9999, -0.99, -0.9, -0.5, -0.2, 0, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 100];
  for (let j = 0; j < puntos.length - 1; j++) {
    let a = puntos[j]; let b = puntos[j + 1];
    let fa = van(a, flujos); const fb = van(b, flujos);
    if (fa === 0) return { tir: a, metodo: 'bisección', iteraciones: 0 };
    if (Math.sign(fa) === Math.sign(fb)) continue;
    for (let k = 1; k <= 300; k++) {
      const m = (a + b) / 2;
      const fm = van(m, flujos);
      if (fm === 0 || (b - a) / 2 < tolerancia) {
        return { tir: m, metodo: 'bisección', iteraciones: k };
      }
      if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else { b = m; }
    }
  }
  return { tir: null, motivo: 'No se ha encontrado una TIR entre −99,99 % y 10.000 %.' };
}

// ---------------------------------------------------------------------------
// P-005 · Cuadro de amortización (francés / alemán, con carencia)
// ---------------------------------------------------------------------------
/** Cuota constante del sistema francés: C·i / (1 − (1+i)^−n). */
export function cuotaFrancesa(capital, i, n) {
  comprobarFinito(capital, 'capital'); comprobarFinito(i, 'tipo'); comprobarPeriodos(n);
  if (i === 0) return capital / n;
  return (capital * i) / (1 - (1 + i) ** -n);
}

/** Capital pendiente tras k cuotas francesas: C·(1+i)^k − cuota·((1+i)^k − 1)/i. */
export function pendienteFrances(capital, i, n, k) {
  const cuota = cuotaFrancesa(capital, i, n);
  if (i === 0) return capital - cuota * k;
  const f = (1 + i) ** k;
  return capital * f - (cuota * (f - 1)) / i;
}

/**
 * Cuadro de amortización.
 * @param {object} p
 * @param {number} p.capital       Capital inicial.
 * @param {number} p.tipoPeriodo   Tipo por periodo (TIN / m).
 * @param {number} p.periodos      Número total de periodos (incluida la carencia).
 * @param {number} [p.carencia=0]  Periodos de carencia al inicio.
 * @param {'parcial'|'total'} [p.tipoCarencia='parcial']
 *        parcial: se pagan solo intereses; total: no se paga nada y los intereses se capitalizan.
 * @param {'frances'|'aleman'|'americano'} [p.sistema='frances']
 *        frances: cuota constante; aleman: amortización constante; americano (bullet): solo
 *        intereses y todo el capital en la última cuota.
 * @returns {{filas: Array, totales: object}}
 */
export function cuadroAmortizacion({ capital, tipoPeriodo, periodos, carencia = 0, tipoCarencia = 'parcial', sistema = 'frances' }) {
  comprobarFinito(capital, 'capital');
  if (capital <= 0) throw new Error('El capital debe ser positivo');
  comprobarFinito(tipoPeriodo, 'tipo'); comprobarPeriodos(periodos);
  if (!Number.isInteger(carencia) || carencia < 0 || carencia >= periodos) {
    throw new Error('La carencia debe ser un entero entre 0 y el número de periodos − 1');
  }
  if (!['parcial', 'total'].includes(tipoCarencia)) throw new Error('Tipo de carencia no válido');
  if (!['frances', 'aleman', 'americano'].includes(sistema)) throw new Error('Sistema no válido');

  const filas = [];
  let pendiente = capital;
  const i = tipoPeriodo;

  for (let t = 1; t <= carencia; t++) {
    const intereses = pendiente * i;
    if (tipoCarencia === 'parcial') {
      filas.push({ periodo: t, cuota: intereses, intereses, amortizacion: 0, pendiente, fase: 'carencia' });
    } else {
      pendiente += intereses; // amortización negativa: los intereses se suman a la deuda
      filas.push({ periodo: t, cuota: 0, intereses, amortizacion: -intereses, pendiente, fase: 'carencia' });
    }
  }

  const restantes = periodos - carencia;
  const cuotaFija = sistema === 'frances' ? cuotaFrancesa(pendiente, i, restantes) : null;
  const amortizacionFija = sistema === 'aleman' ? pendiente / restantes : null;

  for (let k = 1; k <= restantes; k++) {
    const intereses = pendiente * i;
    // Americano (bullet): solo intereses; el capital entero se devuelve en la última cuota.
    let amortizacion = sistema === 'frances' ? cuotaFija - intereses : sistema === 'aleman' ? amortizacionFija : 0;
    if (k === restantes) amortizacion = pendiente; // cierre exacto sin residuos de coma flotante
    pendiente -= amortizacion;
    filas.push({
      periodo: carencia + k,
      cuota: intereses + amortizacion,
      intereses,
      amortizacion,
      pendiente: k === restantes ? 0 : pendiente,
      fase: 'amortizacion',
    });
  }

  // Intereses totales = lo pagado − capital prestado (incluye los capitalizados en carencia total).
  const cuotas = filas.reduce((acc, f) => acc + f.cuota, 0);
  const totales = { cuotas, intereses: cuotas - capital };

  return { filas, totales };
}

// ---------------------------------------------------------------------------
// P-006 · Rentabilidades y volatilidad
// ---------------------------------------------------------------------------
export function rentabilidadesSimples(precios) {
  comprobarPrecios(precios);
  return precios.slice(1).map((p, k) => p / precios[k] - 1);
}

export function rentabilidadesLog(precios) {
  comprobarPrecios(precios);
  return precios.slice(1).map((p, k) => Math.log(p / precios[k]));
}

export function media(x) {
  if (!Array.isArray(x) || x.length === 0) throw new Error('Serie vacía');
  return x.reduce((a, b) => a + b, 0) / x.length;
}

/** Varianza muestral (divisor n − 1), como VAR.S de las hojas de cálculo. */
export function varianzaMuestral(x) {
  if (!Array.isArray(x) || x.length < 2) throw new Error('Se necesitan al menos 2 observaciones');
  const m = media(x);
  return x.reduce((a, v) => a + (v - m) ** 2, 0) / (x.length - 1);
}

export function desviacionMuestral(x) {
  return Math.sqrt(varianzaMuestral(x));
}

/** Volatilidad anualizada: desviación típica × √(periodos por año). */
export function volatilidadAnualizada(rentabilidades, periodosPorAnio) {
  comprobarPeriodos(periodosPorAnio);
  return desviacionMuestral(rentabilidades) * Math.sqrt(periodosPorAnio);
}

// ---------------------------------------------------------------------------
// P-007 · Paridad cubierta de tipos de interés (forward de divisas)
// ---------------------------------------------------------------------------
/**
 * Forward por paridad cubierta, cotización indirecta del euro (unidades de divisa por 1 EUR):
 *   F = S · (1 + r_div · d / B_div) / (1 + r_eur · d / B_eur)
 */
export function forwardParidad({ spot, tipoEur, tipoDivisa, dias, baseEur = 'ACT/360', baseDivisa = 'ACT/360' }) {
  comprobarFinito(spot, 'spot');
  if (spot <= 0) throw new Error('El spot debe ser positivo');
  return (spot * factorSimple(tipoDivisa, dias, baseDivisa)) / factorSimple(tipoEur, dias, baseEur);
}

// ---------------------------------------------------------------------------
// P-008 · Conversión con tipo de referencia y redondeo
// ---------------------------------------------------------------------------
/** Redondeo a `decimales` alejándose de cero en el medio (como REDONDEAR de las hojas de cálculo). */
export function redondear(x, decimales = 2) {
  comprobarFinito(x, 'valor');
  const s = Math.sign(x) || 1;
  const v = Math.abs(x);
  return s * Number(Math.round(Number(`${v}e${decimales}`)) + `e-${decimales}`);
}

/**
 * Conversión con un tipo expresado como unidades de divisa por 1 EUR (convención BCE).
 * sentido: 'EUR->DIV' (multiplica) o 'DIV->EUR' (divide).
 */
export function convertirConReferencia(importe, tipo, sentido, decimales = 2) {
  comprobarFinito(importe, 'importe'); comprobarFinito(tipo, 'tipo de cambio');
  if (tipo <= 0) throw new Error('El tipo de cambio debe ser positivo');
  if (sentido === 'EUR->DIV') return redondear(importe * tipo, decimales);
  if (sentido === 'DIV->EUR') return redondear(importe / tipo, decimales);
  throw new Error(`Sentido no válido: ${sentido}`);
}

// ---------------------------------------------------------------------------
// P-009 · Coste efectivo de una operación de un único flujo
// ---------------------------------------------------------------------------
/** Tipo efectivo anual compuesto (base 365) entre lo recibido hoy y lo pagado en `dias`. */
export function costeEfectivoAnual(recibido, pagado, dias) {
  comprobarFinito(recibido, 'efectivo'); comprobarFinito(pagado, 'nominal'); comprobarFinito(dias, 'días');
  if (recibido <= 0 || pagado <= 0) throw new Error('Importes no válidos');
  if (dias <= 0) throw new Error('Los días deben ser positivos');
  return (pagado / recibido) ** (365 / dias) - 1;
}

// ---------------------------------------------------------------------------
// Validaciones comunes
// ---------------------------------------------------------------------------
function comprobarFinito(x, nombre) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error(`Valor no válido en ${nombre}`);
}
function comprobarPeriodos(n) {
  if (!Number.isInteger(n) || n <= 0) throw new Error('El número de periodos debe ser un entero positivo');
}
function comprobarFlujos(flujos) {
  if (!Array.isArray(flujos) || flujos.length < 2) throw new Error('Se necesitan al menos 2 flujos');
  flujos.forEach((f) => comprobarFinito(f, 'flujos'));
}
function comprobarPrecios(precios) {
  if (!Array.isArray(precios) || precios.length < 2) throw new Error('Se necesitan al menos 2 precios');
  precios.forEach((p) => {
    comprobarFinito(p, 'precios');
    if (p <= 0) throw new Error('Los precios deben ser positivos');
  });
}
