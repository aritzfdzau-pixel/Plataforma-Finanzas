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
- **Decisión:** verde ▲ = el valor sube, rojo ▼ = baja, también en costes (una cuota que
  baja sale en rojo ▼). Así se cumple la norma de forma uniforme.
- **Duda para Aritz:** ¿prefieres que en costes se invierta el color (bajar = verde)?

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

## Palabras clave para etiquetar noticias
(Se rellenará en la fase 3; editable por Aritz.)
