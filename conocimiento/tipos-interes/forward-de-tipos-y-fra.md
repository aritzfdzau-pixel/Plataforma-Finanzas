---
titulo: "Tipo forward implícito y FRA"
idioma: es
traduccion: ""
categoria: tipos-interes
etiquetas: [forward, fra, euribor, mercado-monetario, cobertura, curva-de-tipos]
operaciones: [forward-tipos]
patrones: [P-001, P-002, P-030]
fecha_creacion: 2026-11-27
ultima_revision: 2026-11-27
fuentes: ["Hull, J. C.: Options, Futures, and Other Derivatives (tipos forward y FRA)", "EMMI — definición del Euribor (Act/360, plazos de 1 semana a 12 meses)", "BCE — Portal de Datos (Euribor, media mensual)"]
---

# Tipo forward implícito y FRA

## Qué es
- **Tipo forward implícito:** el tipo para un periodo futuro que se deduce de dos tipos de
  contado de hoy. Por ejemplo, el 3x6 es el tipo a 3 meses que empezará dentro de 3 meses.
- **FRA (Forward Rate Agreement):** contrato que fija hoy el tipo de un periodo futuro. Al
  empezar el periodo se liquida solo la diferencia entre el tipo de referencia (Euribor) y el pactado.

## Para qué se usa
- Leer lo que el mercado descuenta para los tipos futuros (incluida una prima de plazo).
- Cubrir una deuda a tipo variable frente a subidas (compra de FRA) o una inversión frente a bajadas (venta).

## Cómo funciona
- Sin arbitraje, invertir a 6 meses debe rendir lo mismo que invertir a 3 meses y renovar al tipo forward.
- En el mercado monetario del euro se usa **interés simple Act/360**.
- La liquidación del FRA se paga al **inicio** del periodo, por eso se descuenta con el tipo de referencia.

## Fórmulas
$$
f_{t_1,t_2} = \frac{\dfrac{1 + r_2\,t_2}{1 + r_1\,t_1} - 1}{t_2 - t_1}
$$

$$
\text{Liquidación FRA} = \frac{N \cdot (L - K) \cdot \tau}{1 + L \cdot \tau}
$$

Donde: $t_i$ = días / 360; $N$ = nominal; $L$ = tipo de referencia; $K$ = tipo pactado; $\tau$ = días del periodo / 360.

## Ejemplo resuelto
Con la operación [Tipo forward implícito y FRA](#op=forward-tipos), tipo a 3 meses 2,00 % (90 días)
y a 6 meses 2,20 % (180 días), datos inventados:

| Resultado | Valor |
| --- | --- |
| Forward implícito 3x6 | 2,3881 % |
| FRA 1.000.000 €, K = 2,40 %, L = 2,60 %, 90 días: liquidación | 496,77 € (cobra el comprador) |

Verificado con LibreOffice Calc (fórmulas en `referencias.fods`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Fija el coste de un periodo futuro sin mover el nominal | Si los tipos bajan, el comprador paga la diferencia |
| Sencillo de valorar con la curva monetaria | Riesgo de contrapartida y documentación (contrato marco) |

## Riesgos
- Leer el forward como una previsión: incluye primas de plazo y de liquidez.
- Mezclar bases (Act/360 frente a Act/365) o plazos que no casan con el periodo cubierto.

## Operaciones relacionadas
- [Tipo forward implícito y FRA](#op=forward-tipos)
- [Seguro de cambio (forward de divisas)](#op=fx-forward)

## Fuentes
- Hull, J. C.: *Options, Futures, and Other Derivatives*, capítulo de tipos de interés (forward y FRA).
- EMMI: definición del Euribor (Act/360).
- BCE — Portal de Datos: Euribor, media mensual.
