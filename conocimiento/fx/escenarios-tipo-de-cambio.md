---
titulo: "Escenarios de tipo de cambio: cuánto cuesta un movimiento del euro"
idioma: es
traduccion: ""
categoria: fx
etiquetas: [riesgo-de-cambio, escenarios, sensibilidad, exportacion, importacion, cobertura]
operaciones: [escenario-tipo-cambio]
patrones: [P-017]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Manuales generales de finanzas internacionales y gestión del riesgo de cambio", "BCE — tipos de cambio de referencia del euro"]
---

# Escenarios de tipo de cambio: cuánto cuesta un movimiento del euro

## Qué es
Un **análisis de escenarios** responde a "¿qué pasaría si…?": cuánto cambia el contravalor en
euros de un cobro o un pago en divisa si el tipo de cambio se mueve un porcentaje dado. No es
una proyección de lo que va a ocurrir, sino una medida de **sensibilidad**.

## Para qué se usa
- Una empresa exportadora que cobrará dólares quiere saber cuánto perdería si el euro se aprecia.
- Una importadora que pagará en divisa mide cuánto le encarecería una depreciación del euro.
- Decidir si conviene cubrirse con un seguro de cambio (forward) y por qué importe.

## Cómo funciona
- Cotización del euro: **unidades de divisa por 1 EUR** (EUR/USD = 1,0850).
- Contravalor en euros = importe en divisa / tipo.
- Un movimiento de −5 % en EUR/USD significa que el euro se **deprecia**: cada dólar vale más
  euros. Para quien **cobra** dólares es una ganancia; para quien **paga** dólares, una pérdida.
- Se muestra una tabla con movimientos de ±1, ±2, ±5 y ±10 % además del elegido.
- El tipo actual se rellena con la referencia BCE del día (se puede cambiar por el de mercado).
- Sin comisiones ni margen del banco; movimiento instantáneo (sin plazo ni intereses).

## Fórmulas
$$
C_0 = \frac{I}{S}, \qquad S' = S\,(1+m), \qquad C_1 = \frac{I}{S'}, \qquad \text{Impacto} = \pm\,(C_1 - C_0)
$$

Donde: $I$ = importe en divisa; $S$ = tipo actual (divisa por 1 EUR); $m$ = movimiento relativo;
signo + para un cobro y − para un pago.

## Ejemplo resuelto
Exportadora ficticia que cobrará 100.000 USD, con EUR/USD = 1,0850. Con la operación
[Escenario de tipo de cambio](#op=escenario-tipo-cambio) y verificado con LibreOffice:

| Concepto | Valor |
| --- | --- |
| Contravalor actual | 92.165,90 € |
| EUR/USD con −5 % | 1,03075 (1,0850 × 0,95) |
| Contravalor en el escenario | 97.016,74 € |
| Impacto para quien cobra | +4.850,84 € |

Si en lugar de cobrar los pagara (importadora), el impacto sería −4.850,84 €.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Fácil de entender y de comunicar | No dice qué escenario es probable |
| Permite fijar límites de pérdida tolerable | Ignora el plazo y los tipos de interés (ver forward) |
| Ayuda a dimensionar la cobertura | Movimientos simétricos: la realidad no siempre lo es |

## Riesgos
- Confundir la dirección: un EUR/USD más bajo es un euro más débil.
- Usar el tipo de referencia del BCE como si fuera un precio negociable.
- Dejar sin cubrir posiciones grandes por confiar en un único escenario.

## Operaciones relacionadas
- [Escenario de tipo de cambio](#op=escenario-tipo-cambio)
- [Seguro de cambio (forward)](#op=fx-forward)
- [Conversión con el tipo de referencia del BCE](#op=fx-conversion-bce)

## Fuentes
- Manuales generales de finanzas internacionales: exposición transaccional y su cobertura.
- BCE — tipos de cambio de referencia del euro (cotización divisa por 1 EUR).
