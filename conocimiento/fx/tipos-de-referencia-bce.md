---
titulo: "Tipos de cambio de referencia del BCE"
idioma: es
traduccion: ""
categoria: fx
etiquetas: [bce, tipo-de-cambio, referencia, conversion]
operaciones: [fx-conversion-bce]
patrones: [P-008, P-010]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["BCE — página de tipos de cambio de referencia del euro"]
---

# Tipos de cambio de referencia del BCE

## Qué es
El Banco Central Europeo publica cada día hábil un **tipo de cambio de referencia** del euro
frente a unas treinta divisas. Se expresa como **unidades de divisa por 1 euro**.

## Para qué se usa
- Convertir importes con un tipo **oficial y neutral** en informes, contabilidad o estadística.
- Como referencia en contratos que lo pactan expresamente.
- Comparar el cambio que aplica un banco con un tipo de referencia.

## Cómo funciona
- Se publica una vez al día (en torno a las 16:00 CET), a partir de una concertación entre
  bancos centrales.
- Es **solo informativo**: no es un precio al que se pueda operar. Los bancos aplican su propio
  cambio con margen.
- Conversión de EUR a divisa: se **multiplica**; de divisa a EUR: se **divide**.
- Redondeo: 2 decimales en la mayoría de divisas y 0 en el yen (JPY).
- En la interfaz se etiqueta como **"referencia BCE"**. Una tarea programada diaria lo descarga
  del BCE (cada día hábil, después de su publicación) y la operación de conversión lo carga
  automáticamente; se puede cambiar a mano. El panel de divisas muestra también la variación
  ▲▼ frente al día hábil anterior.

## Fórmulas
$$
\text{Importe}_{div} = \text{Importe}_{EUR} \cdot T \qquad \text{Importe}_{EUR} = \frac{\text{Importe}_{div}}{T}
$$

Donde: $T$ = tipo de referencia (unidades de divisa por 1 EUR). Tipo inverso: $1/T$.

## Ejemplo resuelto
Con la operación [Conversión con el tipo de referencia del BCE](#op=fx-conversion-bce):

| Conversión | Tipo | Resultado |
| --- | --- | --- |
| 10.000 EUR → USD | 1,0850 | 10.850,00 USD |
| 250.000 JPY → EUR | 162,35 | 1.539,88 € |

Valores verificados con LibreOffice Calc (`REDONDEAR`), tests `fx-conversion-bce`.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Fuente oficial, pública y gratuita | No es un precio negociable |
| Igual para todos: evita discusiones | Un único dato al día: no refleja movimientos intradía |

## Riesgos
- Usarlo como si fuera el cambio real de una operación: el banco aplicará otro.
- Confundir el sentido de la cotización (divisa por euro frente a euro por divisa).
- CNY (renminbi en China continental) no es lo mismo que CNH (renminbi offshore).

## Operaciones relacionadas
- [Conversión con el tipo de referencia del BCE](#op=fx-conversion-bce)
- [Seguro de cambio (forward)](#op=fx-forward)

## Fuentes
- BCE — página pública de tipos de cambio de referencia del euro (metodología y horario).
