---
titulo: "Volatilidad EWMA, correlación, drawdown y medias móviles"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [volatilidad, ewma, riskmetrics, correlacion, drawdown, medias-moviles, historicos, riesgo]
operaciones: []
patrones: [P-006, P-011, P-012, P-013, P-014]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["J.P. Morgan/Reuters — RiskMetrics Technical Document (1996), metodología EWMA", "Manuales generales de gestión de carteras y estadística financiera"]
---

# Volatilidad EWMA, correlación, drawdown y medias móviles

## Qué es
Cuatro medidas que se calculan sobre una serie histórica (cotización, tipo de cambio o tipo
de interés):
- **Volatilidad EWMA**: volatilidad con media exponencial, que pesa más lo reciente.
- **Correlación (Pearson)**: cuánto se mueven juntas dos series (de −1 a +1).
- **Máximo drawdown**: la peor caída desde un máximo anterior.
- **Media móvil**: promedio de los últimos *n* datos, para suavizar la serie.

## Para qué se usa
- Medir el riesgo de una divisa o una acción y ver si está aumentando (EWMA reacciona antes
  que la volatilidad histórica).
- Diversificar y cubrir: dos activos poco correlacionados reducen el riesgo de la cartera.
- Saber cuánto se pudo perder en el peor momento (drawdown), algo que la volatilidad no dice.
- Ver la tendencia sin el ruido diario (medias de 20 y 50 sesiones; 3 y 12 meses en series mensuales).

## Cómo funciona
- **Rentabilidades**: se usan las **logarítmicas** entre observaciones consecutivas. En los
  **tipos de interés** no hay "rentabilidad": se usan las **variaciones en puntos básicos**.
- **Anualización**: volatilidad × √m, con *m* = 252 (diaria, días hábiles), 52 (semanal),
  12 (mensual). La periodicidad se deduce de las fechas.
- **EWMA (RiskMetrics)**: λ = 0,94 para datos diarios; la media de las rentabilidades se
  supone 0. La primera varianza es el cuadrado de la primera rentabilidad (ver fórmula). El
  resultado es la estimación para el periodo siguiente.
- **Correlación**: solo en las fechas comunes a las dos series y sobre sus variaciones, nunca
  sobre los niveles (dos series con tendencia parecen correlacionadas aunque no lo estén).
- **Drawdown**: se calcula sobre niveles (precios), no sobre rentabilidades.
- Sin dividendos ni costes; los datos oficiales del BCE son tipos de referencia, no precios negociables.

## Fórmulas
$$
\sigma^2_1 = r_1^2, \qquad \sigma^2_t = \lambda\,\sigma^2_{t-1} + (1-\lambda)\,r_t^2, \qquad \sigma_{anual} = \sqrt{\sigma^2_n \cdot m}
$$

$$
\rho_{xy} = \frac{\sum (x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum (x_i-\bar x)^2 \sum (y_i-\bar y)^2}}
$$

$$
\text{MDD} = \min_t \left( \frac{P_t}{\max_{s \le t} P_s} - 1 \right), \qquad MM_t(n) = \frac{1}{n}\sum_{k=0}^{n-1} P_{t-k}
$$

Donde: $r_t$ = rentabilidad logarítmica del periodo $t$; $\lambda$ = factor de decaimiento;
$m$ = periodos por año; $P_t$ = precio en $t$.

## Ejemplo resuelto
Datos inventados. Calculado con LibreOffice Calc (referencias en
`operativa/tests/referencias/referencias.fods`) y verificado por los tests de P-011 a P-014:

| Medida | Datos | Resultado |
| --- | --- | --- |
| Volatilidad histórica anualizada | Precios 100, 102, 101, 105, 104, 108 (diarios) | 38,31 % |
| Volatilidad EWMA anualizada (λ = 0,94) | La misma serie | 34,84 % |
| Media móvil de 3 | Últimos tres precios: 105, 104, 108 | 105,67 |
| Máximo drawdown | 100, 110, 105, 95, 120, 90, 100 | −25,00 % (de 120 a 90) |
| Correlación | Dos series de rentabilidades inventadas de 5 datos | 0,9625 |

Con datos reales, la zona **Históricos** de la web calcula todo esto sobre las series del BCE
y del Banco de España o sobre un CSV propio (que no sale del navegador).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| EWMA reacciona rápido a cambios de régimen | Depende de λ y del arranque; con pocos datos es inestable |
| La correlación resume la relación en un número | Solo mide relación lineal y cambia en las crisis |
| El drawdown mide la pérdida que se sufre de verdad | Depende del periodo elegido y no dice cuánto se tardó en recuperar |
| Las medias móviles suavizan el ruido | Van con retraso respecto al precio |

## Riesgos
- Confundir correlación con causalidad, o calcularla sobre niveles en vez de variaciones.
- Anualizar con el *m* equivocado (p. ej. √252 en una serie mensual).
- Tratar un tipo de referencia (BCE, Euribor medio) como un precio al que se puede operar.

## Operaciones relacionadas
- [Rentabilidad, varianza y volatilidad anualizada](#op=rentabilidad-volatilidad)
- Zona **Históricos** de la web: series oficiales y CSV propio, con gráfica y estadísticos.

## Fuentes
- J.P. Morgan/Reuters — *RiskMetrics Technical Document* (1996): metodología EWMA y λ = 0,94.
- Manuales generales de gestión de carteras y estadística financiera.
