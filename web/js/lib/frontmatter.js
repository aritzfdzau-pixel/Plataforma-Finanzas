// Lector mínimo de cabeceras YAML de las fichas. Módulo puro (sin DOM).
// Soporta: `clave: valor`, cadenas entre comillas, listas en línea [a, b] y comentarios #.

export function leerFicha(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m) return { cabecera: {}, cuerpo: md };
  const cabecera = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const lm = /^([A-Za-z_][\w]*)\s*:\s*(.*)$/.exec(linea);
    if (!lm) continue;
    cabecera[lm[1]] = valor(quitarComentario(lm[2]).trim());
  }
  return { cabecera, cuerpo: md.slice(m[0].length) };
}

function quitarComentario(v) {
  let enComillas = null;
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    if (enComillas) { if (c === enComillas) enComillas = null; continue; }
    if (c === '"' || c === "'") enComillas = c;
    else if (c === '#' && (i === 0 || /\s/.test(v[i - 1]))) return v.slice(0, i);
  }
  return v;
}

function valor(v) {
  if (v.startsWith('[') && v.endsWith(']')) {
    const dentro = v.slice(1, -1).trim();
    return dentro === '' ? [] : dentro.split(',').map((x) => desentrecomillar(x.trim()));
  }
  return desentrecomillar(v);
}

function desentrecomillar(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}
