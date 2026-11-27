// Informe de una operación en Markdown (para descargarlo). Puro: sin DOM.
// `inf`: { titulo, subtitulo, resumen: [frases], conclusion, columnas: [...], bloques: [{ titulo, filas: [[celdas]], comentarios: [...] }], aviso }

const celda = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function informeAMarkdown(inf) {
  const l = [`# ${inf.titulo}`, '', `_${inf.subtitulo}_`, '', '## Resumen', ''];
  for (const f of inf.resumen) l.push(`- ${f}`);
  l.push('', `**Conclusión:** ${inf.conclusion}`, '');
  for (const b of inf.bloques) {
    l.push(`## ${b.titulo}`, '', `| ${inf.columnas.map(celda).join(' | ')} |`, `| ${inf.columnas.map(() => '---').join(' | ')} |`);
    for (const f of b.filas) l.push(`| ${f.map(celda).join(' | ')} |`);
    if (b.comentarios?.length) { l.push(''); for (const c of b.comentarios) l.push(`- ${c}`); }
    l.push('');
  }
  l.push('---', '', `_${inf.aviso}_`, '');
  return l.join('\n');
}
