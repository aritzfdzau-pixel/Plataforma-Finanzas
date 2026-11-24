// Escalas y marcas de eje para las gráficas SVG propias. Puro (sin DOM).

/** Paso "redondo" (1, 2, 2,5 o 5 × 10^k) para unas ~n divisiones del rango. */
export function pasoRedondo(rango, n = 5) {
  if (!(rango > 0)) return 1;
  const bruto = rango / n;
  const e = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / e;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * e;
}

/** Marcas del eje Y que cubren [min, max] con paso redondo. */
export function marcasY(min, max, n = 5) {
  if (min === max) { const d = Math.abs(min) * 0.01 || 1; min -= d; max += d; }
  const paso = pasoRedondo(max - min, n);
  const ini = Math.floor(min / paso) * paso;
  const fin = Math.ceil(max / paso) * paso;
  const out = [];
  for (let v = ini; v <= fin + paso / 2; v += paso) out.push(Number(v.toPrecision(12)));
  return { marcas: out, min: ini, max: fin, paso };
}

/** Decimales necesarios para mostrar las marcas de un paso (0,25 → 2; 5 → 0). */
export function decimalesDePaso(paso) {
  const t = String(Number(paso.toPrecision(6)));
  return t.includes('.') ? t.split('.')[1].length : 0;
}

/** Índices de ~n fechas repartidas para el eje X (incluye la primera y la última). */
export function marcasX(total, n = 6) {
  if (total <= 0) return [];
  if (total <= n) return [...Array(total).keys()];
  const out = new Set();
  for (let k = 0; k < n; k++) out.add(Math.round((k * (total - 1)) / (n - 1)));
  return [...out];
}

/** Índice del punto más cercano a una posición x (0…ancho) en una serie de `total` puntos. */
export function indiceCercano(x, ancho, total) {
  if (total <= 1) return 0;
  return Math.max(0, Math.min(total - 1, Math.round((x / ancho) * (total - 1))));
}

/** Rebaja una serie larga a como mucho `max` puntos (para dibujar), conservando el último. */
export function submuestrear(n, max = 800) {
  if (n <= max) return [...Array(n).keys()];
  const paso = (n - 1) / (max - 1);
  const out = [];
  for (let k = 0; k < max; k++) out.push(Math.round(k * paso));
  return [...new Set(out)];
}
