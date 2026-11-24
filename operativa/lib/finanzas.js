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
