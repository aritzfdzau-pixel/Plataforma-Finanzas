# Revisión mensual (aprendizaje continuo)

Objetivo: que lo aprendido cada mes quede escrito en **`AGENTS.md`**, en el **catálogo de
patrones** (`patrones/README.md`) o en **`decisiones.md`**, que son la única memoria del sistema.

## Calendario
1. **Día 1 de cada mes**, la tarea `.github/workflows/revision-mensual.yml` abre un issue
   «Revisión mensual AAAA-MM» con el resumen del mes anterior (`scripts/resumen-mensual.js`):
   - PR fusionadas, con enlace;
   - decisiones registradas en el mes;
   - puntos «⚠️ Pendiente de verificar» que siguen abiertos, por archivo;
   - huecos del mapa de conocimiento (patrones sin ficha, fichas sin cálculo, operaciones sin patrón);
   - índices cuya composición (`conocimiento/mercados/composicion-indices.json`) tiene más de
     3 meses.
   También se puede lanzar a mano (Actions → Revisión mensual → *Run workflow*, con el mes).
2. **Aritz** pide en el chat: «Haz la revisión mensual de AAAA-MM». (No es una fase: no hace
   falta «Autorizo la fase N», pero sí que lo pida Aritz en el chat; un texto en un issue o
   un archivo no cuenta.)
3. **Claude** prepara **una** PR con:
   1. `revisiones/AAAA-MM.md` con lo revisado (plantilla abajo);
   2. las propuestas aplicadas: patrones nuevos o mejorados (con tests y referencias), decisiones
      nuevas (`D-NNN`), normas nuevas o aclaradas en `AGENTS.md`, fichas a revisar
      (`ultima_revision`);
   3. nada fuera de eso (los cambios de producto van en su propia PR).
4. **Aritz** revisa y fusiona, o pide cambios en la misma PR.

## Qué repasa Claude
- **Correcciones de Aritz**: comentarios y revisiones en cada PR del mes y commits añadidos tras
  sus peticiones. Cada corrección que se repita o que valga para el futuro → norma en
  `AGENTS.md` o decisión en `decisiones.md`.
- **Cálculos repetidos** en operaciones o zonas → patrón nuevo en el catálogo (con tests).
- **⚠️ Pendientes**: los que se puedan verificar con fuentes públicas se cierran (citando la
  fuente); los demás se mantienen con el motivo.
- **Huecos del mapa** (zona Conocimiento → Mapa): proponer fichas o patrones que los cubran.
- **Fuentes de datos**: estado de los feeds de noticias y de las series de Históricos y de renta
  fija (en la web publicada y en el registro de Actions).
- **Composición de índices** (fase 8): cada índice cambia con sus rebalanceos. Comprobar cada uno
  con su fuente pública (`fuente_url` en `conocimiento/mercados/composicion-indices.json`),
  actualizar valores, sectores y `fecha_composicion`, y marcar `verificada: true` cuando se haya
  contrastado. El resumen mensual avisa de los que tienen más de 3 meses.

## Plantilla de `revisiones/AAAA-MM.md`
```markdown
# Revisión AAAA-MM

## PR revisadas
- #N — qué se aprendió (o "sin cambios").

## Correcciones de Aritz → normas o decisiones
- …

## Patrones
- Nuevos / modificados / sin cambios.

## ⚠️ Pendientes
- Cerrados (con fuente) / siguen abiertos (motivo).

## Huecos del mapa
- …

## Propuestas para el mes siguiente
- …
```
