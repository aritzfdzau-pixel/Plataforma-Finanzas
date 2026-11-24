// Exportación de tablas a CSV para hojas de cálculo en español. Puro (sin DOM).
// Separador ";", decimal ",", sin separador de miles, fin de línea CRLF y BOM UTF-8.

function decimalesDe(formato) {
  const m = /:(\d+)$/.exec(formato ?? '');
  return m ? Number(m[1]) : formato === 'entero' ? 0 : 2;
}

export function celdaCsv(valor, formato) {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return '';
    const esPct = (formato ?? '').startsWith('pct');
    const v = esPct ? valor * 100 : valor;
    return v.toFixed(decimalesDe(formato)).replace('.', ',').replace(/^-(0,?0*)$/, '$1');
  }
  const t = String(valor ?? '');
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** tabla: { columnas: [{id, etiqueta, formato}], filas: [{...}] } */
export function tablaACsv(tabla) {
  const cab = tabla.columnas.map((c) => celdaCsv((c.formato ?? '').startsWith('pct') ? `${c.etiqueta} (%)` : c.etiqueta));
  const filas = tabla.filas.map((f) => tabla.columnas.map((c) => celdaCsv(f[c.id], c.formato)).join(';'));
  return `﻿${[cab.join(';'), ...filas].join('\r\n')}\r\n`;
}
