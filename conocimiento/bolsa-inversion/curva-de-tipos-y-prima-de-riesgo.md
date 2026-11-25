---
titulo: "Curva de tipos soberana y prima de riesgo"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [renta-fija, fixed-income, curva-de-tipos, prima-de-riesgo, spread, bonos, yield]
operaciones: [bono-precio-rentabilidad]
patrones: [P-023, P-024, P-004]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["BCE — curvas de tipos del área del euro y tipos a largo plazo (criterio de convergencia)", "Bundesbank, Banco de Inglaterra y Reserva Federal — estadísticas públicas de rentabilidades", "Manuales generales de renta fija"]
---

# Curva de tipos soberana y prima de riesgo

## Qué es
- **Curva de tipos soberana** (*yield curve*): la rentabilidad (*yield*) de la deuda de un
  Estado para cada plazo (2, 5, 10, 30 años…), en un mismo día.
- **Prima de riesgo** (*spread*): la diferencia, en **puntos básicos** (1 pb = 0,01 %), entre la
  rentabilidad del bono a 10 años de un país y la del alemán (Bund), que se toma como referencia
  de menor riesgo en la zona euro.

## Para qué se usa
- Ver qué espera el mercado de los tipos y del crecimiento (pendiente de la curva).
- Medir cuánto más paga un Estado que Alemania por financiarse (riesgo de crédito y de liquidez).
- Referencia para el precio de préstamos, hipotecas y bonos de empresas.

## Cómo funciona
- **Rentabilidad frente a precio:** son dos formas de expresar lo mismo y se mueven en sentido
  contrario. Si la rentabilidad sube, el precio del bono baja, y más cuanto más largo es el bono.
- **Pendiente 10a–2a:** diferencia en pb entre el 10 años y el 2 años. Positiva = curva normal;
  negativa = **curva invertida**, que históricamente ha precedido a muchas recesiones.
- **Prima de riesgo:** se calcula con datos de la **misma fuente y fecha** para los dos países.
  En el terminal se usa la media mensual del BCE (criterio de convergencia) para España,
  Francia, Italia y Alemania.
- **Fuentes del terminal** (oficiales, gratuitas, sin clave):
  - Alemania: curva del Bundesbank, diaria.
  - Reino Unido: Banco de Inglaterra, diaria.
  - EE. UU.: Reserva Federal (FRED), diaria.
  - Zona euro: curva AAA del BCE, diaria.
  - España, Francia e Italia: solo el 10 años en media mensual (BCE).

  ⚠️ Pendiente de verificar: no hay una curva diaria española oficial sin clave localizada; el
  Banco de España publica la rentabilidad diaria del 10 años en sus tablas, pero no se ha
  confirmado su código de serie.
- **Convención del precio:** en fecha de cupón, por 100 de nominal, sin cupón corrido; la
  rentabilidad se compone con la frecuencia del cupón (anual en los bonos del Estado español y
  alemán, semestral en el Treasury y el Gilt).

## Fórmulas
$$
\text{Prima (pb)} = (y_{país,10} - y_{Bund,10}) \cdot 100, \qquad \text{Pendiente (pb)} = (y_{10} - y_{2}) \cdot 100
$$

$$
P = \sum_{k=1}^{n \cdot f} \frac{100\,c/f}{(1+y/f)^{k}} + \frac{100}{(1+y/f)^{n f}}
$$

Donde: $y$ = rentabilidad (yield) anual; $c$ = cupón anual; $f$ = cupones al año; $n$ = años.
La rentabilidad a partir del precio es la TIR de esos flujos (sin fórmula cerrada).

## Ejemplo resuelto
Con la operación [Bono: precio ↔ rentabilidad (TIR)](#op=bono-precio-rentabilidad), un bono
ficticio con cupón del 3 % anual y rentabilidad del 3,5 % (cotiza bajo la par: 50 pb sobre el cupón):

| Plazo | Precio | Precio si la rentabilidad sube 100 pb | Variación |
| --- | --- | --- | --- |
| 2 años | 99,0502 | 97,1910 | −1,877 % |
| 10 años | 95,8417 | 88,1309 | −8,045 % |
| 30 años | 90,8040 | 75,5667 | −16,780 % |

Prima de riesgo con rentabilidades ficticias del 4,066 % (país) y el 3,416 % (Bund): 65 pb.
Verificado con LibreOffice Calc (VA y TASA).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Resume en una línea las condiciones de financiación de un país | Cada fuente usa su método (cupón cero, a la par, mercado) |
| La prima es comparable entre países de la zona euro | Las medias mensuales llegan con retraso y suavizan los movimientos |

## Riesgos
- Confundir rentabilidad con precio, o pb con puntos porcentuales.
- Comparar curvas de fuentes con métodos distintos (cupón cero frente a par).
- **Riesgo de tipo de interés:** cuanto más largo el bono, más cae su precio si suben los tipos.

## Operaciones relacionadas
- [Bono: precio ↔ rentabilidad (TIR)](#op=bono-precio-rentabilidad)
- [VAN y TIR](#op=van-tir)
- Zona **Renta variable y renta fija** → Renta fija: curvas y primas de riesgo (`#rf=ES10Y`).

## Fuentes
- BCE: curvas de tipos del área del euro (YC) y tipos a largo plazo por país (IRS).
- Bundesbank, Banco de Inglaterra y Reserva Federal de San Luis (FRED): estadísticas públicas de rentabilidades.
- Manuales generales de renta fija.
