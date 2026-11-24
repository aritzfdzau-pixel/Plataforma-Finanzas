# datos/

Archivos generados **automáticamente** por tareas programadas de GitHub Actions
(tipos del BCE, €STR, Euribor medio del Banco de España, noticias…). No se editan a mano.

Cada archivo indica su fuente, fecha de descarga y etiqueta ("referencia BCE",
"referencia Banco de España", "con retraso"…).

| Archivo | Fuente | Tarea | Etiqueta |
| --- | --- | --- | --- |
| `tipos-bce.json` | BCE, XML público `eurofxref-hist-90d.xml` (sin clave) | `.github/workflows/pages.yml`, días hábiles a las 16:17 UTC y en cada publicación | referencia BCE |

`tipos-bce.json` **no se versiona** (D-018): se genera al publicar la web y solo existe en
GitHub Pages (`/datos/tipos-bce.json`). Script: `node scripts/descargar-bce.js <salida>`.
