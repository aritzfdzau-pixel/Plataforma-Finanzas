// Lector mínimo de RSS 2.0 y Atom, sin dependencias. Funciones puras (sin red ni disco).
// Solo extrae lo que se publica (AGENTS.md §3): titular, enlace, fecha y categorías del feed.
// Nunca guarda el texto de la noticia.

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  ccedil: 'ç', Ccedil: 'Ç', agrave: 'à', egrave: 'è', ograve: 'ò', iexcl: '¡', iquest: '¿',
  euro: '€', pound: '£', yen: '¥', laquo: '«', raquo: '»', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', middot: '·', ordm: 'º', ordf: 'ª',
};

export function decodificarEntidades(t) {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
    }
    return ENTIDADES[e] ?? m;
  });
}

/** Texto plano: sin CDATA, sin etiquetas HTML, entidades decodificadas y espacios normalizados. */
export function textoPlano(t = '') {
  let s = String(t).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = s.replace(/<[^>]*>/g, ' ');
  s = decodificarEntidades(s);
  s = s.replace(/<[^>]*>/g, ' '); // por si las entidades escondían etiquetas
  return s.replace(/\s+/g, ' ').trim();
}

/** Solo enlaces http(s) absolutos; cualquier otro esquema se descarta. */
export function enlaceValido(url) {
  try {
    const u = new URL(String(url).trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Fecha RFC 822 (RSS) o ISO 8601 (Atom) → ISO en UTC, o null. */
export function fechaISO(texto) {
  if (!texto) return null;
  const ms = Date.parse(textoPlano(texto));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

const etiqueta = (bloque, nombre) => {
  const m = new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'i').exec(bloque);
  return m ? m[1] : null;
};
const atributo = (tag, nombre) => new RegExp(`\\s${nombre}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1] ?? null;

function enlaceAtom(bloque) {
  const links = [...bloque.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const alterno = links.find((l) => (atributo(l, 'rel') ?? 'alternate') === 'alternate') ?? links[0];
  return alterno ? decodificarEntidades(atributo(alterno, 'href') ?? '') : null;
}

/**
 * Lee un feed RSS 2.0 o Atom.
 * @returns {Array<{titulo: string, enlace: string, fecha: string|null, categorias: string[]}>}
 */
export function parsearFeed(xml) {
  if (typeof xml !== 'string' || !/<(rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error('No es un feed RSS/Atom');
  const atom = !/<item[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml);
  const bloques = [...xml.matchAll(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const salida = [];
  for (const b of bloques) {
    const titulo = textoPlano(etiqueta(b, 'title') ?? '');
    const enlace = enlaceValido(atom ? enlaceAtom(b) : textoPlano(etiqueta(b, 'link') ?? etiqueta(b, 'guid') ?? ''));
    if (!titulo || !enlace) continue;
    const fecha = fechaISO(etiqueta(b, 'pubDate') ?? etiqueta(b, 'dc:date') ?? etiqueta(b, 'published') ?? etiqueta(b, 'updated'));
    const categorias = [
      ...[...b.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)].map((m) => textoPlano(m[1])),
      ...[...b.matchAll(/<category\b[^>]*\/>/gi)].map((m) => atributo(m[0], 'term') ?? ''),
    ].filter(Boolean);
    salida.push({ titulo, enlace, fecha, categorias });
  }
  return salida;
}
