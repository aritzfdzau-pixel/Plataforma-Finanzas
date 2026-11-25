// Revisión mensual (fase 6): funciones puras que preparan el resumen de un mes a partir del
// historial de git, de decisiones.md y de los puntos "⚠️ Pendiente de verificar" del repo.
// Las usa scripts/resumen-mensual.js (tarea programada que abre el issue de la revisión).

/** "2026-11" → { desde: "2026-11-01", hasta: "2026-12-01" } (hasta exclusivo). */
export function rangoMes(mes) {
  const m = /^(\d{4})-(\d{2})$/.exec(mes ?? '');
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`Mes no válido: ${mes} (formato AAAA-MM)`);
  const a = Number(m[1]), n = Number(m[2]);
  const siguiente = n === 12 ? `${a + 1}-01` : `${a}-${String(n + 1).padStart(2, '0')}`;
  return { desde: `${mes}-01`, hasta: `${siguiente}-01` };
}

/** Mes anterior a una fecha ISO: "2026-12-01…" → "2026-11". */
export function mesAnterior(iso) {
  const [a, m] = iso.slice(0, 7).split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

/**
 * Lee la salida de `git log --first-parent --format=%H%x09%ad%x09%s --date=short` y devuelve las
 * fusiones de PR del mes: [{ sha, fecha, pr, titulo }].
 * Reconoce "Fase N — Título (#6)" (fusión con título propio) y "Merge pull request #6 from …".
 */
export function fusionesDelMes(log, mes) {
  const { desde, hasta } = rangoMes(mes);
  const salida = [];
  for (const linea of String(log).split('\n')) {
    const [sha, fecha, ...resto] = linea.split('\t');
    if (!sha || !fecha || fecha < desde || fecha >= hasta) continue;
    const asunto = resto.join('\t').trim();
    let m = /^Merge pull request #(\d+)\b/.exec(asunto);
    if (m) { salida.push({ sha, fecha, pr: Number(m[1]), titulo: asunto }); continue; }
    m = /^(.*)\(#(\d+)\)\s*$/.exec(asunto);
    if (m) salida.push({ sha, fecha, pr: Number(m[2]), titulo: m[1].trim() });
  }
  return salida.sort((a, b) => a.pr - b.pr);
}

/** Decisiones de decisiones.md con fecha en el mes: [{ id, fecha, titulo }]. */
export function decisionesDelMes(md, mes) {
  const { desde, hasta } = rangoMes(mes);
  return [...String(md).matchAll(/^## (D-\d{3}) · (\d{4}-\d{2}-\d{2}) · (.+)$/gm)]
    .map((m) => ({ id: m[1], fecha: m[2], titulo: m[3].trim() }))
    .filter((d) => d.fecha >= desde && d.fecha < hasta);
}

/** Cuenta "⚠️ Pendiente de verificar" por archivo. `archivos`: [{ ruta, texto }]. */
export function pendientes(archivos) {
  return archivos
    .map(({ ruta, texto }) => ({ ruta, n: (String(texto).match(/⚠️\s*Pendiente de verificar/g) ?? []).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.ruta.localeCompare(b.ruta));
}

/** Cuerpo Markdown del issue de la revisión mensual. */
export function cuerpoRevision({ mes, repo, fusiones, decisiones, listaPendientes, huecos, totales, composicion = [] }) {
  const enlacePr = (n) => (repo ? `[#${n}](https://github.com/${repo}/pull/${n})` : `#${n}`);
  const l = [];
  l.push(`# Revisión mensual ${mes}`, '');
  l.push('Generado automáticamente por `.github/workflows/revision-mensual.yml`. Procedimiento: `revisiones/README.md`.', '');
  l.push('## 1. PR fusionadas en el mes', '');
  if (fusiones.length) fusiones.forEach((f) => l.push(`- ${enlacePr(f.pr)} · ${f.fecha} · ${f.titulo}`));
  else l.push('- Ninguna.');
  l.push('', 'Revisar en cada una los comentarios y correcciones de Aritz (revisiones, comentarios y commits posteriores a la apertura).', '');
  l.push('## 2. Decisiones registradas en el mes', '');
  if (decisiones.length) decisiones.forEach((d) => l.push(`- **${d.id}** (${d.fecha}) · ${d.titulo}`));
  else l.push('- Ninguna.');
  l.push('', '## 3. Puntos «⚠️ Pendiente de verificar»', '');
  if (listaPendientes.length) listaPendientes.forEach((p) => l.push(`- \`${p.ruta}\`: ${p.n}`));
  else l.push('- Ninguno.');
  l.push('', '## 4. Huecos del mapa de conocimiento', '');
  const h = huecos ?? {};
  const algun = (h.patronesSinFicha?.length || 0) + (h.fichasSinCalculo?.length || 0) + (h.operacionesSinPatron?.length || 0);
  if (!algun) l.push('- Ninguno.');
  if (h.patronesSinFicha?.length) l.push(`- Patrones sin ficha que los explique: ${h.patronesSinFicha.join(', ')}`);
  if (h.fichasSinCalculo?.length) l.push(`- Fichas sin patrón ni operación: ${h.fichasSinCalculo.join(' · ')}`);
  if (h.operacionesSinPatron?.length) l.push(`- Operaciones sin patrón: ${h.operacionesSinPatron.join(' · ')}`);
  if (totales) l.push('', `Totales: ${totales.fichas} fichas · ${totales.operaciones} operaciones · ${totales.patrones} patrones · ${totales.decisiones} decisiones.`);
  l.push('', '## 5. Composición de índices (más de 3 meses)', '');
  if (composicion.length) composicion.forEach((c) => l.push(`- ⚠️ ${c.nombre} (${c.id}): composición del ${c.fecha ?? 'sin fecha'}; revisar con su fuente y actualizar \`conocimiento/mercados/composicion-indices.json\`.`));
  else l.push('- Todas al día.');
  l.push('', '## 6. Qué hacer', '');
  l.push('- [ ] Aritz pide en el chat: «Haz la revisión mensual de ' + mes + '».');
  l.push('- [ ] Claude prepara **una** PR con propuestas: patrones nuevos o mejorados, decisiones y normas (AGENTS.md), y el registro `revisiones/' + mes + '.md`.');
  l.push('- [ ] Aritz revisa y fusiona (o pide cambios en la misma PR).');
  return l.join('\n') + '\n';
}
