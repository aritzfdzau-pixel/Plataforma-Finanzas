// Tests de la fase 3: lector RSS/Atom, etiquetado, combinación y utilidades de la web.
// Muestras inventadas en tests/fixtures/ (rss-muestra.xml, atom-muestra.xml).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsearFeed, textoPlano, enlaceValido, fechaISO, decodificarEntidades } from '../scripts/rss.js';
import { leerPalabrasClave, etiquetar, combinar, estadoFeed, construirNoticias, contiene, normalizar, SLUGS } from '../scripts/noticias.js';
import { FUENTES_NOTICIAS } from '../scripts/fuentes-noticias.js';
import { filtrarNoticias, fuentesDe, horaNoticia, enlaceNoticia, CATEGORIAS_NOTICIAS } from '../web/js/lib/noticias.js';

const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const RSS = leer('./fixtures/rss-muestra.xml');
const ATOM = leer('./fixtures/atom-muestra.xml');
const PALABRAS = leerPalabrasClave(leer('../decisiones.md'));
const AHORA = '2026-11-24T10:00:00.000Z';

// --- Lector RSS / Atom ---
test('parsearFeed RSS: titular, enlace, fecha y categorías; descarta enlaces no http y vacíos', () => {
  const it = parsearFeed(RSS);
  assert.equal(it.length, 3);
  assert.deepEqual(it[0], {
    titulo: 'El Ibex 35 sube un 1 % tras el dato de inflación', enlace: 'https://ejemplo.test/mercados/ibex-sube',
    fecha: '2026-11-24T08:15:00.000Z', categorias: ['Bolsa'],
  });
  assert.equal(it[1].titulo, 'El euro se aprecia frente al dólar & la libra');
  assert.equal(it[1].enlace, 'https://ejemplo.test/divisas/euro-aprecia');
  assert.equal(it[1].fecha, '2026-11-24T07:30:00.000Z');
  assert.equal(it[2].titulo, 'Las hipotecas suben con el Euríbor'); // sin etiquetas HTML
  assert.equal(it[2].enlace, 'https://ejemplo.test/vivienda/hipotecas'); // guid como enlace
  assert.ok(!JSON.stringify(it).includes('NO se debe guardar'), 'no se guarda el texto del artículo');
});

test('parsearFeed Atom: enlace alternate con entidades, fecha y category term', () => {
  assert.deepEqual(parsearFeed(ATOM), [{
    titulo: 'Decisiones de política monetaria', enlace: 'https://ejemplo.test/prensa/decisiones?a=1&b=2',
    fecha: '2026-11-20T13:15:00.000Z', categorias: ['Monetary policy'],
  }]);
});

test('parsearFeed rechaza lo que no es un feed (p. ej. una página de error)', () => {
  assert.throws(() => parsearFeed('<html><body>403</body></html>'));
  assert.throws(() => parsearFeed(null));
});

test('utilidades del lector: entidades, texto plano, enlaces y fechas', () => {
  assert.equal(decodificarEntidades('&aacute;&#233;&#x00ED; &euro; &unknown;'), 'áéí € &unknown;');
  assert.equal(textoPlano('<![CDATA[ <b>Hola</b>   mundo ]]>'), 'Hola mundo');
  assert.equal(enlaceValido('javascript:alert(1)'), null);
  assert.equal(enlaceValido('data:text/html,x'), null);
  assert.equal(enlaceValido('https://ejemplo.test/a b'), 'https://ejemplo.test/a%20b');
  assert.equal(fechaISO('no es fecha'), null);
  assert.equal(fechaISO('Tue, 24 Nov 2026 09:15:00 +0100'), '2026-11-24T08:15:00.000Z');
});

// --- Palabras clave y etiquetado ---
test('decisiones.md define palabras clave válidas para todas las categorías', () => {
  assert.deepEqual(Object.keys(PALABRAS).sort(), [...SLUGS].sort());
  for (const lista of Object.values(PALABRAS)) assert.ok(lista.length >= 3);
  assert.throws(() => leerPalabrasClave('# sin sección'));
  assert.throws(() => leerPalabrasClave('## Palabras clave para etiquetar noticias\n| `cripto` | btc |\n'));
});

test('contiene: palabra completa, sin tildes ni mayúsculas', () => {
  assert.ok(contiene(normalizar('Sube el PIB de España'), 'pib'));
  assert.ok(!contiene(normalizar('Pibes en la calle'), 'pib'));
  assert.ok(contiene(normalizar('La inflación baja'), normalizar('inflación')));
  assert.ok(contiene(normalizar('Récord del S&P 500'), 's&p 500'));
});

test('etiquetar: sección del feed + palabras clave; varias etiquetas; Institucional solo BCE/BdE', () => {
  const [ibex, euro, hipotecas] = parsearFeed(RSS);
  const mercados = { seccion: 'bolsa-inversion' };
  assert.deepEqual(etiquetar(ibex, mercados, PALABRAS), ['bolsa-inversion', 'macroeconomia']);
  assert.deepEqual(etiquetar(euro, { seccion: null }, PALABRAS), ['fx']);
  assert.deepEqual(etiquetar(hipotecas, { seccion: null }, PALABRAS), ['real-estate']);
  const bce = { titulo: 'El BCE mantiene los tipos de interés', categorias: [] };
  assert.deepEqual(etiquetar(bce, { seccion: null }, PALABRAS), ['macroeconomia']); // prensa: sin "institucional"
  assert.deepEqual(etiquetar(bce, { seccion: null, institucional: true }, PALABRAS), ['macroeconomia', 'institucional']);
});

test('combinar: sin duplicados, más recientes primero, máximo 7 días y límite', () => {
  const n = (enlace, fecha, titulo = enlace) => ({ titulo, enlace, fecha });
  const nuevas = [n('a', '2026-11-24T09:00:00Z', 'A nueva'), n('b', '2026-11-23T09:00:00Z')];
  const anteriores = [n('a', '2026-11-24T09:00:00Z', 'A vieja'), n('c', '2026-11-24T09:30:00Z'), n('viejo', '2026-11-10T00:00:00Z')];
  const r = combinar(nuevas, anteriores, { ahora: AHORA });
  assert.deepEqual(r.map((x) => x.enlace), ['c', 'a', 'b']);
  assert.equal(r[1].titulo, 'A nueva');
  assert.equal(combinar(nuevas, anteriores, { ahora: AHORA, max: 1 }).length, 1);
});

test('estadoFeed: ok, error y feed sin noticias recientes', () => {
  const feed = { id: 'x', fuente: 'X', url: 'https://ejemplo.test/rss' };
  assert.equal(estadoFeed(feed, { items: parsearFeed(RSS) }, AHORA).estado, 'ok');
  assert.deepEqual(estadoFeed(feed, { error: 'HTTP 404' }, AHORA).estado, 'error');
  assert.equal(estadoFeed(feed, { items: parsearFeed(ATOM) }, '2027-02-01T00:00:00Z').estado, 'sin-noticias-recientes');
  assert.equal(estadoFeed(feed, { items: [] }, AHORA).estado, 'sin-noticias-recientes');
});

test('construirNoticias: un feed caído no impide el resto; etiqueta "con retraso"; solo campos permitidos', () => {
  const [ok, caido] = [FUENTES_NOTICIAS[0], FUENTES_NOTICIAS.find((f) => f.dePago)];
  const d = construirNoticias([{ feed: ok, items: parsearFeed(RSS) }, { feed: caido, error: 'HTTP 403' }], [], PALABRAS, AHORA);
  assert.equal(d.etiqueta, 'con retraso');
  assert.equal(d.noticias.length, 3);
  assert.deepEqual(d.fuentes.map((f) => f.estado), ['ok', 'error']);
  assert.equal(d.fuentes[1].dePago, true);
  for (const n of d.noticias) assert.deepEqual(Object.keys(n).sort(), ['dePago', 'enlace', 'etiquetas', 'fecha', 'fuente', 'titulo']);
});

test('fuentes configuradas: prensa española en abierto, FT, BCE y BdE; https, ids únicos, FT marcada de pago', () => {
  assert.deepEqual([...new Set(FUENTES_NOTICIAS.map((f) => f.fuente))].sort(), ['BCE', 'Banco de España', 'Cinco Días', 'El Confidencial', 'Expansión', 'Financial Times']);
  assert.equal(new Set(FUENTES_NOTICIAS.map((f) => f.id)).size, FUENTES_NOTICIAS.length);
  for (const f of FUENTES_NOTICIAS) {
    assert.match(f.url, /^https:\/\//);
    assert.ok(f.seccion === null || SLUGS.includes(f.seccion), f.id);
    assert.equal(!!f.dePago, f.fuente === 'Financial Times', f.id);
    assert.equal(!!f.institucional, ['BCE', 'Banco de España'].includes(f.fuente), f.id);
  }
});

// --- Web ---
test('web: filtros por fuente, categoría y texto', () => {
  const d = construirNoticias([{ feed: FUENTES_NOTICIAS[0], items: parsearFeed(RSS) }], [], PALABRAS, AHORA);
  assert.equal(filtrarNoticias(d.noticias, { categoria: 'fx' }).length, 1);
  assert.equal(filtrarNoticias(d.noticias, { fuente: FUENTES_NOTICIAS[0].fuente }).length, 3);
  assert.equal(filtrarNoticias(d.noticias, { fuente: 'BCE' }).length, 0);
  assert.equal(filtrarNoticias(d.noticias, { texto: 'EURIBOR' }).length, 1); // sin tildes ni mayúsculas
  assert.deepEqual(fuentesDe({ fuentes: [{ fuente: 'Financial Times', dePago: true }, { fuente: 'BCE' }], noticias: [] }),
    [{ nombre: 'BCE', dePago: false }, { nombre: 'Financial Times', dePago: true }]);
  assert.ok(CATEGORIAS_NOTICIAS.some((c) => c.slug === 'institucional'));
});

test('web: hora en Madrid (mismo día → HH:MM; otro día → dd/mm HH:MM) y enlaces seguros', () => {
  assert.equal(horaNoticia('2026-11-24T08:15:00Z', AHORA), '09:15');           // UTC+1 en noviembre
  assert.equal(horaNoticia('2026-11-23T18:00:00Z', AHORA), '23/11 19:00');
  assert.equal(horaNoticia('2026-07-01T10:00:00Z', '2026-07-01T12:00:00Z'), '12:00'); // UTC+2 en verano
  assert.equal(horaNoticia(null, AHORA), '—');
  assert.equal(enlaceNoticia('javascript:alert(1)'), null);
  assert.equal(enlaceNoticia('https://ejemplo.test/x'), 'https://ejemplo.test/x');
});
