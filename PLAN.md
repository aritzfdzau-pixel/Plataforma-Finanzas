# PLAN — Terminal financiero personal

Estados posibles: **Pendiente** · **En curso** · **En revisión** · **Cerrada**

Reglas (resumen de AGENTS.md §0): se trabaja en UNA fase a la vez; al terminarla se abre
una PR hacia `main`, la fase pasa a "En revisión" y se detiene el trabajo. Solo Aritz,
escribiendo en el chat exactamente «Autorizo la fase N», autoriza la siguiente.

| Fase | Nombre | Estado | Rama | PR |
| --- | --- | --- | --- | --- |
| 0 | Cimientos | Cerrada | `claude/intelligent-bardeen-t224t5` | #1 (fusionada) |
| 1 | Operativa (modo simple) | Cerrada | `claude/intelligent-bardeen-t224t5` | #2 (fusionada) |
| 2 | Divisas | En curso | `claude/intelligent-bardeen-t224t5` | — |
| 3 | Noticias | Pendiente | — | — |
| 4 | Históricos | Pendiente | — | — |
| 5 | Proyecciones y escenarios | Pendiente | — | — |
| 6 | Aprendizaje continuo y mapa de conocimiento | Pendiente | — | — |

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
Tarea programada de RSS → `datos/noticias.json`, etiquetado, cabecera de titulares y panel
"Ver todas" con filtros.

## Fase 4 — Históricos
Series oficiales (BCE, €STR, Euribor medio BdE), subida de CSV en el navegador, gráficas
SVG y estadísticos (volatilidad histórica y EWMA, correlación, drawdown, medias móviles).

## Fase 5 — Proyecciones y escenarios
Escenarios de impacto, Montecarlo con bandas 5 %–95 %, validación frente al paseo aleatorio.

## Fase 6 — Aprendizaje continuo y mapa de conocimiento
Procedimiento de revisión mensual y mapa SVG 2D fichas ↔ patrones ↔ operaciones.
