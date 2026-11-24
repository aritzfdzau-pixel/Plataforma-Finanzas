---
titulo: "Título de la ficha"
idioma: es                # es | en
traduccion: ""            # ruta a la versión traducida (p. ej. tema.en.md) o vacío
categoria: fx             # fx | empresas | bolsa-inversion | real-estate | macroeconomia
etiquetas: []             # p. ej. [tipos-de-interes, cobertura]
operaciones: []           # operaciones que genera, p. ej. [fx-forward]
patrones: []              # patrones que usa (IDs del catálogo), p. ej. [P-001]
fecha_creacion: AAAA-MM-DD
ultima_revision: AAAA-MM-DD
fuentes: []               # fuentes generales consultadas (sin copiar texto de terceros)
---

<!--
Normas (AGENTS.md):
- Solo conocimiento general y ejemplos inventados. Nada de clientes, importes reales ni
  documentación o condiciones de ningún banco.
- Texto propio: no copiar manuales, apuntes de terceros ni artículos.
- Indicar base de cálculo, periodicidad, nominal/efectivo y comisiones.
- Los números del ejemplo resuelto los calcula el código (operación + tests), no la IA.
- Lo dudoso: "⚠️ Pendiente de verificar".
-->

# Título de la ficha

## Qué es
Definición breve, en una o dos frases.

## Para qué se usa
Situaciones típicas en las que aparece.

## Cómo funciona
Mecánica paso a paso. Convenciones: base de cálculo (p. ej. Act/360), periodicidad,
nominal o efectivo, comisiones.

## Fórmulas
$$
VA = \sum_{t=1}^{n} \frac{F_t}{(1+r)^t}
$$

Donde: $F_t$ = flujo en $t$; $r$ = tipo por periodo; $n$ = número de periodos.

## Ejemplo resuelto
Datos inventados. Resultado obtenido con la operación correspondiente
(enlace) y verificado por sus tests.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| … | … |

## Riesgos
- …

## Operaciones relacionadas
- [Nombre de la operación](../../operativa/operaciones/…)

## Fuentes
- Fuente general (libro, normativa pública, documentación oficial), sin copiar texto.
