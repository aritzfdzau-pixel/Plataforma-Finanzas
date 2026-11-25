---
titulo: "Índices bursátiles: qué son, cómo se ponderan y cómo se revisan"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [indices, renta-variable, equities, ponderacion, capitalizacion, rentabilidad-total, rebalanceo]
operaciones: [rentabilidad-indice]
patrones: [P-025, P-006, P-014]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Metodologías públicas de los proveedores de índices (BME, STOXX, S&P Dow Jones Indices, FTSE Russell, Euronext, Nasdaq)", "Manuales generales de mercados financieros"]
---

# Índices bursátiles: qué son, cómo se ponderan y cómo se revisan

## Qué es
Un **índice bursátil** resume en un número la evolución de un grupo de acciones (un mercado, un
sector, una región). Se expresa en **puntos** y se compara consigo mismo en el tiempo: lo que
importa es cuánto sube o baja, no su nivel.

## Para qué se usa
- Medir cómo va un mercado (IBEX 35 para España, Euro Stoxx 50 para la zona euro, S&P 500 para EE. UU.).
- Servir de referencia (*benchmark*) para comparar un fondo o una cartera.
- Ser el subyacente de fondos indexados, ETF, futuros y opciones.

## Cómo funciona
- **Ponderación por capitalización** (la más común): cada empresa pesa según su valor en bolsa,
  normalmente ajustado por *free float* (solo las acciones que cotizan libremente). Las grandes
  mueven más el índice. Muchos índices ponen un **límite de peso** por empresa.
- **Ponderación por precio:** el Dow Jones suma precios: una acción cara pesa más aunque la
  empresa sea más pequeña.
- **Índice de precios** (*price index*): solo recoge la variación de las cotizaciones; los
  dividendos no cuentan (IBEX 35, Euro Stoxx 50, S&P 500, CAC 40, FTSE 100).
- **Índice de rentabilidad total** (*total return* o *performance index*): reinvierte los
  dividendos. El DAX 40 se publica así por defecto, por eso no es comparable directamente con el
  IBEX 35. Existen versiones con dividendos de casi todos los índices (p. ej. IBEX 35 con
  dividendos).
- **Rebalanceos y revisiones:** el comité o la regla del índice revisa periódicamente qué
  empresas entran y salen y sus pesos (trimestral o semestral según el índice). Por eso la
  composición que se guarda en el terminal lleva **fecha** y se revisa cada mes.
- **Divisa y horario:** cada índice se calcula en la divisa de su mercado (EUR, USD, GBP, JPY);
  comparar índices de distintas divisas sin convertir mezcla el efecto del tipo de cambio.

## Fórmulas
$$
I_t = I_{t-1} \cdot \frac{\sum_i P_{i,t} \, Q_i \, f_i}{\sum_i P_{i,t-1} \, Q_i \, f_i}
$$

$$
r_{acum} = \frac{I_{fin}}{I_{ini}} - 1, \qquad r_{anual} = \left(\frac{I_{fin}}{I_{ini}}\right)^{365/d} - 1
$$

$$
r_{total} \approx (1 + r_{acum}) \cdot (1 + y_{div})^{d/365} - 1
$$

Donde: $P_{i,t}$ = precio; $Q_i$ = acciones; $f_i$ = factor de *free float* (y límite de peso);
$d$ = días naturales; $y_{div}$ = rentabilidad por dividendo anual. La última es una
aproximación (supone dividendos constantes reinvertidos).

## Ejemplo resuelto
Índice ficticio que pasa de 10.000 a 11.500 puntos en 730 días, con una rentabilidad por
dividendo del 3 % anual. Con la operación [Rentabilidad de un índice entre dos fechas](#op=rentabilidad-indice):

| Medida | Resultado |
| --- | --- |
| Rentabilidad acumulada del precio | 15,00 % |
| Rentabilidad anualizada del precio | 7,24 % |
| Rentabilidad total acumulada (aprox., con dividendos) | 22,00 % |
| Rentabilidad total anualizada (aprox.) | 10,46 % |

Los dividendos explican casi un tercio de la rentabilidad del periodo. Verificado con
LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Resumen simple y comparable de un mercado | Los de capitalización concentran peso en pocas empresas |
| Base de productos baratos (fondos indexados, ETF) | Índices de precios y de rentabilidad total no son comparables |
| Reglas públicas y transparentes | Su composición cambia: el índice de hoy no es el de hace diez años |

## Riesgos
- Comparar un índice de precios con uno de rentabilidad total (p. ej. IBEX 35 con DAX 40).
- Olvidar el efecto divisa al comparar mercados.
- Concentración: unos pocos valores pueden explicar casi todo el movimiento del índice.

## Operaciones relacionadas
- [Rentabilidad de un índice entre dos fechas](#op=rentabilidad-indice)
- [Rentabilidad, varianza y volatilidad anualizada](#op=rentabilidad-volatilidad)
- Zona **Renta variable y renta fija**: cotización de los índices, componentes y mapa de calor (`#rv=IBEX35`).

## Fuentes
- Metodologías públicas de los proveedores de índices (BME, STOXX, S&P Dow Jones Indices, FTSE Russell, Euronext, Nasdaq).
- Manuales generales de mercados financieros (renta variable).
