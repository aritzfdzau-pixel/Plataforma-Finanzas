# PLAN — Terminal financiero personal

Estados posibles: **Pendiente** · **En curso** · **En revisión** · **Cerrada**

Reglas (resumen de AGENTS.md §0): se trabaja en UNA fase a la vez; al terminarla se abre
una PR hacia `main`, la fase pasa a "En revisión" y se detiene el trabajo. Solo Aritz,
escribiendo en el chat exactamente «Autorizo la fase N», autoriza la siguiente.

| Fase | Nombre | Estado | Rama | PR |
| --- | --- | --- | --- | --- |
| 0 | Cimientos | En revisión | `claude/intelligent-bardeen-t224t5` | (ver PR de la fase 0) |
| 1 | Operativa (modo simple) | Pendiente | — | — |
| 2 | Divisas | Pendiente | — | — |
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
Catálogo de patrones inicial, `operativa/lib/finanzas.js`, 8 fichas + 8 operaciones con
tests, listado autogenerado desde las fichas, buscador y barra "/".

## Fase 2 — Divisas
Cabecera EUR/USD, EUR/GBP, EUR/JPY (TradingView aislado), panel con dos pestañas, tipos de
referencia del BCE (tarea diaria), calendario económico, enlace a operaciones 1 y 2.

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
