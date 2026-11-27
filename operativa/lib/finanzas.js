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
// P-011 · Medias móviles y diferencias
// ---------------------------------------------------------------------------
/** Media móvil simple de n periodos; null en los n − 1 primeros (como PROMEDIO() deslizante). */
export function mediaMovil(x, n) {
  comprobarSerie(x, 1);
  comprobarPeriodos(n);
  const salida = new Array(x.length).fill(null);
  let suma = 0;
  for (let t = 0; t < x.length; t++) {
    suma += x[t];
    if (t >= n) suma -= x[t - n];
    if (t >= n - 1) salida[t] = suma / n;
  }
  return salida;
}

/** Diferencias x_t − x_{t−1} (para series de tipos de interés, en las que no hay "rentabilidad"). */
export function diferencias(x) {
  comprobarSerie(x, 2);
  return x.slice(1).map((v, k) => v - x[k]);
}

// ---------------------------------------------------------------------------
// P-012 · Volatilidad EWMA (RiskMetrics)
// ---------------------------------------------------------------------------
/**
 * Varianza con media exponencial (media de rentabilidades supuesta 0):
 *   σ²_1 = r_1²;   σ²_t = λ·σ²_{t−1} + (1 − λ)·r_t²   (t = 2…n)
 * σ²_n es la estimación para el periodo siguiente. λ = 0,94 (RiskMetrics, datos diarios).
 * @returns {{ varianzas: number[], volatilidad: number, anualizada: number|null }}
 */
export function volatilidadEWMA(rentabilidades, lambda = 0.94, periodosPorAnio = null) {
  comprobarSerie(rentabilidades, 2);
  comprobarFinito(lambda, 'lambda');
  if (!(lambda > 0 && lambda < 1)) throw new Error('λ debe estar entre 0 y 1');
  const varianzas = [rentabilidades[0] ** 2];
  for (let t = 1; t < rentabilidades.length; t++) {
    varianzas.push(lambda * varianzas[t - 1] + (1 - lambda) * rentabilidades[t] ** 2);
  }
  const ultima = varianzas.at(-1);
  if (periodosPorAnio !== null) comprobarPeriodos(periodosPorAnio);
  return {
    varianzas,
    volatilidad: Math.sqrt(ultima),
    anualizada: periodosPorAnio === null ? null : Math.sqrt(ultima * periodosPorAnio),
  };
}

// ---------------------------------------------------------------------------
// P-013 · Correlación de Pearson
// ---------------------------------------------------------------------------
/** Coeficiente de correlación de Pearson, como COEF.DE.CORREL()/CORREL(). */
export function correlacion(x, y) {
  comprobarSerie(x, 2);
  comprobarSerie(y, 2);
  if (x.length !== y.length) throw new Error('Las dos series deben tener la misma longitud');
  const mx = media(x);
  const my = media(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let k = 0; k < x.length; k++) {
    sxy += (x[k] - mx) * (y[k] - my);
    sxx += (x[k] - mx) ** 2;
    syy += (y[k] - my) ** 2;
  }
  if (sxx === 0 || syy === 0) throw new Error('Una serie constante no tiene correlación');
  return sxy / Math.sqrt(sxx * syy);
}

// ---------------------------------------------------------------------------
// P-014 · Máximo drawdown
// ---------------------------------------------------------------------------
/**
 * Mayor caída desde un máximo previo: min_t (P_t / max_{s≤t} P_s − 1). Valor ≤ 0.
 * @returns {{ drawdown: number, pico: number, valle: number }}  índices del pico y del valle
 */
export function maximoDrawdown(precios) {
  comprobarPrecios(precios);
  let pico = 0, mejor = { drawdown: 0, pico: 0, valle: 0 };
  for (let t = 1; t < precios.length; t++) {
    if (precios[t] > precios[pico]) pico = t;
    const dd = precios[t] / precios[pico] - 1;
    if (dd < mejor.drawdown) mejor = { drawdown: dd, pico, valle: t };
  }
  return mejor;
}

// ---------------------------------------------------------------------------
// P-015 · Simulación Montecarlo (paseo aleatorio) y cuantiles
// ---------------------------------------------------------------------------
/** Cuantil con interpolación lineal, como PERCENTIL.INC()/PERCENTILE.INC() (p entre 0 y 1). */
export function cuantil(x, p) {
  comprobarSerie(x, 1);
  if (!(p >= 0 && p <= 1)) throw new Error('El percentil debe estar entre 0 y 1');
  const o = Float64Array.from(x).sort();
  const pos = p * (o.length - 1);
  const i = Math.floor(pos);
  return i + 1 < o.length ? o[i] + (pos - i) * (o[i + 1] - o[i]) : o[i];
}

/** z de la normal estándar para el 95 % (bandas 5 %–95 %): DISTR.NORM.ESTAND.INV(0,95). */
export const Z_95 = 1.6448536269514722;

/** Generador pseudoaleatorio reproducible (mulberry32): misma semilla, mismos números. */
export function generadorAleatorio(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar por Box-Muller a partir de un generador uniforme. */
export function generadorNormal(uniforme) {
  let reserva = null;
  return () => {
    if (reserva !== null) { const r = reserva; reserva = null; return r; }
    let u = 0;
    while (u <= Number.EPSILON) u = uniforme();
    const v = uniforme();
    const radio = Math.sqrt(-2 * Math.log(u));
    reserva = radio * Math.sin(2 * Math.PI * v);
    return radio * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Montecarlo de un paseo aleatorio con deriva.
 *   modelo 'log' (precios):     ln S_{t+1} = ln S_t + μ + σ·Z   (μ, σ de las rentabilidades log)
 *   modelo 'aditivo' (tipos):   X_{t+1}   = X_t   + μ + σ·Z    (μ, σ de las diferencias)
 * Devuelve los percentiles 5, 25, 50, 75 y 95 en cada paso (índice 0 = valor inicial).
 */
export function simularMontecarlo({ inicial, media: mu, desviacion: sigma, horizonte, trayectorias = 2000, modelo = 'log', semilla = 1 }) {
  comprobarFinito(inicial, 'valor inicial');
  comprobarFinito(mu, 'media');
  comprobarFinito(sigma, 'desviación');
  if (sigma < 0) throw new Error('La desviación no puede ser negativa');
  comprobarPeriodos(horizonte);
  comprobarPeriodos(trayectorias);
  if (modelo === 'log' && inicial <= 0) throw new Error('El modelo logarítmico necesita un valor inicial positivo');
  if (!['log', 'aditivo'].includes(modelo)) throw new Error('Modelo no válido');
  const z = generadorNormal(generadorAleatorio(semilla));
  const pasos = Array.from({ length: horizonte }, () => new Float64Array(trayectorias));
  for (let j = 0; j < trayectorias; j++) {
    let x = modelo === 'log' ? Math.log(inicial) : inicial;
    for (let t = 0; t < horizonte; t++) {
      x += mu + sigma * z();
      pasos[t][j] = modelo === 'log' ? Math.exp(x) : x;
    }
  }
  const P = [0.05, 0.25, 0.5, 0.75, 0.95];
  const percentiles = Object.fromEntries(P.map((p) => [Math.round(p * 100), [inicial]]));
  for (const paso of pasos) {
    paso.sort();
    for (const p of P) {
      const pos = p * (trayectorias - 1), i = Math.floor(pos);
      percentiles[Math.round(p * 100)].push(i + 1 < trayectorias ? paso[i] + (pos - i) * (paso[i + 1] - paso[i]) : paso[i]);
    }
  }
  return { percentiles, finales: Array.from(pasos.at(-1)) };
}

/** Banda analítica equivalente al Montecarlo (para validar y para los tests). */
export function bandaAnalitica({ inicial, media: mu, desviacion: sigma, horizonte, modelo = 'log', z = Z_95 }) {
  const centro = mu * horizonte, ancho = z * sigma * Math.sqrt(horizonte);
  if (modelo === 'log') return { mediana: inicial * Math.exp(centro), inferior: inicial * Math.exp(centro - ancho), superior: inicial * Math.exp(centro + ancho) };
  return { mediana: inicial + centro, inferior: inicial + centro - ancho, superior: inicial + centro + ancho };
}

// ---------------------------------------------------------------------------
// P-016 · Errores de proyección y validación frente al paseo aleatorio
// ---------------------------------------------------------------------------
/** Error medio absoluto: media de |real − proyectado|. */
export function errorMedioAbsoluto(reales, proyectados) {
  comprobarPares(reales, proyectados);
  return reales.reduce((a, r, k) => a + Math.abs(r - proyectados[k]), 0) / reales.length;
}

/** Raíz del error cuadrático medio: √(media de (real − proyectado)²). */
export function raizErrorCuadraticoMedio(reales, proyectados) {
  comprobarPares(reales, proyectados);
  return Math.sqrt(reales.reduce((a, r, k) => a + (r - proyectados[k]) ** 2, 0) / reales.length);
}

/**
 * Validación con datos pasados (origen móvil): en cada origen t se estiman μ y σ con las
 * `ventana` observaciones anteriores y se proyecta a `horizonte` periodos:
 *   - modelo: mediana (con deriva μ si `conTendencia`) y banda 5 %–95 %;
 *   - paseo aleatorio: el último valor conocido (sin cambio).
 * Se comparan con el valor real en t + horizonte. U de Theil = RMSE modelo / RMSE paseo aleatorio
 * (< 1: el modelo mejora al paseo aleatorio). Cobertura: % de reales dentro de la banda (ideal ≈ 90 %).
 */
export function validarFrenteAPaseoAleatorio(valores, { horizonte, ventana = 250, modelo = 'log', conTendencia = true, paso = null }) {
  comprobarSerie(valores, 3);
  comprobarPeriodos(horizonte);
  comprobarPeriodos(ventana);
  const salto = paso ?? horizonte;
  const reales = [], proyModelo = [], proyPaseo = [], fechas = [];
  let dentro = 0;
  for (let t = ventana; t + horizonte < valores.length; t += salto) {
    const tramo = valores.slice(t - ventana, t + 1);
    const variaciones = modelo === 'log' ? rentabilidadesLog(tramo) : diferencias(tramo);
    const mu = conTendencia ? media(variaciones) : 0;
    const sigma = desviacionMuestral(variaciones);
    const b = bandaAnalitica({ inicial: valores[t], media: mu, desviacion: sigma, horizonte, modelo });
    const real = valores[t + horizonte];
    reales.push(real); proyModelo.push(b.mediana); proyPaseo.push(valores[t]); fechas.push(t);
    if (real >= b.inferior && real <= b.superior) dentro++;
  }
  if (reales.length < 3) throw new Error('Pocos datos para validar: amplía la serie o reduce la ventana o el horizonte');
  const rmseModelo = raizErrorCuadraticoMedio(reales, proyModelo);
  const rmsePaseo = raizErrorCuadraticoMedio(reales, proyPaseo);
  return {
    origenes: reales.length,
    maeModelo: errorMedioAbsoluto(reales, proyModelo),
    maePaseo: errorMedioAbsoluto(reales, proyPaseo),
    rmseModelo,
    rmsePaseo,
    theilU: rmsePaseo > 0 ? rmseModelo / rmsePaseo : null,
    cobertura: dentro / reales.length,
    indices: fechas, reales, proyModelo, proyPaseo,
  };
}

// ---------------------------------------------------------------------------
// P-017 · Escenarios de tipo de cambio
// ---------------------------------------------------------------------------
/**
 * Contravalor en EUR de un importe en divisa con el tipo EUR/divisa (divisa por 1 EUR) y con
 * el tipo tras un movimiento relativo `movimiento` (−0,05 = el euro se deprecia un 5 %).
 */
export function escenarioTipoCambio({ importeDivisa, tipo, movimiento }) {
  comprobarFinito(importeDivisa, 'importe');
  comprobarFinito(tipo, 'tipo de cambio');
  comprobarFinito(movimiento, 'movimiento');
  if (tipo <= 0) throw new Error('El tipo de cambio debe ser positivo');
  if (movimiento <= -1) throw new Error('El movimiento debe ser mayor que −100 %');
  const tipoEscenario = tipo * (1 + movimiento);
  const actual = importeDivisa / tipo;
  const escenario = importeDivisa / tipoEscenario;
  return { tipoEscenario, actual, escenario, diferencia: escenario - actual };
}

// ---------------------------------------------------------------------------
// P-018 · Ratios de estados financieros
// ---------------------------------------------------------------------------
/** Cociente o null si el denominador es 0 (la operación decide cómo explicarlo). */
export function cociente(a, b) {
  comprobarFinito(a, 'numerador'); comprobarFinito(b, 'denominador');
  return b === 0 ? null : a / b;
}

/**
 * Ratios de un ejercicio. Importes en la misma unidad (EUR o miles de EUR).
 * Devuelve null en los ratios cuyo denominador es 0.
 */
export function ratiosFinancieros(d) {
  const campos = ['ventas', 'ebit', 'amortizaciones', 'gastosFinancieros', 'beneficioNeto', 'deudaCorto',
    'deudaLargo', 'caja', 'fondosPropios', 'activoTotal', 'activoCorriente', 'pasivoCorriente', 'flujoServicioDeuda', 'servicioDeuda'];
  for (const c of campos) comprobarFinito(d[c], c);
  const inversionesCorto = d.inversionesCorto ?? 0; // inversiones financieras a corto (opcional)
  comprobarFinito(inversionesCorto, 'inversiones financieras a corto');
  const pasivo = d.activoTotal - d.fondosPropios; // pasivo exigible = activo − patrimonio neto
  const ebitda = d.ebit + d.amortizaciones;
  const deudaFinanciera = d.deudaCorto + d.deudaLargo;
  const dfn = deudaFinanciera - d.caja;
  return {
    ebitda,
    margenEbitda: cociente(ebitda, d.ventas),
    margenNeto: cociente(d.beneficioNeto, d.ventas),
    deudaFinanciera,
    dfn,
    dfnEbitda: ebitda > 0 ? dfn / ebitda : null, // con EBITDA ≤ 0 el ratio no es significativo
    deudaEbitda: ebitda > 0 ? deudaFinanciera / ebitda : null, // deuda financiera bruta / EBITDA
    pasivo,
    endeudamiento: d.fondosPropios > 0 ? pasivo / d.fondosPropios : null, // pasivo / patrimonio neto
    solvencia: pasivo > 0 ? d.activoTotal / pasivo : null, // activo / pasivo exigible
    autonomiaFinanciera: cociente(d.fondosPropios, d.activoTotal),
    fondoManiobra: d.activoCorriente - d.pasivoCorriente,
    liquidez: cociente(d.activoCorriente, d.pasivoCorriente),
    tesoreria: cociente(d.caja + inversionesCorto, d.pasivoCorriente), // (disponible + inversiones a corto) / PC
    tesoreriaNeta: d.caja - d.deudaCorto,
    dscr: cociente(d.flujoServicioDeuda, d.servicioDeuda),
    coberturaIntereses: cociente(ebitda, d.gastosFinancieros),
    roe: d.fondosPropios > 0 ? d.beneficioNeto / d.fondosPropios : null, // FP ≤ 0: no significativo
    roa: cociente(d.beneficioNeto, d.activoTotal),
  };
}

/** Tasa de variación (V_t − V_t−1) / V_t−1; null si el valor anterior es 0. */
export function crecimiento(actual, anterior) {
  comprobarFinito(actual, 'valor actual'); comprobarFinito(anterior, 'valor anterior');
  return anterior === 0 ? null : (actual - anterior) / Math.abs(anterior);
}

// ---------------------------------------------------------------------------
// P-019 · Semáforo orientativo de endeudamiento y cobertura de la deuda
// ---------------------------------------------------------------------------
// Umbrales: referencias generales de mercado, no criterios de ningún banco (D-029).
export const UMBRALES_DFN_EBITDA = Object.freeze({ comodo: 3, elevado: 5 });
export const UMBRALES_DSCR = Object.freeze({ noCubre: 1, aceptable: 1.2 });

/** nivel: 'ok' | 'vigilancia' | 'alto' | 'nd' (no significativo). */
export function semaforoDfnEbitda({ dfn, ebitda }) {
  comprobarFinito(dfn, 'DFN'); comprobarFinito(ebitda, 'EBITDA');
  if (ebitda <= 0) return { nivel: 'nd', texto: 'no significativo (EBITDA ≤ 0)' };
  if (dfn < 0) return { nivel: 'ok', texto: 'caja neta positiva' };
  const r = dfn / ebitda;
  if (r < UMBRALES_DFN_EBITDA.comodo) return { nivel: 'ok', texto: 'cómodo' };
  if (r < UMBRALES_DFN_EBITDA.elevado) return { nivel: 'vigilancia', texto: 'zona de vigilancia' };
  return { nivel: 'alto', texto: 'elevado' };
}

export function semaforoDscr(dscr) {
  if (dscr === null) return { nivel: 'nd', texto: 'no calculable (sin cuotas de deuda)' };
  comprobarFinito(dscr, 'DSCR');
  if (dscr >= UMBRALES_DSCR.aceptable) return { nivel: 'ok', texto: 'aceptable' };
  if (dscr < UMBRALES_DSCR.noCubre) return { nivel: 'alto', texto: 'no cubre el servicio de la deuda' };
  return { nivel: 'vigilancia', texto: 'ajustado' };
}

// ---------------------------------------------------------------------------
// P-026 · Valoración de ratios frente a rangos orientativos y evolución entre dos años
// ---------------------------------------------------------------------------
// Rangos: referencias generales de manuales de análisis de estados financieros; dependen del
// sector y del tamaño, y NO son criterios de ningún banco (D-042). ⚠️ Pendiente de verificar.
// mejor: 'alto' (cuanto más, mejor) o 'bajo' (cuanto menos, mejor). Cada tramo: [desde, nivel]
// en orden creciente; el último tramo cuyo «desde» sea ≤ valor es el que aplica.
export const RANGOS_RATIOS = Object.freeze({
  ebitda: { texto: '> 0', mejor: 'alto', tramos: [[-Infinity, 'alto'], [Number.MIN_VALUE, 'ok']] },
  margenEbitda: { texto: '≥ 10 % (según sector)', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0.05, 'vigilancia'], [0.10, 'ok']] },
  margenNeto: { texto: '≥ 5 %', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0, 'vigilancia'], [0.05, 'ok']] },
  crecimientoVentas: { texto: '≥ 0 % (idealmente por encima de la inflación)', mejor: 'alto', tramos: [[-Infinity, 'alto'], [-0.05, 'vigilancia'], [0, 'ok']] },
  dfnEbitda: { texto: '< 3x (3x–5x vigilancia; ≥ 5x elevado)', mejor: 'bajo', tramos: [[-Infinity, 'ok'], [3, 'vigilancia'], [5, 'alto']] },
  deudaEbitda: { texto: '< 3,5x', mejor: 'bajo', tramos: [[-Infinity, 'ok'], [3.5, 'vigilancia'], [5, 'alto']] },
  endeudamiento: { texto: '0,7 – 1,5 (≤ 1,5)', mejor: 'bajo', tramos: [[-Infinity, 'ok'], [1.5, 'vigilancia'], [2.5, 'alto']] },
  solvencia: { texto: '≥ 1,5', mejor: 'alto', tramos: [[-Infinity, 'alto'], [1, 'vigilancia'], [1.5, 'ok']] },
  autonomiaFinanciera: { texto: '≥ 30 %', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0.2, 'vigilancia'], [0.3, 'ok']] },
  liquidez: { texto: '1,5 – 2,0', mejor: 'alto', tramos: [[-Infinity, 'alto'], [1, 'vigilancia'], [1.5, 'ok']] },
  tesoreria: { texto: '0,1 – 0,3', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0.05, 'vigilancia'], [0.1, 'ok']] },
  fondoManiobra: { texto: '> 0', mejor: 'alto', tramos: [[-Infinity, 'alto'], [Number.MIN_VALUE, 'ok']] },
  tesoreriaNeta: { texto: '≥ 0 (la caja cubre la deuda a corto)', mejor: 'alto', tramos: [[-Infinity, 'vigilancia'], [0, 'ok']] },
  dscr: { texto: '≥ 1,20x (< 1,00x no cubre)', mejor: 'alto', tramos: [[-Infinity, 'alto'], [1, 'vigilancia'], [1.2, 'ok']] },
  coberturaIntereses: { texto: '≥ 3x', mejor: 'alto', tramos: [[-Infinity, 'alto'], [1.5, 'vigilancia'], [3, 'ok']] },
  roe: { texto: '≥ 8 % (por encima del coste del capital)', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0, 'vigilancia'], [0.08, 'ok']] },
  roa: { texto: '≥ 5 %', mejor: 'alto', tramos: [[-Infinity, 'alto'], [0, 'vigilancia'], [0.05, 'ok']] },
});

const TEXTO_NIVEL = { ok: 'dentro del rango recomendado', vigilancia: 'en zona de vigilancia', alto: 'fuera del rango recomendado', nd: 'no significativo' };

/** Valoración de un ratio: { nivel: 'ok'|'vigilancia'|'alto'|'nd', texto, rango }. */
export function valorarRatio(id, valor) {
  const r = RANGOS_RATIOS[id];
  if (!r) throw new Error(`Ratio sin rango: ${id}`);
  if (valor === null || valor === undefined) return { nivel: 'nd', texto: TEXTO_NIVEL.nd, rango: r.texto };
  comprobarFinito(valor, id);
  let nivel = r.tramos[0][1];
  for (const [desde, n] of r.tramos) if (valor >= desde) nivel = n;
  return { nivel, texto: TEXTO_NIVEL[nivel], rango: r.texto };
}

/**
 * Evolución de un ratio entre el año anterior y el actual: diferencia (actual − anterior) y si
 * mejora según el sentido del ratio (null si no se puede comparar o no cambia).
 */
export function evolucionRatio(id, actual, anterior) {
  const r = RANGOS_RATIOS[id];
  if (!r) throw new Error(`Ratio sin rango: ${id}`);
  if (!Number.isFinite(actual) || !Number.isFinite(anterior)) return { diferencia: null, mejora: null };
  const diferencia = actual - anterior;
  if (Math.abs(diferencia) < 1e-12) return { diferencia: 0, mejora: null };
  return { diferencia, mejora: r.mejor === 'alto' ? diferencia > 0 : diferencia < 0 };
}

// ---------------------------------------------------------------------------
// P-020 · Periodos medios, ciclo de caja y NOF
// ---------------------------------------------------------------------------
/**
 * Periodos medios en días. Si los saldos de clientes y proveedores incluyen IVA, se dividen
 * entre (1 + iva) para compararlos con ventas y compras (sin IVA). Existencias, sin IVA.
 */
export function periodosMedios({ ventas, compras, costeVentas, clientes, proveedores, existencias, dias = 365, iva = 0 }) {
  for (const [v, n] of [[ventas, 'ventas'], [compras, 'compras'], [costeVentas, 'coste de ventas']]) {
    comprobarFinito(v, n);
    if (v <= 0) throw new Error(`${n}: debe ser mayor que 0 (es el denominador)`);
  }
  for (const [v, n] of [[clientes, 'clientes'], [proveedores, 'proveedores'], [existencias, 'existencias'], [iva, 'IVA']]) {
    comprobarFinito(v, n);
    if (v < 0) throw new Error(`${n}: no puede ser negativo`);
  }
  comprobarFinito(dias, 'días');
  if (dias <= 0) throw new Error('Los días del periodo deben ser mayores que 0');
  const pmc = (clientes / (1 + iva)) / ventas * dias;
  const pmp = (proveedores / (1 + iva)) / compras * dias;
  const pma = existencias / costeVentas * dias;
  return { pmc, pmp, pma, cicloMaduracion: pma + pmc, cicloCaja: pma + pmc - pmp };
}

/** NOF = existencias + clientes + tesorería operativa − proveedores − otros acreedores operativos. */
export function necesidadesOperativas({ existencias, clientes, proveedores, tesoreriaOperativa = 0, otrosAcreedores = 0 }) {
  for (const [v, n] of [[existencias, 'existencias'], [clientes, 'clientes'], [proveedores, 'proveedores'],
    [tesoreriaOperativa, 'tesorería operativa'], [otrosAcreedores, 'otros acreedores']]) {
    comprobarFinito(v, n);
    if (v < 0) throw new Error(`${n}: no puede ser negativo`);
  }
  return existencias + clientes + tesoreriaOperativa - proveedores - otrosAcreedores;
}

// ---------------------------------------------------------------------------
// P-021 · Coste de una póliza de crédito (línea de crédito)
// ---------------------------------------------------------------------------
/**
 * Convención: m liquidaciones al año; cada periodo dura 365/m días (año de 365 días, sin
 * bisiestos) y sus intereses son saldo · tipo · (365/m) / base. Las comisiones de apertura y
 * estudio se pagan al inicio sobre el límite. La de no disponibilidad se liquida con los
 * intereses sobre (límite − saldo medio dispuesto). Coste efectivo anual: TIR de los flujos
 * (P-004) anualizada (P-003), tomando como financiación el saldo medio dispuesto (+ excedido).
 */
export function costePolizaCredito({ limite, meses, tipo, saldoMedio, apertura = 0, estudio = 0, noDisponibilidad = 0,
  periodosAnio = 4, base = 'ACT/360', tipoExcedido = 0, saldoExcedido = 0 }) {
  for (const [v, n] of [[limite, 'límite'], [saldoMedio, 'saldo medio dispuesto']]) {
    comprobarFinito(v, n);
    if (v <= 0) throw new Error(`${n}: debe ser mayor que 0`);
  }
  if (saldoMedio > limite) throw new Error('El saldo medio dispuesto no puede superar el límite (usa el excedido)');
  for (const [v, n] of [[tipo, 'tipo deudor'], [apertura, 'comisión de apertura'], [estudio, 'comisión de estudio'],
    [noDisponibilidad, 'comisión de no disponibilidad'], [tipoExcedido, 'tipo de excedido'], [saldoExcedido, 'saldo excedido']]) {
    comprobarFinito(v, n);
    if (v < 0) throw new Error(`${n}: no puede ser negativo`);
  }
  if (![12, 4].includes(periodosAnio)) throw new Error('Liquidación mensual (12) o trimestral (4)');
  if (!Number.isInteger(meses) || meses <= 0 || (meses * periodosAnio) % 12 !== 0) {
    throw new Error('El plazo en meses debe ser un número entero de periodos de liquidación');
  }
  const n = (meses * periodosAnio) / 12;
  const fraccion = fraccionAnio(365 / periodosAnio, base);
  const interesesPeriodo = saldoMedio * tipo * fraccion;
  const noDispPeriodo = (limite - saldoMedio) * noDisponibilidad * fraccion;
  const excedidoPeriodo = saldoExcedido * tipoExcedido * fraccion;
  const pagoPeriodo = interesesPeriodo + noDispPeriodo + excedidoPeriodo;
  const comisionApertura = limite * apertura;
  const comisionEstudio = limite * estudio;
  const financiado = saldoMedio + saldoExcedido;
  const flujos = [financiado - comisionApertura - comisionEstudio, ...Array(n).fill(-pagoPeriodo)];
  flujos[n] -= financiado;
  const r = tir(flujos);
  return {
    periodos: n,
    interesesPeriodo,
    intereses: interesesPeriodo * n,
    interesesExcedido: excedidoPeriodo * n,
    comisionApertura,
    comisionEstudio,
    comisionNoDisponibilidad: noDispPeriodo * n,
    costeTotal: pagoPeriodo * n + comisionApertura + comisionEstudio,
    costeEfectivo: r.tir === null ? null : periodicoAAnual(r.tir, periodosAnio),
  };
}

// ---------------------------------------------------------------------------
// P-022 · Comisiones periódicas con mínimo por periodo (avales y garantías)
// ---------------------------------------------------------------------------
/**
 * Comisión anual sobre un importe cobrada en m periodos al año; se cobra el periodo completo
 * aunque solo se use una parte (sin prorrata) y cada cobro tiene un mínimo.
 * Periodos = ⌈días / (365/m)⌉.
 */
export function comisionesPeriodicas({ importe, tasaAnual, dias, periodosAnio = 4, minimo = 0 }) {
  comprobarFinito(importe, 'importe');
  if (importe <= 0) throw new Error('El importe debe ser mayor que 0');
  comprobarFinito(tasaAnual, 'comisión'); comprobarFinito(minimo, 'mínimo');
  if (tasaAnual < 0 || minimo < 0) throw new Error('Comisión y mínimo no pueden ser negativos');
  if (!Number.isInteger(dias) || dias <= 0) throw new Error('El plazo debe ser un número entero de días mayor que 0');
  comprobarPeriodos(periodosAnio);
  const periodos = Math.ceil((dias * periodosAnio) / 365 - 1e-12);
  const calculada = (importe * tasaAnual) / periodosAnio;
  const comisionPeriodo = Math.max(calculada, minimo);
  return { periodos, comisionPeriodo, total: comisionPeriodo * periodos, aplicaMinimo: minimo > calculada };
}

// ---------------------------------------------------------------------------
// P-023 · Diferenciales de rentabilidad en puntos básicos (prima de riesgo, pendiente)
// ---------------------------------------------------------------------------
/** Diferencial en pb entre dos rentabilidades expresadas en % (3,25 − 2,60 = 65 pb). */
export function diferencialPb(rentabilidad, referencia) {
  comprobarFinito(rentabilidad, 'rentabilidad'); comprobarFinito(referencia, 'rentabilidad de referencia');
  return Math.round((rentabilidad - referencia) * 100 * 1e9) / 1e9; // evita 64,99999 por la coma flotante
}

/**
 * Serie de diferenciales en pb en las fechas comunes de dos series [[fecha, %], …] (prima de
 * riesgo = bono del país − Bund; pendiente = 10 años − 2 años).
 */
export function serieDiferencial(serie, referencia) {
  if (!Array.isArray(serie) || !Array.isArray(referencia)) throw new Error('Se necesitan dos series');
  const ref = new Map(referencia);
  return serie.filter(([f]) => ref.has(f)).map(([f, v]) => [f, diferencialPb(v, ref.get(f))]);
}

// ---------------------------------------------------------------------------
// P-024 · Precio de un bono a partir de su rentabilidad (TIR) y al revés
// ---------------------------------------------------------------------------
/**
 * Precio (por 100 de nominal) de un bono en fecha de cupón (sin cupón corrido): valor actual de
 * los cupones y del principal descontados a la TIR. `tir` y `cupon` anuales en tanto por uno;
 * `frecuencia` = cupones al año; `anios` × frecuencia debe ser entero.
 */
export function precioBono({ cupon, tir: y, anios, frecuencia = 1 }) {
  comprobarFinito(cupon, 'cupón'); comprobarFinito(y, 'TIR'); comprobarFinito(anios, 'años');
  if (cupon < 0) throw new Error('El cupón no puede ser negativo');
  const n = anios * frecuencia;
  if (!Number.isInteger(n) || n <= 0) throw new Error('Años × frecuencia debe ser un entero positivo');
  if (y / frecuencia <= -1) throw new Error('TIR no válida');
  const c = (100 * cupon) / frecuencia;
  const flujos = [0, ...Array(n - 1).fill(c), c + 100];
  return van(y / frecuencia, flujos);
}

/** TIR anual (con la misma frecuencia) que iguala el precio con los flujos del bono (P-004). */
export function tirBono({ precio, cupon, anios, frecuencia = 1 }) {
  comprobarFinito(precio, 'precio');
  if (precio <= 0) throw new Error('El precio debe ser mayor que 0');
  const n = anios * frecuencia;
  if (!Number.isInteger(n) || n <= 0) throw new Error('Años × frecuencia debe ser un entero positivo');
  const c = (100 * cupon) / frecuencia;
  const r = tir([-precio, ...Array(n - 1).fill(c), c + 100]);
  if (r.tir === null) throw new Error('No se ha podido calcular la TIR');
  return r.tir * frecuencia;
}

// ---------------------------------------------------------------------------
// P-025 · Rentabilidad acumulada y anualizada entre dos fechas
// ---------------------------------------------------------------------------
/** De un nivel inicial a uno final en `dias` naturales: acumulada y anualizada (base 365). */
export function rentabilidadAcumulada(inicial, final, dias) {
  comprobarFinito(inicial, 'nivel inicial'); comprobarFinito(final, 'nivel final'); comprobarFinito(dias, 'días');
  if (inicial <= 0 || final <= 0) throw new Error('Los niveles deben ser mayores que 0');
  if (dias <= 0) throw new Error('Los días deben ser mayores que 0');
  const acumulada = final / inicial - 1;
  return { acumulada, anualizada: (final / inicial) ** (365 / dias) - 1 };
}

// ---------------------------------------------------------------------------
// P-027 · Liquidación de una cuenta: saldos por tramos, números comerciales, saldo medio e
// intereses (método hamburgués)
// ---------------------------------------------------------------------------
/**
 * Cada movimiento cambia el saldo desde su día (fecha valor) incluido. `dia` es el número de días
 * desde el inicio del periodo (0 = primer día) y `dias` la duración total (días naturales).
 * Números comerciales = saldo × días; intereses = Σ números × tipo / divisor de la base.
 */
export function liquidacionCuenta({ saldoInicial, movimientos = [], dias, tipoAcreedor = 0, tipoDeudor = 0, base = 'ACT/365', retencion = 0 }) {
  comprobarFinito(saldoInicial, 'saldo inicial');
  comprobarFinito(tipoAcreedor, 'tipo acreedor'); comprobarFinito(tipoDeudor, 'tipo deudor'); comprobarFinito(retencion, 'retención');
  if (!Number.isInteger(dias) || dias <= 0) throw new Error('El periodo debe tener al menos 1 día');
  const divisor = BASES[base];
  if (!divisor) throw new Error(`Base de cálculo no soportada: ${base}`);
  const movs = movimientos.map((m, k) => {
    comprobarFinito(m.importe, 'importe');
    if (!Number.isInteger(m.dia) || m.dia < 0 || m.dia >= dias) throw new Error(`El movimiento ${k + 1} cae fuera del periodo`);
    return { dia: m.dia, importe: m.importe, k };
  }).sort((a, b) => a.dia - b.dia || a.k - b.k);
  const tramos = [];
  let saldo = saldoInicial;
  let desde = 0;
  let i = 0;
  while (desde < dias) {
    while (i < movs.length && movs[i].dia === desde) saldo += movs[i++].importe;
    const hasta = i < movs.length ? movs[i].dia : dias;
    tramos.push({ desde, hasta, dias: hasta - desde, saldo, numeros: saldo * (hasta - desde) });
    desde = hasta;
  }
  const numerosAcreedores = tramos.reduce((s, t) => s + Math.max(t.numeros, 0), 0);
  const numerosDeudores = tramos.reduce((s, t) => s + Math.max(-t.numeros, 0), 0);
  const interesesAcreedores = numerosAcreedores * tipoAcreedor / divisor;
  const interesesDeudores = numerosDeudores * tipoDeudor / divisor;
  const importeRetencion = interesesAcreedores * retencion;
  return {
    tramos, dias, saldoFinal: saldo,
    numerosAcreedores, numerosDeudores,
    saldoMedio: (numerosAcreedores - numerosDeudores) / dias,
    saldoMedioAcreedor: numerosAcreedores / dias,
    saldoMedioDeudor: numerosDeudores / dias,
    interesesAcreedores, retencion: importeRetencion, interesesNetos: interesesAcreedores - importeRetencion,
    interesesDeudores, liquidacion: interesesAcreedores - importeRetencion - interesesDeudores,
  };
}

// ---------------------------------------------------------------------------
// P-028 · Capitalización simple, compuesta y continua
// ---------------------------------------------------------------------------
/** Capital final de `capital` a `tipo` anual durante `anios` (simple, compuesta con m capitalizaciones al año o continua). */
export function capitalFinal({ capital, tipo, anios, regimen = 'compuesto', m = 1 }) {
  comprobarFinito(capital, 'capital'); comprobarFinito(tipo, 'tipo'); comprobarFinito(anios, 'años');
  if (anios < 0) throw new Error('El plazo no puede ser negativo');
  if (regimen === 'simple') return capital * (1 + tipo * anios);
  if (regimen === 'continuo') return capital * Math.exp(tipo * anios);
  if (regimen !== 'compuesto') throw new Error(`Régimen desconocido: ${regimen}`);
  if (!Number.isInteger(m) || m <= 0) throw new Error('Capitalizaciones al año no válidas');
  if (tipo / m <= -1) throw new Error('Tipo no válido');
  return capital * (1 + tipo / m) ** (m * anios);
}

// ---------------------------------------------------------------------------
// P-029 · Equivalencias de tipos: cambio de base y tipo de descuento ↔ tipo de interés
// ---------------------------------------------------------------------------
/** Tipo simple equivalente en otra base (mismos intereses en los mismos días): r · divisor(a) / divisor(de). */
export function cambioBase(tipo, de, a) {
  comprobarFinito(tipo, 'tipo');
  if (!BASES[de] || !BASES[a]) throw new Error('Base de cálculo no soportada');
  return tipo * BASES[a] / BASES[de];
}
/** Tipo de interés (vencido) equivalente a un tipo de descuento (anticipado): d / (1 − d·t). */
export function descuentoAInteres(d, dias, base = 'ACT/360') {
  const t = fraccionAnio(dias, base); comprobarFinito(d, 'tipo de descuento');
  if (d * t >= 1) throw new Error('El descuento no puede ser igual o mayor que el nominal');
  return d / (1 - d * t);
}
/** Tipo de descuento equivalente a un tipo de interés: i / (1 + i·t). */
export function interesADescuento(i, dias, base = 'ACT/360') {
  const t = fraccionAnio(dias, base); comprobarFinito(i, 'tipo de interés');
  if (1 + i * t <= 0) throw new Error('Tipo no válido');
  return i / (1 + i * t);
}

// ---------------------------------------------------------------------------
// P-030 · Tipo forward implícito y liquidación de un FRA
// ---------------------------------------------------------------------------
/** Tipo implícito entre dos plazos del mercado monetario (interés simple): ((1+r₂t₂)/(1+r₁t₁) − 1) / (t₂ − t₁). */
export function forwardImplicito({ tipoCorto, diasCorto, tipoLargo, diasLargo, base = 'ACT/360' }) {
  if (!(diasLargo > diasCorto)) throw new Error('El plazo largo debe ser mayor que el corto');
  const t1 = fraccionAnio(diasCorto, base); const t2 = fraccionAnio(diasLargo, base);
  return { forward: ((factorSimple(tipoLargo, diasLargo, base) / factorSimple(tipoCorto, diasCorto, base)) - 1) / (t2 - t1), dias: diasLargo - diasCorto };
}
/** Liquidación de un FRA al inicio del periodo (positivo = cobra el comprador): N·(L − K)·t / (1 + L·t). */
export function liquidacionFra({ nominal, tipoFra, tipoReferencia, dias, base = 'ACT/360' }) {
  comprobarFinito(nominal, 'nominal'); comprobarFinito(tipoFra, 'tipo FRA'); comprobarFinito(tipoReferencia, 'tipo de referencia');
  const t = fraccionAnio(dias, base);
  return nominal * (tipoReferencia - tipoFra) * t / (1 + tipoReferencia * t);
}

// ---------------------------------------------------------------------------
// P-031 · Tipo de interés real (ecuación de Fisher)
// ---------------------------------------------------------------------------
/** Tipo real exacto (1 + n) / (1 + π) − 1 y aproximación n − π. */
export function tipoReal(nominal, inflacion) {
  comprobarFinito(nominal, 'tipo nominal'); comprobarFinito(inflacion, 'inflación');
  if (inflacion <= -1) throw new Error('Inflación no válida');
  return { exacto: (1 + nominal) / (1 + inflacion) - 1, aproximado: nominal - inflacion };
}

// ---------------------------------------------------------------------------
// Validaciones comunes
// ---------------------------------------------------------------------------
function comprobarPares(a, b) {
  comprobarSerie(a, 1);
  comprobarSerie(b, 1);
  if (a.length !== b.length) throw new Error('Las series deben tener la misma longitud');
}
function comprobarSerie(x, minimo) {
  if (!Array.isArray(x) || x.length < minimo) throw new Error(`Se necesitan al menos ${minimo} observaciones`);
  x.forEach((v) => comprobarFinito(v, 'serie'));
}

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
