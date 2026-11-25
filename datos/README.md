# datos/

Archivos generados **automáticamente** por tareas programadas de GitHub Actions
(tipos del BCE, €STR, Euribor medio del Banco de España, noticias…). No se editan a mano.

Cada archivo indica su fuente, fecha de descarga y etiqueta ("referencia BCE",
"referencia Banco de España", "con retraso"…).

| Archivo | Fuente | Tarea | Etiqueta |
| --- | --- | --- | --- |
| `tipos-bce.json` | BCE, XML público `eurofxref-hist-90d.xml` (sin clave) | `.github/workflows/pages.yml`, cada hora (minutos 17 y 47, más el lanzamiento horario externo de D-034) y en cada publicación | referencia BCE |
| `historicos.json` | BCE (API del Portal de Datos: DFR, MRO, MLF, €STR, EUR/USD, EUR/GBP, EUR/JPY) y Banco de España (API BIEST: Euribor a un año, media mensual) — `scripts/series-oficiales.js` | `.github/workflows/pages.yml`; una descarga al día (se reutiliza el resto de horas) | referencia BCE / referencia Banco de España |
| `noticias.json` | RSS de Cinco Días, El Confidencial, Expansión, Financial Times, BCE y Banco de España (`scripts/fuentes-noticias.js`) | `.github/workflows/pages.yml`, cada hora (minutos 17 y 47, más el lanzamiento horario externo de D-034) y en cada publicación | con retraso |

`tipos-bce.json`, `noticias.json` e `historicos.json` **no se versionan** (D-018, D-022, D-023): se generan al publicar la
web y solo existen en GitHub Pages (`/datos/…`). Scripts: `node scripts/descargar-bce.js <salida>`
y `node scripts/descargar-noticias.js <salida>`.

`noticias.json` guarda solo titular, enlace, fuente, hora y etiquetas (nunca el texto), y el
estado de cada feed (`fuentes`: activo, error o sin noticias recientes).
