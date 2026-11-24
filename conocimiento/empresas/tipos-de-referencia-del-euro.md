---
titulo: "Tipos de referencia del euro: tipos del BCE, €STR y Euribor"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [bce, politica-monetaria, estr, euribor, eonia, interbancario, facilidad-de-deposito, t2]
operaciones: []
patrones: [P-001, P-002]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["BCE — marco operativo de la política monetaria y página del €STR", "EMMI — metodología híbrida del Euribor", "Banco de España — tipos de referencia oficiales"]
---

# Tipos de referencia del euro: tipos del BCE, €STR y Euribor

## Qué es
Los tipos que sirven de base para casi toda la financiación en euros:
- **Tipos oficiales del BCE**: facilidad de depósito (DFR), operaciones principales de
  financiación (MRO) y facilidad marginal de crédito (MLF).
- **€STR** (*euro short-term rate*): tipo a un día del mercado mayorista del euro.
- **Euribor**: tipos a plazo (1 semana a 12 meses) del mercado interbancario sin garantía.

## Para qué se usa
- El BCE los mueve para cumplir su objetivo de inflación.
- El Euribor indexa préstamos y la mayoría de hipotecas variables en España.
- El €STR es la referencia "sin riesgo" del euro: descuento de derivados, swaps OIS y
  forwards de divisas.

## Cómo funciona
**Objetivo del BCE.** Estabilidad de precios: inflación del **2 % a medio plazo, simétrico**
(desviaciones al alza y a la baja igual de indeseables), medida con el IPCA (índice armonizado).
Este objetivo sustituyó en 2021 al antiguo "inferior pero próximo al 2 %".

**Corredor de tipos.** La MLF es el techo y la DFR el suelo del tipo a un día. Con mucha
liquidez en el sistema, el tipo de mercado se queda pegado a la **DFR**, que es hoy el tipo
con el que el BCE señala su política. Desde septiembre de 2024 la diferencia entre MRO y DFR
es de 15 puntos básicos (antes 50).

**Instrumentos.** Operaciones de mercado abierto (semanales y a tres meses), facilidades
permanentes a un día y reservas mínimas (coeficiente del 1 %, sin remunerar desde 2023).

**€STR.** Lo publica el BCE cada día hábil (desde octubre de 2019) a partir de los préstamos
a un día sin garantía que toman los bancos de la zona euro; se calcula como media recortada
ponderada por volumen. **Sustituyó al EONIA**, que se publicó como €STR + 8,5 pb hasta su
desaparición el 3 de enero de 2022. El LIBOR en euros también desapareció a finales de 2021.

**Euribor.** Lo administra el **EMMI** (European Money Markets Institute) con una metodología
**híbrida** (operaciones reales y, si faltan, interpolación y juicio experto) desde 2019.
Plazos vigentes: 1 semana, 1, 3, 6 y 12 meses. Se publica hacia las 11:00 (hora de Bruselas),
base Act/360 y liquidación T+2. El Euribor diario está sujeto a licencia; el **índice oficial
para hipotecas** es la **media mensual del Euribor a un año que publica el Banco de España**.

**Pagos.** Los grandes pagos en euros se liquidan en **T2**, el sistema de liquidación bruta
en tiempo real del Eurosistema que sustituyó a TARGET2 en marzo de 2023.

⚠️ Los niveles actuales de los tipos no se escriben aquí: cambian en cada reunión del BCE y
se cargarán de fuentes oficiales en las fases 2 y 4.

## Fórmulas
$$
\text{Interés} = N \cdot r \cdot \frac{d}{360} \qquad (\text{€STR y Euribor: base Act/360, interés simple})
$$

$$
\text{€STR compuesto} = \left[\prod_{i=1}^{n}\left(1 + \frac{r_i \cdot d_i}{360}\right) - 1\right] \cdot \frac{360}{D}
$$

Donde: $r_i$ = €STR del día $i$; $d_i$ = días naturales a los que se aplica; $D$ = días totales del periodo.

## Ejemplo resuelto
Depósito interbancario inventado de 1.000.000 € a 90 días al 2,00 % (Act/360): intereses =
1.000.000 × 0,02 × 90/360. Es el patrón P-002 (interés simple) que usa la operación de
[Coste efectivo de descuento comercial / confirming](#op=descuento-comercial) con esos datos
(nominal 1.000.000, 90 días, 2 %, sin comisiones): intereses de 5.000,00 €.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| €STR: basado en operaciones reales, difícil de manipular | €STR: es a un día; para plazos hay que componerlo |
| Euribor: incluye una prima de riesgo bancario y de plazo, útil para préstamos | Euribor: menos operaciones reales en algunos plazos |
| Tipos del BCE: señal clara y pública | Las decisiones cambian los tipos de golpe |

## Riesgos
- **Riesgo de tipo de interés**: subidas del Euribor encarecen préstamos e hipotecas variables.
- Usar índices desaparecidos (EONIA, LIBOR) en contratos antiguos: hay cláusulas de sustitución.
- Confundir el Euribor diario con la media mensual oficial.

## Operaciones relacionadas
- [Hipoteca variable: cuota y revisión](#op=hipoteca-variable)
- [Seguro de cambio (forward)](#op=fx-forward)
- [Coste efectivo de descuento comercial / confirming](#op=descuento-comercial)

## Fuentes
- BCE — páginas públicas sobre el marco operativo (revisión de 2024), la estrategia (2021) y el €STR.
- EMMI — documentación pública de la metodología híbrida del Euribor.
- Banco de España — tipos de referencia oficiales del mercado hipotecario.
