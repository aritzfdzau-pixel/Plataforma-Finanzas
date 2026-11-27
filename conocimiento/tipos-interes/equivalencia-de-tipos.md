---
titulo: "Equivalencia de tipos: bases, descuento, nominal, efectivo y real"
idioma: es
traduccion: ""
categoria: tipos-interes
etiquetas: [act-360, act-365, tipo-de-descuento, tipo-efectivo, tipo-real, fisher, inflacion]
operaciones: [equivalencia-tipos, tipo-real]
patrones: [P-001, P-003, P-028, P-029, P-031]
fecha_creacion: 2026-11-27
ultima_revision: 2026-11-27
fuentes: ["Banco de España — Portal del Cliente Bancario (TIN, TAE y base de cálculo)", "Tesoro Público — Letras del Tesoro (emisión al descuento)", "Fisher, I. (1930): The Theory of Interest (relación entre tipo nominal, real e inflación)"]
---

# Equivalencia de tipos: bases, descuento, nominal, efectivo y real

## Qué es
- Dos tipos son **equivalentes** si, aplicados al mismo capital y plazo, producen el mismo resultado.
- **Base de cálculo:** cómo se cuenta el año. Act/360 (mercado monetario del euro, Euribor, €STR)
  y Act/365 (depósitos y cuentas de clientes, libra esterlina).
- **Tipo de descuento (anticipado):** se aplica sobre el nominal y se cobra al principio
  (descuento comercial, Letras del Tesoro). **Tipo de interés (vencido):** se aplica sobre el
  efectivo y se paga al final.
- **Nominal y efectivo:** el TIN se reparte entre periodos; la TAE recoge la capitalización.
- **Tipo real:** la rentabilidad después de la inflación (ecuación de Fisher).

## Para qué se usa
- Comparar ofertas expresadas en bases o formas distintas.
- Pasar el tipo de una Letra o de un descuento a un tipo de interés comparable.
- Saber si un depósito o un préstamo gana o pierde frente a la inflación.

## Cómo funciona
- Cambio de base: mismos intereses en los mismos días, así que el tipo se multiplica por el cociente de divisores.
- Descuento ↔ interés: un descuento $d$ a $t$ años deja un efectivo $N(1 - d\,t)$; el tipo de
  interés que lleva ese efectivo al nominal es $d / (1 - d\,t)$.
- Tipo real: $(1+n)/(1+\pi) - 1$; la aproximación $n - \pi$ solo vale con tipos e inflación bajos.

## Fórmulas
$$
r_{365} = r_{360} \cdot \frac{365}{360}, \qquad i = \frac{d}{1 - d\,t}, \qquad d = \frac{i}{1 + i\,t}
$$

$$
TAE = \left(1 + \frac{TIN}{m}\right)^{m} - 1, \qquad r_{real} = \frac{1 + n}{1 + \pi} - 1 \approx n - \pi
$$

Donde: $t$ = días / 360; $m$ = liquidaciones al año; $n$ = tipo nominal efectivo anual; $\pi$ = inflación.

## Ejemplo resuelto
Con la operación [Equivalencia de tipos](#op=equivalencia-tipos):

| Caso | Resultado |
| --- | --- |
| 3 % en Act/360 expresado en Act/365 | 3,0417 % |
| Descuento del 4 % a 90 días → tipo de interés | 4,0404 % |
| Interés del 4 % a 90 días → tipo de descuento | 3,9604 % |
| TIN 6 % mensual → TAE | 6,1678 % |

Con la operación [Tipo de interés real (Fisher)](#op=tipo-real), nominal 3 % e inflación 2,2 %:
tipo real exacto 0,7828 % (aproximación 0,80 %); 10.000 € a 5 años valen 11.592,74 € nominales
y 10.397,57 € en euros de hoy.

Verificado con LibreOffice Calc (fórmulas en `referencias.fods`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Permite comparar productos heterogéneos | Las equivalencias suponen reinversión al mismo tipo |
| El tipo real mide el poder adquisitivo | La inflación futura es desconocida: es un escenario |

## Riesgos
- Mezclar bases: un 3 % Act/360 paga más que un 3 % Act/365.
- Tratar un tipo de descuento como si fuera de interés (se infravalora el coste).
- Usar la aproximación de Fisher con inflación alta.

## Operaciones relacionadas
- [Equivalencia de tipos (bases, descuento, nominal y efectivo)](#op=equivalencia-tipos)
- [Tipo de interés real (Fisher)](#op=tipo-real)
- [Descuento comercial](#op=descuento-comercial)

## Fuentes
- Banco de España — Portal del Cliente Bancario: TIN, TAE y base de cálculo.
- Tesoro Público: las Letras del Tesoro se emiten al descuento.
- Fisher, I. (1930): *The Theory of Interest*.
