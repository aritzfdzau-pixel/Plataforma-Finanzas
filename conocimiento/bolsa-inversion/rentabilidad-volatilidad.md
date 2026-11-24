---
titulo: "Rentabilidad, varianza y volatilidad"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [rentabilidad, logaritmica, varianza, volatilidad, riesgo]
operaciones: [rentabilidad-volatilidad]
patrones: [P-006]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Manuales generales de gestión de carteras y estadística financiera"]
---

# Rentabilidad, varianza y volatilidad

## Qué es
- **Rentabilidad simple:** variación porcentual del precio entre dos fechas.
- **Rentabilidad logarítmica:** logaritmo del cociente de precios; se puede **sumar** en el tiempo.
- **Varianza y desviación típica:** dispersión de las rentabilidades.
- **Volatilidad anualizada:** desviación típica llevada a escala anual; medida habitual de riesgo.

## Para qué se usa
- Medir y comparar el riesgo de acciones, índices o fondos.
- Es un dato de partida para valorar opciones, calcular el VaR o construir carteras.

## Cómo funciona
- Se usan precios ordenados del más antiguo al más reciente, todos de la misma frecuencia.
- Varianza **muestral** (divisor $n-1$), como `VAR.S` en las hojas de cálculo.
- Anualización por la **raíz del tiempo**: ×√252 (diaria, sesiones), ×√52 (semanal), ×√12
  (mensual). Supone rentabilidades independientes entre periodos.
- Los precios no incluyen dividendos: para rentabilidad total hay que usar precios ajustados.
- Los datos se pegan o escriben a mano y **no salen del navegador**.

## Fórmulas
$$
R_t = \frac{P_t}{P_{t-1}} - 1 \qquad r_t = \ln\frac{P_t}{P_{t-1}}
$$

$$
s^2 = \frac{1}{n-1}\sum_{t=1}^{n}(r_t - \bar r)^2 \qquad \sigma_{anual} = s \cdot \sqrt{N}
$$

Donde: $P_t$ = precio; $n$ = número de rentabilidades; $N$ = periodos por año.

## Ejemplo resuelto
Serie diaria inventada: 100; 102; 101; 105; 104; 108. Con la operación
[Rentabilidad, varianza y volatilidad anualizada](#op=rentabilidad-volatilidad):

| Medida | Resultado |
| --- | --- |
| Rentabilidad total | 8,00 % |
| Media de rentabilidades log | 1,5392 % |
| Desviación típica muestral (log) | 2,4130 % |
| Volatilidad anualizada (log, ×√252) | 38,31 % |
| Volatilidad anualizada (simple, ×√252) | 38,84 % |

Verificado con LibreOffice Calc (`LN`, `VAR`, `DESVEST`, `RAIZ`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Medida estándar y fácil de comparar | Trata igual las subidas y las bajadas |
| Las rentabilidades log se agregan bien en el tiempo | La regla de la raíz del tiempo falla si hay autocorrelación |
| Pocos datos de entrada | Con pocos datos, la estimación es muy inestable |

## Riesgos
- Usar series cortas o con huecos: la volatilidad estimada puede estar muy lejos de la real.
- Mezclar frecuencias o no ajustar por dividendos y splits.
- Suponer que la volatilidad pasada se repetirá.

## Operaciones relacionadas
- [Rentabilidad, varianza y volatilidad anualizada](#op=rentabilidad-volatilidad)
- [VAN y TIR](#op=van-tir)

## Fuentes
- Manuales generales de gestión de carteras y estadística aplicada a finanzas.
