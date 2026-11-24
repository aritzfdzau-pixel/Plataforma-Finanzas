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

## Palabras clave para etiquetar noticias
(Se rellenará en la fase 3; editable por Aritz.)
