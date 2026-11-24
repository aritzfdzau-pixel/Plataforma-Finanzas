## Fase
<!-- Fase N — Nombre. Una PR por fase. -->

## Qué se ha hecho

## Cómo probarlo

## Pasos manuales para Aritz

## Decisiones tomadas
<!-- Registradas también en decisiones.md -->

## Dudas y riesgos

---

### Checklist general
- [ ] Los tests pasan (`node --test`).
- [ ] `PLAN.md` actualizado (fase en "En revisión").
- [ ] Sin dependencias externas, CDN ni scripts de terceros (salvo el componente TradingView).
- [ ] Ningún dato del usuario sale del navegador.
- [ ] Decisiones nuevas registradas en `decisiones.md`; patrones nuevos en `patrones/README.md`.

### Checklist de privacidad y derechos
- [ ] Sin datos de clientes, nombres de empresas clientes ni importes reales.
- [ ] Sin documentación interna ni condiciones de ningún banco.
- [ ] Solo fichas propias; de las noticias, solo titular y enlace.

### Checklist de revisión financiera
- [ ] Cada función financiera tiene tests con valores de referencia **y su fuente**.
- [ ] Base de cálculo indicada (Act/360, Act/365, 30/360…).
- [ ] Periodicidad indicada (mensual, trimestral, anual…).
- [ ] Nominal / efectivo indicado; TAE según normativa de transparencia del Banco de España.
- [ ] Comisiones y gastos indicados (o "sin comisiones" explícito).
- [ ] Importes en EUR con formato `es-ES`.
- [ ] Etiqueta del dato: "tiempo real (indicativo)", "con retraso" o "referencia BCE".
- [ ] Aviso "Herramienta de estudio; resultados orientativos" en cada operación.
- [ ] Lo dudoso marcado "⚠️ Pendiente de verificar" y explicado arriba.
- [ ] Patrones reutilizados; si se cambió uno, pasan los tests de todas las operaciones que lo usan.
