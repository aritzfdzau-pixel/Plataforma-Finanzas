// Conversor Markdown → HTML mínimo y seguro para las fichas. Módulo puro (sin DOM).
// Soporta: títulos, párrafos, listas, tablas, citas, bloques de código, fórmulas $$…$$
// (se muestran como texto LaTeX; GitHub las renderiza en el repositorio), **negrita**,
// *cursiva*, `código`, $fórmula$ y enlaces. Todo el texto se escapa: no admite HTML.

export function escapar(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Solo enlaces http(s), anclas (#…) o rutas relativas. */
export function enlaceSeguro(url) {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null; // javascript:, data:, etc.
  return u;
}

export function enLinea(texto) {
  const guardados = [];
  const guardar = (html) => `\u0000${guardados.push(html) - 1}\u0000`;
  let t = texto
    .replace(/`([^`]+)`/g, (_, c) => guardar(`<code>${escapar(c)}</code>`))
    .replace(/\$([^$\n]+)\$/g, (_, c) => guardar(`<code class="formula">${escapar(c)}</code>`));
  t = escapar(t)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
      const u = enlaceSeguro(url.replace(/&amp;/g, '&'));
      if (u === null) return txt;
      const externo = /^https?:/i.test(u);
      return `<a href="${escapar(u)}"${externo ? ' rel="noopener noreferrer" target="_blank"' : ''}>${txt}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]);
}

function celdas(linea) {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

export function markdownAHtml(md) {
  const lineas = String(md).replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const out = [];
  let i = 0;
  const esBloqueEspecial = (l) => /^(#{1,6}\s|```|\$\$|>\s?|[-*]\s|\d+\.\s|\|)/.test(l.trim());

  while (i < lineas.length) {
    const l = lineas[i];
    const lt = l.trim();
    if (lt === '') { i++; continue; }

    if (lt.startsWith('```')) {
      const buf = []; i++;
      while (i < lineas.length && !lineas[i].trim().startsWith('```')) buf.push(lineas[i++]);
      i++;
      out.push(`<pre><code>${escapar(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (lt.startsWith('$$')) {
      const buf = [];
      const resto = lt.slice(2);
      if (resto.endsWith('$$') && resto.length > 2) { buf.push(resto.slice(0, -2)); i++; } else {
        if (resto) buf.push(resto);
        i++;
        while (i < lineas.length && !lineas[i].trim().endsWith('$$')) buf.push(lineas[i++]);
        if (i < lineas.length) { const fin = lineas[i].trim().slice(0, -2); if (fin) buf.push(fin); i++; }
      }
      out.push(`<pre class="formula" aria-label="Fórmula (LaTeX)">${escapar(buf.join('\n').trim())}</pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(lt);
    if (h) { const n = h[1].length; out.push(`<h${n}>${enLinea(h[2])}</h${n}>`); i++; continue; }

    if (lt.startsWith('|') && i + 1 < lineas.length && /^\|?\s*:?-{3,}/.test(lineas[i + 1].trim())) {
      const cab = celdas(lt); i += 2;
      const filas = [];
      while (i < lineas.length && lineas[i].trim().startsWith('|')) filas.push(celdas(lineas[i++]));
      out.push(`<div class="tabla-scroll"><table><thead><tr>${cab.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead><tbody>${
        filas.map((f) => `<tr>${f.map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^[-*]\s/.test(lt) || /^\d+\.\s/.test(lt)) {
      const ordenada = /^\d+\.\s/.test(lt);
      const re = ordenada ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/;
      const items = [];
      while (i < lineas.length) {
        const actual = lineas[i];
        if (re.test(actual.trim())) { items.push(re.exec(actual.trim())[1]); i++; continue; }
        // Línea de continuación: sangrada y no vacía, se une al elemento anterior.
        if (/^\s+\S/.test(actual) && !esBloqueEspecial(actual)) { items[items.length - 1] += ` ${actual.trim()}`; i++; continue; }
        break;
      }
      const tag = ordenada ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((x) => `<li>${enLinea(x)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (lt.startsWith('>')) {
      const buf = [];
      while (i < lineas.length && lineas[i].trim().startsWith('>')) buf.push(lineas[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${enLinea(buf.join(' '))}</p></blockquote>`);
      continue;
    }
    const buf = [lt]; i++;
    while (i < lineas.length && lineas[i].trim() !== '' && !esBloqueEspecial(lineas[i])) buf.push(lineas[i++].trim());
    out.push(`<p>${enLinea(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}
