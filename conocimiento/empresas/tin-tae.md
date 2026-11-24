---
titulo: "TIN y TAE"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [tin, tae, tipo-efectivo, transparencia, banco-de-espana]
operaciones: [tin-tae]
patrones: [P-003, P-004, P-005]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Banco de España — Portal del Cliente Bancario (TIN y TAE)", "Circular 5/2012 del Banco de España (transparencia)"]
---

# TIN y TAE

## Qué es
- **TIN (tipo de interés nominal):** el tipo pactado; se divide entre el número de
  liquidaciones al año para obtener el tipo de cada periodo.
- **TAE (tasa anual equivalente):** el coste o rendimiento **efectivo** anual. Tiene en cuenta
  la frecuencia de liquidación y, en préstamos, las **comisiones** y gastos obligatorios.

## Para qué se usa
- Comparar productos con periodicidades y comisiones distintas.
- La normativa de transparencia del Banco de España obliga a informar de la TAE.

## Cómo funciona
- Sin comisiones, la TAE solo refleja la capitalización: con liquidación mensual, la TAE es
  mayor que el TIN.
- Con comisiones (p. ej. de apertura), se busca el tipo que iguala lo que **realmente se
  recibe** con las cuotas que se pagan (una TIR) y se anualiza.
- ⚠️ Pendiente de verificar: la normativa mide el tiempo en días/365; aquí se usan periodos
  iguales de 1/m de año, lo que puede dar diferencias mínimas.

## Fórmulas
$$
TAE = \left(1 + \frac{TIN}{m}\right)^{m} - 1 \qquad TIN = m \cdot \left[(1+TAE)^{1/m} - 1\right]
$$

$$
C \cdot (1 - c) = \sum_{k=1}^{n} \frac{\text{Cuota}}{(1+i)^k}, \qquad TAE = (1+i)^m - 1
$$

Donde: $m$ = liquidaciones al año; $c$ = comisión de apertura; $i$ = tipo periódico efectivo.

## Ejemplo resuelto
Con la operación [Conversor TIN ↔ TAE](#op=tin-tae):

| Caso | Resultado |
| --- | --- |
| TIN 6 % mensual → TAE | 6,1678 % |
| Préstamo 10.000 €, TIN 6 %, 36 cuotas, comisión apertura 1 % → TAE | 6,8842 % |

Verificado con LibreOffice Calc (`INT.EFECTIVO`, `TASA.NOMINAL`, `TASA`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| La TAE permite comparar productos | No incluye todos los gastos (p. ej. algunos seguros opcionales) |
| El TIN es sencillo de aplicar | El TIN solo engaña al comparar periodicidades distintas |

## Riesgos
- Comparar el TIN de un producto con la TAE de otro.
- En tipo variable, la TAE es orientativa: supone que el índice no cambia.

## Operaciones relacionadas
- [Conversor TIN ↔ TAE](#op=tin-tae)
- [Préstamo francés y alemán con carencia](#op=prestamo-frances-aleman)

## Fuentes
- Banco de España — Portal del Cliente Bancario: conceptos de TIN y TAE.
- Circular 5/2012 del Banco de España, sobre transparencia (cálculo de la TAE).
