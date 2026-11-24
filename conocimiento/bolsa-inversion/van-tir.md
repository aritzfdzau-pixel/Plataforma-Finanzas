---
titulo: "VAN y TIR"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [van, tir, npv, irr, valoracion, inversion]
operaciones: [van-tir]
patrones: [P-004]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Brealey, Myers y Allen — Principles of Corporate Finance (capítulos de VAN y TIR)"]
---

# VAN y TIR

## Qué es
- **VAN (valor actual neto, NPV):** suma de todos los flujos de un proyecto descontados a una
  tasa que refleja su coste de oportunidad.
- **TIR (tasa interna de rentabilidad, IRR):** la tasa que hace el VAN igual a cero.

## Para qué se usa
- Decidir si una inversión crea valor: VAN > 0 a la tasa exigida.
- Comparar la rentabilidad de proyectos o calcular el rendimiento de una inversión financiera.

## Cómo funciona
- El primer flujo está en $t = 0$ (hoy) y **no se descuenta**; el resto, a periodos iguales.
- La TIR se calcula por **Newton-Raphson**; si no converge, se usa **bisección** como respaldo.
- La TIR es **por periodo**: con flujos mensuales, hay que anualizarla.
- Si los flujos cambian de signo **más de una vez**, puede haber varias TIR (o ninguna): en ese
  caso manda el VAN.

## Fórmulas
$$
VAN(k) = \sum_{t=0}^{n} \frac{F_t}{(1+k)^t} \qquad VAN(TIR) = 0
$$

$$
\text{Newton-Raphson: } r_{j+1} = r_j - \frac{VAN(r_j)}{VAN'(r_j)}, \quad VAN'(r) = -\sum_{t=1}^{n} \frac{t \cdot F_t}{(1+r)^{t+1}}
$$

Donde: $F_t$ = flujo del periodo $t$; $k$ = tasa de descuento.

## Ejemplo resuelto
Proyecto inventado: inversión de 1.000 y cobros de 300, 400 y 500 en los tres años siguientes,
con una tasa exigida del 8 %. Con la operación [VAN y TIR](#op=van-tir):

| Medida | Resultado |
| --- | --- |
| VAN al 8 % | 17,63 |
| TIR | 8,8963 % |

VAN > 0 y TIR > 8 %: el proyecto supera la rentabilidad exigida. Verificado con LibreOffice
Calc (`VNA`, `TIR`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| VAN: mide la creación de valor en euros | VAN: depende mucho de la tasa elegida |
| TIR: fácil de comunicar (un porcentaje) | TIR: puede ser múltiple o no existir |
| | TIR: supone reinvertir los flujos a la propia TIR |

## Riesgos
- Flujos previstos demasiado optimistas.
- Comparar TIR de proyectos de tamaño o duración muy distintos.
- Mezclar flujos nominales con tasas reales (o al revés).

## Operaciones relacionadas
- [VAN y TIR](#op=van-tir)
- [Conversor TIN ↔ TAE](#op=tin-tae)

## Fuentes
- Brealey, Myers y Allen — *Principles of Corporate Finance*: criterios de VAN y TIR.
