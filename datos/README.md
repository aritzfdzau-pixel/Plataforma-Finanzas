# datos/

Archivos generados **automáticamente** por tareas programadas de GitHub Actions
(tipos del BCE, €STR, Euribor medio del Banco de España, noticias…). No se editan a mano.

Cada archivo indica su fuente, fecha de descarga y etiqueta ("referencia BCE",
"referencia Banco de España", "con retraso"…).

| Archivo | Fuente | Tarea | Etiqueta |
| --- | --- | --- | --- |
| `tipos-bce.json` | BCE, XML público `eurofxref-hist-90d.xml` (sin clave) | `.github/workflows/pages.yml`, cada hora (minuto 17) y en cada publicación | referencia BCE |
| `noticias.json` | RSS de elEconomista, Financial Times, BCE y Banco de España (`scripts/fuentes-noticias.js`) | `.github/workflows/pages.yml`, cada hora (minuto 17) y en cada publicación | con retraso |

`tipos-bce.json` y `noticias.json` **no se versionan** (D-018, D-022): se generan al publicar la
web y solo existen en GitHub Pages (`/datos/…`). Scripts: `node scripts/descargar-bce.js <salida>`
y `node scripts/descargar-noticias.js <salida>`.

`noticias.json` guarda solo titular, enlace, fuente, hora y etiquetas (nunca el texto), y el
estado de cada feed (`fuentes`: activo, error o sin noticias recientes).
