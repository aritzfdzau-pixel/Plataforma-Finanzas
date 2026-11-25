---
titulo: "Préstamos: sistemas de amortización (francés, alemán y americano) con carencia"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [prestamo, amortizacion, cuadro, carencia, financiacion, bullet, cuota-constante, comisiones, tae, coste-total]
operaciones: [prestamo-amortizacion]
patrones: [P-003, P-004, P-005]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de matemática financiera (rentas y préstamos)"]
---

# Préstamos: sistemas de amortización (francés, alemán y americano) con carencia

## Qué es
Tres formas de devolver un préstamo. Los nombres son **convenciones de los manuales**, no
países: los tres sistemas se usan en cualquier mercado y divisa.
- **Francés — cuota constante** (*annuity / level payment*): al principio se pagan sobre
  todo intereses. Es el de casi todas las hipotecas y préstamos en España.
- **Alemán — amortización constante** (*constant principal / linear*): la cuota empieza
  alta y baja con el tiempo.
- **Americano — todo al vencimiento** (*bullet*): cada periodo solo se pagan intereses y el
  capital se devuelve entero en la última cuota. Habitual en financiación corporativa,
  préstamos puente y bonos.

La **carencia** es un periodo inicial sin amortizar capital.

## Para qué se usa
- Financiar inversiones de empresa (maquinaria, naves, circulante a largo plazo).
- La carencia da margen mientras la inversión empieza a generar caja.
- El alemán reduce los intereses totales a cambio de cuotas iniciales más altas.
- El bullet deja la tesorería libre durante la vida del préstamo; se usa cuando se espera un
  cobro grande al final (venta de un activo, emisión, refinanciación).

## Cómo funciona
- Tipo por periodo: $i = TIN/m$ (con $m$ cuotas al año).
- **Carencia parcial:** solo se pagan intereses; el capital no se mueve.
- **Carencia total:** no se paga nada; los intereses se **suman** a la deuda (capitalización).
- Tras la carencia, el capital pendiente se amortiza en los periodos restantes.
- Intereses totales = total pagado − capital prestado.
- Las cuotas no se redondean a céntimos (un banco puede diferir en céntimos).
- **Comisiones y gastos iniciales:** comisión de apertura y de estudio (sobre el capital) y gastos
  (notaría, tasación, gestoría…). Se pagan al firmar, así que se recibe menos dinero del que se
  devuelve.
- **Coste financiero total** = intereses + comisiones + gastos.
- **TAE con comisiones:** tipo que iguala lo recibido neto con las cuotas del cuadro (TIR de los
  flujos), anualizado. ⚠️ Pendiente de verificar: se calcula con periodos iguales (1/m de año);
  la normativa del Banco de España mide el tiempo en días/365, lo que puede dar diferencias
  mínimas. Qué gastos entran en la TAE depende de la normativa aplicable.

## Fórmulas
$$
\text{Cuota francesa} = C \cdot \frac{i}{1-(1+i)^{-n}}
$$

$$
\text{Amortización alemana} = \frac{C}{n}, \qquad \text{Cuota}_k = \frac{C}{n} + i \cdot C_{k-1}
$$

$$
\text{Americano: } \text{Cuota}_k = i \cdot C \;(k<n), \qquad \text{Cuota}_n = i \cdot C + C
$$

$$
\text{Carencia total: } C' = C \cdot (1+i)^{c}
$$

$$
C \cdot (1 - c_{ap} - c_{es}) - G = \sum_{k=1}^{N} \frac{\text{Cuota}_k}{(1+j)^k}, \qquad TAE = (1+j)^m - 1
$$

Donde: $C$ = capital al empezar a amortizar; $n$ = cuotas de amortización; $c$ = periodos de
carencia; $C_{k-1}$ = capital pendiente antes de la cuota $k$; $c_{ap}$, $c_{es}$ = comisiones de
apertura y estudio; $G$ = gastos iniciales; $N$ = número total de cuotas; $j$ = TIR por periodo.

## Ejemplo resuelto
Préstamo ficticio de 100.000 € al 5 % TIN, 60 cuotas mensuales con 6 meses de carencia
parcial. Con la operación [Préstamo: cuadro de amortización (francés, alemán, americano)](#op=prestamo-amortizacion):

| Concepto | Francés | Alemán | Americano |
| --- | --- | --- | --- |
| Cuota en carencia | 416,67 € | 416,67 € | 416,67 € |
| Primera cuota tras la carencia | 2.071,83 € | 2.268,52 € | 416,67 € |
| Última cuota | 2.071,83 € | 1.859,57 € | 100.416,67 € |
| Intereses totales | 14.378,83 € | 13.958,33 € | 25.000,00 € |

Valores verificados con LibreOffice Calc (`PAGO`, `VF`, `PAGO.INT.ENTRE` y fórmulas directas
para el americano: referencias `am_*`), tests `prestamo-amortizacion`. En el americano la
carencia parcial no cambia nada: ya se pagan solo intereses.

**Con comisiones y gastos:** el mismo préstamo en francés sin carencia (cuota 1.887,12 €), con
apertura del 1 %, estudio del 0,25 % y 300 € de gastos: intereses 13.227,40 €, coste financiero
total 14.777,40 €, importe neto recibido 98.450,00 €, TAE sin comisiones 5,1162 % y TAE con
comisiones y gastos 5,7938 %. Verificado con LibreOffice Calc (`TASA` y `PAGO.INT.ENTRE`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Francés: cuota estable, fácil de presupuestar | Francés: más intereses totales |
| Alemán: menos intereses y deuda que baja más rápido | Alemán: cuotas iniciales altas |
| Americano: cuota mínima durante toda la vida | Americano: los mayores intereses totales y un pago final enorme |
| Carencia: alivia la tesorería al principio | Carencia: encarece el préstamo (más intereses) |

## Riesgos
- En préstamos a tipo variable, la cuota cambia en cada revisión.
- **Riesgo de refinanciación** en el bullet: si al vencimiento no hay caja ni crédito, impago.
- La carencia total aumenta la deuda: el capital a devolver es mayor que el prestado.
- Comparar préstamos por el TIN: las comisiones y gastos iniciales suben la TAE (y más cuanto más corto es el plazo).
- La comisión por amortización anticipada no está incluida.

## Operaciones relacionadas
- [Préstamo: cuadro de amortización (francés, alemán, americano)](#op=prestamo-amortizacion)
- [Conversor TIN ↔ TAE](#op=tin-tae)
- [Hipoteca variable: cuota y revisión](#op=hipoteca-variable)

## Fuentes
- Manuales generales de matemática financiera: rentas constantes y sistemas de amortización.
