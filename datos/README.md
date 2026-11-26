# datos/

Archivos generados **automáticamente** por tareas programadas de GitHub Actions
(tipos del BCE, €STR, Euribor medio del Banco de España, noticias…). No se editan a mano.

Cada archivo indica su fuente, fecha de descarga y etiqueta ("referencia BCE",
"referencia Banco de España", "con retraso"…).

| Archivo | Fuente | Tarea | Etiqueta |
| --- | --- | --- | --- |
| `tipos-bce.json` | BCE, XML público `eurofxref-hist-90d.xml` (sin clave) | `.github/workflows/pages.yml`; **una descarga al día**, en la primera publicación a partir de las 08:00 de Madrid (D-041); el resto del día se reutiliza | referencia BCE |
| `historicos.json` | BCE (API del Portal de Datos: DFR, MRO, MLF, €STR, EUR/USD, EUR/GBP, EUR/JPY) y Banco de España (API BIEST: Euribor a un año, media mensual) — `scripts/series-oficiales.js`. Desde la fase 8, también **renta fija soberana** (rentabilidades en %, `grupo: "renta-fija"`): Bundesbank (Bund 2, 5, 10 y 30 años, diaria), Banco de Inglaterra (Gilt 5 y 10 años, diaria), Reserva Federal/FRED (Treasury 2, 5, 10 y 30 años, diaria), BCE (curva AAA de la zona euro 2, 5, 10 y 30 años, diaria; bono a 10 años de España, Francia, Italia y Alemania, media mensual) y las **primas de riesgo** frente al Bund calculadas con P-023 | `.github/workflows/pages.yml`; una descarga al día a partir de las 08:00 de Madrid (D-041; se reutiliza el resto del día; se descarga otra vez si aparece una serie nueva o alguna dio error) | referencia BCE / referencia Banco de España / referencia oficial (Bundesbank, Banco de Inglaterra, Reserva Federal) |
| `noticias.json` | RSS de Cinco Días, El Confidencial, Expansión, Financial Times, BCE y Banco de España (`scripts/fuentes-noticias.js`) | `.github/workflows/pages.yml`, **cada 15 minutos** (en punto, y cuarto, y media y menos cuarto: lo lanza `.github/workflows/reloj.yml`, D-041) y en cada publicación | con retraso |

`tipos-bce.json`, `noticias.json` e `historicos.json` **no se versionan** (D-018, D-022, D-023): se generan al publicar la
web y solo existen en GitHub Pages (`/datos/…`). Scripts: `node scripts/descargar-bce.js <salida>`
y `node scripts/descargar-noticias.js <salida>`.

`noticias.json` guarda solo titular, enlace, fuente, hora y etiquetas (nunca el texto), y el
estado de cada feed (`fuentes`: activo, error o sin noticias recientes).

**Renta variable:** no hay `renta-variable.json`. No se ha encontrado una fuente gratuita, sin
clave y cuyas condiciones permitan publicar cierres diarios de índices y acciones en una web
pública (D-035). Los índices y valores se ven con los widgets de TradingView y su histórico se
analiza con un CSV subido por el usuario (no sale del navegador).

