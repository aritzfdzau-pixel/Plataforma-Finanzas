// Contraste WCAG 2.x entre dos colores hexadecimales (#RRGGBB).
// Fórmulas: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
//           https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio

export function hexARgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Color no válido: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminanciaRelativa(hex) {
  const [r, g, b] = hexARgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratioContraste(a, b) {
  const [l1, l2] = [luminanciaRelativa(a), luminanciaRelativa(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Extrae las variables --x: #hex de un bloque CSS cuyo selector contiene `selector`.
export function tokensDeBloque(css, selector) {
  const re = /([^{}]+)\{([^{}]*)\}/g;
  const out = {};
  let m;
  while ((m = re.exec(css))) {
    const selectores = m[1].split(',').map((s) => s.replace(/\/\*[\s\S]*?\*\//g, '').trim());
    if (!selectores.includes(selector)) continue;
    for (const [, nombre, valor] of m[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
      out[nombre] = valor;
    }
  }
  return out;
}
