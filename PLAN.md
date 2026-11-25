# PLAN — Terminal financiero personal

Estados posibles: **Pendiente** · **En curso** · **En revisión** · **Cerrada**

Reglas (resumen de AGENTS.md §0): se trabaja en UNA fase a la vez; al terminarla se abre
una PR hacia `main`, la fase pasa a "En revisión" y se detiene el trabajo. Solo Aritz,
escribiendo en el chat exactamente «Autorizo la fase N», autoriza la siguiente.

| Fase | Nombre | Estado | Rama | PR |
| --- | --- | --- | --- | --- |
| 0 | Cimientos | Cerrada | `claude/intelligent-bardeen-t224t5` | #1 (fusionada) |
| 1 | Operativa (modo simple) | Cerrada | `claude/intelligent-bardeen-t224t5` | #2 (fusionada) |
| 2 | Divisas | Cerrada | `claude/intelligent-bardeen-t224t5` | #3 (fusionada) |
| 3 | Noticias | Cerrada | `claude/intelligent-bardeen-t224t5` | #4 (fusionada) |
| 4 | Históricos | Cerrada | `claude/intelligent-bardeen-t224t5` | #5 (fusionada) |
| 5 | Proyecciones y escenarios | Cerrada | `claude/intelligent-bardeen-t224t5` | #6 (fusionada) |
| 6 | Aprendizaje continuo y mapa de conocimiento | Cerrada | `claude/intelligent-bardeen-t224t5` | #7 (fusionada) |
| 7 | Análisis de empresas, circulante y operativa bancaria | En revisión | `claude/intelligent-bardeen-t224t5` | #12 |

## Fase 0 — Cimientos
- [x] Estructura de carpetas (`conocimiento/`, `patrones/`, `operativa/`, `datos/`, `web/`, `.github/`).
- [x] `AGENTS.md`, `CLAUDE.md`, `decisiones.md`, `PLAN.md`.
- [x] Plantilla de ficha (`conocimiento/_plantilla.md`).
- [x] Plantillas de issue y de PR (con checklist de revisión financiera).
- [x] Workflows: tests en cada PR (`node --test`) y despliegue en GitHub Pages.
- [x] Estética: design tokens, fuentes alojadas, modo oscuro/claro.
- [x] Esqueleto de la pantalla final con las zonas vacías ("Próximamente").

## Fase 1 — Operativa (modo simple)
- [x] Catálogo de patrones inicial (P-001 a P-009) y `operativa/lib/finanzas.js` con funciones puras.
- [x] 8 fichas fuente y sus 8 operaciones, con tests contra valores de LibreOffice Calc.
- [x] Listado generado automáticamente desde la cabecera de las fichas (`conocimiento/indice.json`).
- [x] Listado por categoría, filtro, barra "/" y enlace de cada operación a su ficha.
- [x] Aviso "Herramienta de estudio; resultados orientativos" en cada operación.
- [x] Préstamo exportable a CSV; pantalla grande; visor de fichas.

## Fase 2 — Divisas
- [x] Cabecera EUR/USD, EUR/GBP, EUR/JPY (widget de TradingView aislado) + referencia BCE del día con ▲▼.
- [x] Panel con pestañas "Contra el euro" (9 pares) y "Majors (contra el dólar)" (8 pares).
- [x] Tipos de referencia del BCE: tarea programada diaria → `datos/tipos-bce.json` (D-018).
- [x] Calendario económico filtrado por EUR, USD, GBP y JPY.
- [x] Etiquetas "tiempo real (indicativo)" / "referencia BCE"; aviso CNY ≠ CNH.
- [x] "Calcular seguro de cambio" abre la operación 1 con el par; la operación 2 usa el tipo BCE automáticamente.

## Fase 3 — Noticias
- [x] Tarea programada cada hora: RSS de prensa económica española (Cinco Días, El Confidencial, Expansión; D-026), FT, BCE y Banco de España → `datos/noticias.json` (D-022).
- [x] Un feed caído no para la tarea: se registra (Actions y estado publicado) y se sigue.
- [x] Etiquetado por sección del feed y por palabras clave editables en `decisiones.md`; varias etiquetas.
- [x] Cabecera con 5 titulares; panel «Ver todas» con filtros por fuente, categoría y texto; FT marcada «de pago».
- [x] Estado de cada feed visible en el panel (comprobación de feeds activos en cada ejecución).

## Fase 4 — Históricos
- [x] Tarea diaria: tipos BCE (DFR, MRO, MLF), €STR, tipos de cambio BCE y Euribor medio del Banco de España → `datos/historicos.json` (D-023).
- [x] Subida de CSV en el navegador (no sale de él), con validación de formato y errores por línea.
- [x] Pantalla grande: gráfica SVG con medias móviles, rentabilidades, varianza, volatilidad histórica y EWMA, correlación y máximo drawdown.
- [x] Patrones P-011 a P-014 con referencias de LibreOffice; ficha de conocimiento.

## Fase 5 — Proyecciones y escenarios
- [x] Escenarios de impacto: EUR/USD −5 % (operación `escenario-tipo-cambio`) y Euribor +100 pb (`escenario-euribor`).
- [x] Montecarlo con bandas 5 %–95 % y 25 %–75 % (nunca una sola línea), reproducible.
- [x] Validación frente al paseo aleatorio con datos pasados: MAE, RMSE, U de Theil y cobertura, con gráfica del error.
- [x] En la interfaz: "Proyecciones y escenarios", nunca "predicciones" (test).
- [x] Patrones P-015 a P-017 con referencias de LibreOffice; fichas nuevas (escenarios FX, Montecarlo).

## Fase 6 — Aprendizaje continuo y mapa de conocimiento
- [x] Procedimiento documentado de revisión mensual (`revisiones/README.md`, AGENTS.md §15).
- [x] Tarea mensual que abre el issue con el resumen (PR, decisiones, ⚠️ pendientes, huecos).
- [x] Mapa de conocimiento en SVG 2D: fichas ↔ patrones ↔ operaciones, con huecos (D-025).

## Fase 7 — Análisis de empresas, circulante y operativa bancaria
- [x] Análisis de estados financieros: EBITDA, márgenes, crecimiento, DFN/EBITDA, autonomía, liquidez, DSCR, cobertura, ROE y ROA, con semáforo orientativo y año anterior opcional (`analisis-estados-financieros`).
- [x] Circulante: PMC (alias PMR), PMP, PMA, ciclos de maduración y de caja, NOF frente al fondo de maniobra, ajuste de IVA (`circulante-nof`).
- [x] Coste de una póliza de crédito: intereses, apertura, estudio, no disponibilidad, excedido y coste efectivo (`poliza-credito`).
- [x] Préstamo con comisiones y gastos: coste financiero total y TAE con comisiones (amplía `prestamo-amortizacion`).
- [x] Factoring con y sin recurso (`factoring`); confirming del cliente pagador (`confirming`); avales y garantías (`avales`).
- [x] Patrones P-018 a P-022 con referencias de LibreOffice; 5 fichas nuevas y 2 actualizadas; sin huecos nuevos en el mapa.
- [x] Interfaz genérica: campos agrupados, opcionales y condicionales, casilla, bloques de resultados desplegables y semáforo con icono y texto.

