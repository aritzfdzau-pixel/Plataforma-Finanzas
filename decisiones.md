# Registro de decisiones

Formato: fecha · fase · decisión · motivo · alternativas descartadas.
Las decisiones marcadas "⚠️ Pendiente de verificar" requieren confirmación de Aritz.

## D-001 · 2026-11-24 · Fase 0 · La interfaz vive en `web/`
- **Decisión:** la web está en `web/`. El workflow de Pages compone el sitio publicado
  copiando `web/` y, cuando existan, `datos/` y `conocimiento/` (sin la plantilla).
- **Motivo:** separar la interfaz de la documentación interna (`AGENTS.md`, `PLAN.md`,
  `.github/`) para que no se publique nada innecesario.
- **Descartado:** publicar la raíz del repo.

## D-002 · 2026-11-24 · Fase 0 · Tipografías
- **Decisión:** Inter (texto) y JetBrains Mono (números, cifras tabulares), subconjunto
  latino en `woff2`, pesos 400/500/600, alojadas en `web/fuentes/` con su licencia SIL OFL 1.1.
- **Motivo:** licencia libre que permite redistribución; buena legibilidad; cifras tabulares.
- **Nota:** los símbolos ▲ ▼ no están en el subconjunto latino; se muestran con la fuente
  del sistema como respaldo.

## D-003 · 2026-11-24 · Fase 0 · Paleta y contraste
- **Decisión:** fondo `#0B0D10`, acento ámbar propio, un color por categoría. Todos los
  pares texto/fondo relevantes se verifican con un test de contraste WCAG 2.x
  (`tests/contraste.test.js`): ≥ 4,5:1 para texto normal en ambos temas.
- **Motivo:** la norma pide comprobar AA; el código lo calcula, no la IA.

## D-004 · 2026-11-24 · Fase 0 · Tema
- **Decisión:** oscuro por defecto aunque el sistema operativo esté en claro. El modo
  claro se elige con un botón y se recuerda en `localStorage` (solo en ese navegador).
- **Motivo:** la especificación pide modo oscuro por defecto.

## D-005 · 2026-11-24 · Fase 0 · Tests sin dependencias
- **Decisión:** `package.json` mínimo con `"type": "module"` y sin dependencias; los tests
  se descubren con `node --test` (archivos `*.test.js`). Node 22 en CI.
- **Tests de infraestructura** (`tests/`): estructura del repo, cabecera de la plantilla
  de ficha, contraste de tokens y ausencia de scripts/recursos externos en `web/`.

## D-006 · 2026-11-24 · Fase 0 · Zonas del esqueleto
- **Decisión:** el esqueleto muestra cuatro zonas marcadas "Próximamente": Noticias,
  Divisas, Operativa y Conocimiento (zona secundaria), siguiendo la tabla de la pantalla final.

## D-007 · 2026-11-24 · Fase 1 · Valores de referencia de los tests: LibreOffice Calc
- **Decisión:** los valores de referencia de los tests financieros los calcula **LibreOffice
  Calc 24.2** (hoja de cálculo independiente del código) a partir de
  `operativa/tests/referencias/referencias.fods`, que contiene las fórmulas a la vista
  (`PAGO`, `VF`, `TIR`, `VNA`, `INT.EFECTIVO`, `TASA.NOMINAL`, `TASA`, `VAR`, `DESVEST`, `LN`…).
  `extraer.py` vuelca los resultados a `referencias.json`, que leen los tests.
- **Motivo:** la norma "ninguna IA calcula". No había acceso a Google Sheets desde el entorno;
  el `.fods` se puede abrir en Google Sheets o Excel para comprobarlo.
- **Tolerancia:** relativa de 1e-10 a 1e-11 (LibreOffice exporta 15 cifras significativas).

## D-008 · 2026-11-24 · Fase 1 · Lectura de números en convención es-ES
- **Decisión:** coma = decimal; punto seguido de grupos de 3 cifras = miles ("100.000",
  y también "1.085" → 1085); un único punto sin grupo de 3 cifras = decimal ("1.0850").
  Si hay coma y punto, el último es el decimal. La interfaz muestra bajo cada campo cómo se
  ha interpretado el número y avisa cuando un punto se toma como separador de miles.
- **Riesgo:** escribir un tipo de cambio como "1.085" se lee como 1.085 (mil ochenta y cinco).
  El aviso de interpretación lo hace visible.

## D-009 · 2026-11-24 · Fase 1 · Listado generado desde las fichas
- **Decisión:** `node scripts/generar-indice.js` lee las cabeceras de `conocimiento/**.md` y
  escribe `conocimiento/indice.json` (fichas + operaciones que generan). La web lee ese JSON.
  Un test falla si el índice no está al día, y el workflow de Pages lo vuelve a comprobar.
- **Motivo:** GitHub Pages no permite listar carpetas y no queremos paso de build.

## D-010 · 2026-11-24 · Fase 1 · Estructura del sitio publicado (sustituye parte de D-001)
- **Decisión:** el sitio publicado replica la estructura del repo (`web/`, `operativa/lib`,
  `operativa/operaciones`, `conocimiento/`, `datos/`), y la raíz redirige a `web/`.
- **Motivo:** la web importa módulos de `operativa/` y lee fichas con rutas relativas
  (`../operativa/…`, `../conocimiento/…`); así funcionan igual en local y en Pages.
- **Probar en local:** servir la **raíz** del repo (`python3 -m http.server`) y abrir `/web/`.

## D-011 · 2026-11-24 · Fase 1 · Operaciones declarativas
- **Decisión:** cada operación (`operativa/operaciones/<id>.js`) declara campos, una función
  `calcular` pura y sus convenciones (base, periodicidad, nominal/efectivo, comisiones). Una
  única interfaz genérica (`web/js/ui/operativa.js`) pinta todas. La lógica financiera solo
  está en `operativa/`; un test impide usar el DOM allí.

## D-012 · 2026-11-24 · Fase 1 · Detalles de cálculo
- Cuadros de amortización **sin redondear** cada cuota a céntimos (pueden diferir en
  céntimos de un banco). Intereses totales = total pagado − capital prestado.
- Carencia **total**: los intereses se capitalizan (amortización negativa en el cuadro).
- TIR: Newton-Raphson (estimación 10 %, tolerancia 1e-10, 100 iteraciones); si falla,
  bisección entre −99,99 % y 10.000 %. Con más de un cambio de signo se avisa de posibles TIR múltiples.
- Varianza y desviación **muestrales** (n − 1). Volatilidad anualizada por √252 / √52 / √12.
- Coste efectivo de descuento/confirming: compuesto en base 365, $(N/E)^{365/d} − 1$.
- TAE con comisiones: TIR del préstamo con periodos iguales de 1/m año. ⚠️ Pendiente de
  verificar frente al cómputo en días/365 de la normativa del Banco de España.
- Hipoteca: TIN mínimo 0 % por defecto (⚠️ Pendiente de verificar el alcance de la Ley 5/2019).
- Bases del forward por divisa: USD y CHF Act/360; GBP y JPY Act/365 (⚠️ Pendiente de verificar).
- CSV: separador ";", coma decimal, sin miles, BOM UTF-8, porcentajes como número (columna "(%)").

## D-013 · 2026-11-24 · Fase 1 · Flechas ▲ ▼ indican dirección, no "bueno/malo"
- **Decisión inicial:** verde ▲ = el valor sube, rojo ▼ = baja, también en costes.
- **Revisada (2026-11-24, Aritz):** en los **costes** se invierte el color: subir = ▲ rojo,
  bajar = ▼ verde. La flecha sigue indicando siempre la dirección y el color pasa a indicar si
  es favorable. Los resultados de coste llevan `variacion: 'coste'` (hoy: variación de la cuota
  y de los intereses en «Hipoteca variable» y «Escenario de Euribor»). Los datos de mercado
  (divisas, tipos, series históricas) siguen con el color por dirección: no son un coste en sí.

## D-014 · 2026-11-24 · Fase 1 · Fórmulas en la web
- **Decisión:** el visor de fichas muestra las fórmulas en texto LaTeX (sin librería de
  renderizado: no hay CDN ni dependencias). GitHub sí las renderiza al ver la ficha en el repo.

## D-015 · 2026-11-24 · Fase 1 (revisión) · Uso de material de estudio de terceros
- **Decisión:** Aritz aportó apuntes de un curso (material con derechos de autor). No se
  copia su texto ni se cita por nombre en el repositorio (es público y lo identificaría).
  Se usaron solo para **contrastar** y se escribieron fichas propias:
  `fx/mercado-de-divisas.md`, `empresas/tipos-de-referencia-del-euro.md` y
  `bolsa-inversion/deuda-publica-espanola.md`; además, se ampliaron `seguro-de-cambio` e
  `hipoteca-variable`.
- **Contraste numérico:** los dos ejemplos de forward del material (1,1065 y 1,1186) se
  reproducen con la operación `fx-forward` (test en `operativa/tests/operaciones.test.js`).
- **Información del material que estaba desactualizada y se ha corregido en las fichas:**
  EONIA → €STR (2019/2022); LIBOR en euros desaparecido (2021); TARGET/TARGET2 → T2 (2023);
  Euribor administrado por EMMI con metodología híbrida y plazos 1s, 1m, 3m, 6m y 12m;
  objetivo del BCE simétrico del 2 % (2021); señal de política a través de la facilidad de
  depósito y diferencial MRO−DFR de 15 pb (2024); "Pagarés del Tesoro" → Letras del Tesoro.
- **Fichas sin operación:** se permiten (`operaciones: []`) cuando el contenido es de
  conocimiento; sus ejemplos se calculan en LibreOffice (referencias en `referencias.fods`).
- **Propuesta pendiente para Aritz:** añadir una categoría "Fundamentos" (macroeconomía,
  sistema financiero, supervisión) para conocimiento que no encaja en las cuatro categorías.
  → Resuelta en D-016.

## D-016 · 2026-11-24 · Fase 1 (revisión) · Categoría Macroeconomía
- **Decisión:** Aritz pide la categoría `macroeconomia` ("Macroeconomía") en lugar de
  "Fundamentos". Cubre política monetaria, indicadores (PIB, inflación, M3) y sistema
  financiero. Color fijo `--cat-macroeconomia`: #B5CF5A (oscuro) y #5C7A00 (claro), ambos
  ≥ 4,5:1 sobre los tres fondos (test de contraste).
- **Cambios:** `tipos-de-referencia-del-euro.md` pasa de `empresas/` a `macroeconomia/`;
  nueva ficha `macroeconomia/indicadores-macroeconomicos.md` (ejemplos calculados en
  LibreOffice: referencias `macro_*`).
- **Pendiente:** las noticias de la fase 3 también usarán esta categoría (palabras clave por definir).

## D-017 · 2026-11-24 · Fase 1 (revisión) · Sistemas de amortización y sistema americano
- **Decisión:** a petición de Aritz se añade el sistema **americano (bullet)** al cuadro de
  amortización (P-005): solo intereses y todo el capital en la última cuota.
- La operación pasa a llamarse «Préstamo: cuadro de amortización (francés, alemán,
  americano)» (id `prestamo-amortizacion`, antes `prestamo-frances-aleman`) y la ficha a
  `empresas/prestamos-sistemas-de-amortizacion.md`. Motivo: "francés/alemán/americano" son
  nombres de método, no de país; la interfaz los muestra como «Cuota constante (francés)»,
  «Amortización constante (alemán)» y «Todo al vencimiento (americano / bullet)».
- El cambio de id no rompe enlaces publicados: la fase 1 aún no estaba en `main`.
- Referencias LibreOffice nuevas: `am_cuota`, `am_ultima`, `am_int`, `am_cart_int`.

## D-018 · 2026-11-24 · Fase 2 · Tipos BCE: se generan al publicar, no se versionan
- **Decisión:** la tarea diaria es el propio workflow de publicación (`pages.yml`, con
  `schedule` en días hábiles a las 16:17 UTC, después de que el BCE publique hacia las 16:00
  CET). Descarga `eurofxref-hist-90d.xml` (público, sin clave), lo convierte con
  `scripts/descargar-bce.js` y escribe `datos/tipos-bce.json` **dentro del sitio publicado**.
- **Motivo:** un bot que hiciera commits diarios a `main` chocaría con la protección de la
  rama (PR + tests obligatorios) y llenaría el historial de commits de datos.
- **Respaldo:** si el BCE no responde, se reutiliza el último archivo publicado en Pages; si
  tampoco existe, se publica sin él y la web muestra "no disponible".
- **Variación ▲▼:** frente al día hábil anterior publicado por el BCE (P-010).
- **Actualización (D-022):** la tarea pasa a ser horaria.
- **Riesgo:** GitHub desactiva los `schedule` de repositorios sin actividad durante 60 días;
  en ese caso hay que volver a activarlo en Actions (o hacer cualquier commit).

## D-019 · 2026-11-24 · Fase 2 · TradingView en iframes con sandbox, sin script
- **Decisión:** en vez de cargar los scripts de inserción de TradingView en la web, cada
  widget (cotizaciones, majors, calendario) es un `<iframe>` a `www.tradingview-widget.com`,
  con `sandbox` y `referrerpolicy="no-referrer"`. La configuración viaja en el fragmento `#`.
- **Motivo:** aislamiento real: ningún código de terceros se ejecuta en el origen de la web, ni
  puede leer lo que el usuario escribe. La CSP sigue con `script-src 'self'`.
- **⚠️ Pendiente de verificar (Aritz, en Pages):** la ruta `/embed-widget/<tipo>/` es la que
  generan los scripts oficiales, pero no es una API documentada; los símbolos son `FX_IDC:<par>`.
  Desde el entorno de desarrollo no hay red hacia TradingView, así que no se ha podido ver el
  widget cargado. Si aparece en blanco, la alternativa es una página propia aislada que cargue
  el script oficial (con su propia CSP) dentro del iframe.
- **Calendario:** el widget filtra por país, no por divisa: EUR = zona euro (`eu`) + Alemania,
  Francia, Italia y España; USD = EE. UU.; GBP = Reino Unido; JPY = Japón. Importancia media y alta.
- **Etiquetas:** cotizaciones y calendario → "tiempo real (indicativo)"; tipos del BCE →
  "referencia BCE". Aviso CNY ≠ CNH en el panel.

## D-020 · 2026-11-24 · Fase 2 · Operaciones FX con el tipo BCE
- La conversión (operación 2) rellena el tipo con la referencia BCE del día y lo actualiza al
  cambiar de divisa; si no hay tipo para la divisa, el campo se vacía (nunca queda el de otra).
- El forward (operación 1) acepta las 9 divisas del panel. Bases añadidas (⚠️ pendiente de
  verificar, como las anteriores): CNY Act/360; AUD, CAD, HKD y NZD Act/365. Se abre desde el
  panel con el par y la referencia BCE como spot, avisando de que no es un precio negociable.
- Mecanismo genérico: un campo con `rellenarCon: { fuente: 'bce', divisa: <campo> }`; la
  función `calcular` sigue siendo pura (el relleno lo hace la interfaz).

## D-021 · 2026-11-24 · Fase 2 (revisión) · Bases del forward verificadas y tipo de la divisa
- **Verificadas con fuentes públicas** (se quita el ⚠️):
  - AUD Act/365: metodología del AONIA realizado (ASX) y convenciones del mercado monetario (AFMA).
  - CAD Act/365: Banco de Canadá / CARR (metodología del CORRA y convenciones recomendadas).
  - HKD Act/365: convención del HONIA (fuente secundaria; coherente con el mercado de Hong Kong).
  - USD (SOFR) Act/360, GBP (SONIA) Act/365, JPY (TONA) Act/365 y CHF (SARON) Act/360:
    convenciones estándar de los tipos libres de riesgo de cada divisa.
- **Siguen "⚠️ Pendiente de verificar"** y la operación lo avisa en el resultado:
  - NZD Act/365: las fuentes consultadas se contradicen (360 frente a 365 para el BKBM).
  - CNY Act/360: solo se deduce indirectamente (regla de CFETS que convierte SHIBOR × 365/360);
    falta el reglamento del SHIBOR.
- **Tipo de la divisa:** al abrir el forward desde el panel, el campo llega vacío y se pide
  ("Obligatorio: introduce un valor"); el 4,50 % de ejemplo solo tiene sentido para USD.
- **Widgets de TradingView:** no se pueden comprobar desde el entorno de desarrollo (el dominio
  no es accesible ni desde la búsqueda web). Se comprobarán en Pages tras fusionar (D-019).

## D-022 · 2026-11-24 · Fase 3 · Noticias: tarea horaria, feeds y etiquetado
- **Tarea:** el mismo workflow de publicación (`pages.yml`) pasa a ejecutarse **cada hora**
  (minuto 17). Descarga los feeds (`scripts/descargar-noticias.js`) y vuelve a comprobar los
  tipos del BCE. Igual que en D-018, `datos/noticias.json` se genera al publicar y no se versiona.
- **Feeds** (`scripts/fuentes-noticias.js`; elEconomista sustituido en D-026): elEconomista (mercados, economía, empresas,
  vivienda), Financial Times (mercados, empresas, economía global, divisas; **de pago**), BCE
  (notas de prensa) y Banco de España (noticias). ⚠️ Pendiente de verificar: desde el entorno de
  desarrollo no hay red, y las búsquedas no confirman direcciones oficiales de elEconomista
  ni de las secciones del FT. Por eso cada ejecución comprueba cada feed y publica su estado
  (activo / error / sin noticias en 30 días), visible en «Ver todas → Estado de las fuentes»
  y como avisos en el registro de Actions.
- **Si un feed falla:** se registra y se sigue con el resto; los titulares del último archivo
  publicado se conservan hasta 7 días (máximo 200 titulares).
- **Etiquetado:** 1) sección del feed; 2) "Institucional" para BCE y Banco de España (solo
  ellos); 3) palabras clave (tabla siguiente), sobre titular y categorías del feed, en
  minúsculas, sin tildes y por palabra completa. Varias etiquetas por titular.
- **Derechos:** solo titular, enlace, fuente, hora y etiquetas; el texto no se guarda (test).
- **Seguridad:** solo enlaces http(s), comprobados en la tarea y otra vez en la web; los
  titulares se pintan como texto (nunca HTML) y se abren con `rel="noopener noreferrer"`.
- **Etiqueta del dato:** "con retraso" (hasta ~1 h más el retraso de cada feed).

## D-023 · 2026-11-24 · Fase 4 · Históricos: series oficiales, CSV propio y estadísticos
- **Series oficiales** (`scripts/series-oficiales.js`), tarea diaria dentro del workflow
  horario: solo descarga una vez al día (reutiliza el archivo publicado si es de hoy y no hubo
  errores). Como en D-018, `datos/historicos.json` se genera al publicar y no se versiona.
  - BCE, API del Portal de Datos (`format=csvdata`, documentado): DFR, MRO, MLF, €STR y tipos
    de referencia EUR/USD, EUR/GBP y EUR/JPY; últimas 780 observaciones (~3 años hábiles).
  - Banco de España, API BIEST: Euribor a un año, media mensual (índice oficial), 60 meses.
    Código `D_1NBAF472`, host `app.bde.es` y formato JSON comprobados el 2026-11-24 (D-026). El lector acepta las dos formas descritas y la tabla
    de Históricos muestra ⚠️ con el error si la serie falla (conserva los datos anteriores).
  - El Euribor diario no se usa (licencia de EMMI), como fija el plan.
- **CSV propio**: se lee en el navegador con `FileReader`/`File.text()`, nunca sale de él.
  Formatos: `fecha;valor` (coma decimal), `fecha,valor` (punto decimal) o exportaciones con
  cabecera `Date … Close / Adj Close`. Validación con número de línea, máximo 5 MB y 20.000 filas.
- **Estadísticos**: precios → rentabilidades simples y log, varianza, volatilidad histórica
  y EWMA (λ = 0,94), máximo drawdown; tipos de interés → variaciones en pb (no hay
  "rentabilidad" de un tipo). Correlación de Pearson sobre las variaciones en fechas comunes.
  Patrones nuevos P-011 a P-014 con referencias de LibreOffice.
- **Gráfica**: SVG propio con un solo eje, medias móviles (20/50 sesiones o 3/12 meses),
  leyenda + etiquetas directas, cruceta y tooltip (también con teclado) y tabla de datos.
  Colores `--serie-1…3`: paleta categórica validada (CVD ΔE ≥ 8 y contraste ≥ 3:1 en oscuro;
  en claro la tercera tiene 2,8:1 y por eso lleva etiqueta directa y tabla).
- **Pantalla grande**: botón en la zona Históricos (la misma mecánica que en Operativa).

## D-024 · 2026-11-24 · Fase 5 · Proyecciones y escenarios
- **Escenarios** como operaciones declarativas (reutilizan formulario, tests y fichas):
  `escenario-tipo-cambio` (FX, P-017: contravalor = importe / tipo; impacto con signo según
  cobro o pago; tabla de ±1, ±2, ±5 y ±10 %) y `escenario-euribor` (Real Estate, P-005: cuota
  francesa con el nuevo TIN en todo el plazo restante; tabla de ±50, ±100 y ±200 pb; suelo del
  TIN en 0 % opcional). Aparecen en Operativa y en la zona nueva. El escenario de Euribor parte
  de la última media mensual del Banco de España si está en Históricos.
- **Montecarlo** (P-015): paseo aleatorio sobre el logaritmo (precios) o sobre el nivel (tipos),
  μ y σ de las últimas 250 variaciones, **μ = 0 por defecto** (la tendencia histórica es
  ruidosa; se puede activar), 2.000 trayectorias con semilla fija (reproducible). Se dibujan
  bandas 5–95 % y 25–75 % y la mediana, **nunca una sola línea**. Test: los percentiles
  simulados coinciden con la banda analítica calculada en LibreOffice (error < 0,5 %).
- **Validación** (P-016): origen móvil sin solapes (cada *h* periodos), μ y σ con la ventana
  anterior a cada origen; se compara la mediana del modelo con el **paseo aleatorio** (último
  valor): MAE, RMSE, U de Theil y cobertura de la banda (ideal ≈ 90 %), con gráfica de reales
  frente a proyecciones. Para la banda se usa su expresión analítica (la misma distribución que
  simula el Montecarlo) para que sea rápido.
- **Vocabulario**: "Proyecciones y escenarios", nunca "predicciones" (test en
  `tests/proyecciones.test.js`).
- Los formularios admiten un prefijo de id (`pintarOperacion(…, { prefijo })`) para poder mostrar
  la misma operación en Operativa y en Proyecciones sin id repetidos.

## D-025 · 2026-11-24 · Fase 6 · Aprendizaje continuo y mapa de conocimiento
- **Revisión mensual**: issue automático el día 1 (`revision-mensual.yml`, solo `GITHUB_TOKEN`
  con `issues: write`, sin secretos) con PR fusionadas, decisiones del mes, «⚠️ Pendiente de
  verificar» por archivo (sin contar las normas y plantillas que definen la marca) y huecos del
  mapa. La revisión la pide Aritz en el chat y se entrega en una PR (`revisiones/AAAA-MM.md`).
  No es una fase: no requiere «Autorizo la fase N».
- **Mapa**: SVG propio en tres columnas (fichas · patrones · operaciones) en vez de un grafo de
  fuerzas: es determinista, legible y no necesita librerías. El orden de patrones y operaciones
  se calcula por baricentro (Sugiyama) y las fichas se ordenan dentro de su categoría: los
  cruces bajan de 257 a 113 con el contenido actual (test). Formas distintas por tipo y color
  por categoría; resaltado de conexiones con ratón o teclado; clic abre la ficha o la operación.
- **Índice**: `conocimiento/indice.json` incluye ahora el catálogo de patrones (id, nombre,
  funciones, operaciones que lo usan y otras zonas).
- Hueco cerrado al crear el mapa: P-010 se enlaza desde la ficha de tipos de referencia del BCE.

## Palabras clave para etiquetar noticias
Editable por Aritz. La tarea de noticias (`scripts/descargar-noticias.js`) lee esta tabla en
cada ejecución: una fila por categoría (slug entre comillas invertidas) y las palabras o
expresiones separadas por comas. Se comparan en minúsculas, sin tildes y como palabras
completas sobre el titular (y las categorías que trae el feed). Un titular puede llevar
varias etiquetas. "Institucional" solo se aplica a noticias del BCE y del Banco de España.

| Categoría | Palabras clave (español e inglés) |
| --- | --- |
| `fx` | divisa, divisas, tipo de cambio, tipos de cambio, euro dólar, eurodólar, dólar, libra esterlina, yen, franco suizo, yuan, renminbi, forex, currency, currencies, dollar, sterling, exchange rate, fx |
| `empresas` | empresa, empresas, resultados, beneficio, beneficios, facturación, fusión, adquisición, opa, financiación empresarial, pyme, pymes, confirming, factoring, préstamo, préstamos, crédito empresarial, earnings, profit, merger, acquisition, takeover, company, companies |
| `bolsa-inversion` | bolsa, ibex, ibex 35, acciones, cotización, dividendo, dividendos, bono, bonos, renta fija, renta variable, fondos de inversión, etf, wall street, s&p 500, nasdaq, stocks, shares, equities, bonds, yields, investors |
| `real-estate` | vivienda, viviendas, hipoteca, hipotecas, inmobiliario, inmobiliaria, alquiler, euríbor, euribor, promotora, socimi, housing, mortgage, mortgages, property, real estate |
| `macroeconomia` | inflación, ipc, ipca, pib, paro, desempleo, empleo, déficit, deuda pública, prima de riesgo, tipos de interés, política monetaria, recesión, crecimiento económico, inflation, gdp, unemployment, interest rates, monetary policy, recession, central bank |
| `institucional` | bce, banco central europeo, banco de españa, eurosistema, supervisión bancaria, ecb, eurosystem, banking supervision |

## D-026 · 2026-11-24 · Ajuste · Verificación de fuentes en la web publicada
- **Noticias:** elEconomista responde HTTP 403 a GitHub Actions (bloqueo de servidores; no se
  disfraza la petición). Se sustituye por prensa española en abierto: Cinco Días (portada y
  compañías), El Confidencial (economía, empresas, mercados y vivienda) y Expansión (portada,
  mercados, economía y empresas). Probado con una ejecución manual del workflow en la rama:
  16 de 17 candidatas responden; la sección de mercados de Cinco Días (HTTP 370) se descarta.
- **Históricos:** las 8 series se descargan. El Euribor a un año del Banco de España
  (`D_1NBAF472`) da 3,239 % en octubre de 2026, igual que el dato oficial publicado; se
  quita la marca ⚠️ de la serie. El registro de Actions muestra ahora el último dato de
  cada serie para repetir este contraste.
- **TradingView:** Aritz comprueba en la web que los widgets cargan (dirección
  `/embed-widget/` y símbolos `FX_IDC` correctos). Salían con fondo blanco: el iframe heredaba
  `color-scheme: dark` de la página y el documento del widget no declara ninguno; cuando no
  coinciden, el navegador pinta un fondo opaco. Se fija `color-scheme: normal` en `.tv-widget`.
  Las flechas y colores dentro del widget son de TradingView y no siguen D-013.

## D-027 · 2026-11-24 · Ajuste · La web no aparece en buscadores
- **Decisión (Aritz):** `<meta name="robots" content="noindex, nofollow">` en `web/index.html`
  y en la página de redirección. La web sigue abierta para quien tenga el enlace.
- **Límites:** es una petición que respetan los buscadores principales, no un control de
  acceso. No se puede usar `robots.txt` (en un sitio de proyecto de GitHub Pages solo cuenta el
  de la raíz del dominio, que no es nuestro) ni la cabecera `X-Robots-Tag` (Pages no permite
  cabeceras propias), así que los `.md` y `.json` servidos sueltos no llevan la marca; no
  están enlazados desde fuera. El repositorio de GitHub es público e indexable aparte.

## D-028 · 2026-11-25 · Ajuste · Widgets de TradingView con fondo propio en tema oscuro
- **Problema:** Aritz vuelve a ver en blanco el panel de Divisas en la web publicada pese al
  ajuste de `color-scheme` de D-026. Con el widget transparente, lo que se ve detrás es el
  fondo que pinta el navegador bajo el iframe, y ese fondo depende del esquema de color que
  declare el documento de TradingView, que no controlamos.
- **Decisión:** en tema oscuro el widget se pide con `isTransparent: false`, de modo que pinta
  su propio fondo oscuro y no depende del navegador. En tema claro sigue transparente. Se
  mantiene `color-scheme: normal` en `.tv-widget`.
- **Límite:** el oscuro de TradingView no es exactamente el de la web. Desde el entorno de
  desarrollo no se llega a TradingView; la comprobación final es de Aritz en la web publicada.

## D-029 · 2026-11-25 · Fase 7 · Operaciones de empresas y patrones P-018 a P-022
- **Decisión:** seis operaciones nuevas (`analisis-estados-financieros`, `circulante-nof`,
  `poliza-credito`, `factoring`, `confirming`, `avales`) y `prestamo-amortizacion` ampliada con
  comisiones de apertura y estudio, gastos iniciales, coste financiero total y TAE con comisiones.
  Todas en la categoría `empresas`: son operativa de banca de empresas; ninguna encaja mejor en
  otra (los avales y el factoring no son FX ni inversión).
- **Préstamo:** se amplía la operación existente en lugar de crear `prestamo-coste-total`, porque
  el cuadro (P-005) ya da las cuotas; la TAE con comisiones es la TIR de esas cuotas (P-004)
  anualizada (P-003), así que vale para francés, alemán, americano y carencias. Se mantiene el
  aviso de periodos iguales frente a días/365.
- **Patrones nuevos:** P-018 ratios, P-019 semáforo, P-020 periodos medios y NOF, P-021 póliza de
  crédito, P-022 comisiones periódicas con mínimo. Factoring y confirming reutilizan P-001,
  P-002 y P-009.
- **Semáforo (P-019):** DFN/EBITDA < 3x cómodo, 3x–5x zona de vigilancia, ≥ 5x elevado; con
  EBITDA ≤ 0 no significativo; con DFN < 0, "caja neta positiva". DSCR ≥ 1,20x aceptable,
  < 1,00x no cubre, entre medias ajustado. Son **referencias generales de mercado, no criterios
  de ningún banco** (lo dicen la ficha y la interfaz). Siempre icono + texto.
- **Divisiones por cero:** ventas y activo total deben ser > 0 (sin ellos no hay análisis). Con
  PC, cuotas o gastos financieros en 0, el ratio afectado sale "no calculable" con un aviso; con
  EBITDA ≤ 0 o FP ≤ 0, DFN/EBITDA y ROE salen "no significativo". Así no se pierden el resto de
  ratios.
- **Referencias:** todas las fórmulas, en `generar_fods.py` (prefijos `rat_`, `circ_`, `pol_`,
  `pre_com_`, `fac_`, `cnf_`, `ava_`), calculadas por LibreOffice Calc (TASA, PAGO,
  PAGO.INT.ENTRE, MAX, MULTIPLO.SUPERIOR).

## D-030 · 2026-11-25 · Fase 7 · Confirming del cliente pagador en una operación aparte
- **Decisión:** `descuento-comercial` mantiene la modalidad confirming (anticipo del proveedor) y se
  crea `confirming` para el cliente pagador: comisión del servicio, gastos, intereses del
  aplazamiento y coste efectivo del aplazamiento. Las dos las genera la misma ficha
  (`descuento-comercial-confirming.md`).
- **Motivo:** son dos empresas distintas con datos distintos (el proveedor anticipa un cobro; el
  pagador aplaza un pago). Meterlo en el mismo formulario obligaba a campos que no se usan según
  la modalidad y mezclaba "efectivo recibido" con "pago aplazado".
- **Descartado:** un único formulario con tres modalidades.

## D-031 · 2026-11-25 · Fase 7 · `variacion: 'coste'` en los sobrecostes
- **Decisión:** en las operaciones de coste, `variacion: 'coste'` se pone en el resultado
  **sobrecoste** (coste efectivo − tipo nominal; en avales, % anual − comisión de riesgo; en el
  préstamo, TAE con comisiones − TAE sin comisiones), que sale con ▲ en rojo.
- **Motivo:** según D-013, la flecha indica dirección. Marcar un importe de coste (que no es una
  variación) mostraría "▲ sube" sin que nada suba. El sobrecoste sí es una diferencia, y es la
  que interesa: cuánto encarecen las comisiones.

## D-032 · 2026-11-25 · Fase 7 · Convenciones de cálculo (⚠️ Pendiente de verificar)
- **Póliza:** cada liquidación dura 365/m días (año de 365 días) y el saldo dispuesto es constante
  e igual al saldo medio. Apertura y estudio, sobre el límite y al inicio. La no disponibilidad se
  liquida con los intereses, con la misma base. Coste efectivo: TIR de los flujos sobre el saldo
  medio (+ excedido), no comparable con la TAE normalizada que publican las entidades.
- **Factoring:** intereses sobre lo anticipado y cobrados por anticipado; comisión de factoring
  sobre el nominal; IVA de las comisiones no incluido.
- **Confirming del pagador:** comisión y gastos en la fecha original; intereses en la fecha
  aplazada.
- **Avales:** cada periodo iniciado se cobra entero (sin prorrata), por anticipado, con mínimo
  por periodo; % anual equivalente simple sobre el importe (no hay financiación).
- **Circulante:** un único tipo de IVA para homogeneizar clientes y proveedores.
- **Ratios:** variantes de autonomía financiera, EBITDA y flujo del DSCR (explicadas en la ficha).

## D-033 · 2026-11-25 · Fase 7 · Interfaz genérica de operaciones ampliada
- **Decisión:** campos con `grupo`, `opcional`, `visibleSi` y tipo `casilla`; resultados con
  `grupo` (bloques desplegables: divulgación progresiva), `estado` (semáforo) y `anterior`;
  formatos `veces:N` y `dias:N`. Documentado en AGENTS.md §14.
- **Motivo:** el análisis de estados financieros tiene 28 campos y 16 resultados; sin bloques no
  se puede leer. Sigue sin haber lógica financiera en la interfaz.
- **Nota:** Aritz ha comprobado en la web publicada que el panel de Divisas se ve bien tras D-028.

