---
titulo: "Póliza de crédito: coste total y coste efectivo"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [poliza-de-credito, linea-de-credito, circulante, comisiones, coste-efectivo, excedido]
operaciones: [poliza-credito]
patrones: [P-021, P-003, P-004]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de financiación bancaria a corto plazo"]
---

# Póliza de crédito: coste total y coste efectivo

## Qué es
Una línea de crédito (*credit line*) con un **límite** del que la empresa dispone y devuelve
cuando quiere durante el plazo. Paga intereses solo por lo **dispuesto** y, a menudo, una
comisión por lo **no dispuesto**.

## Para qué se usa
- Cubrir desfases de tesorería del circulante (NOF que no cubre el fondo de maniobra).
- Tener liquidez disponible sin pagar intereses por todo el importe.

## Cómo funciona
- **Intereses:** saldo dispuesto × tipo deudor × días / base (Act/360 habitual).
- **Comisión de apertura** y **de estudio:** porcentaje sobre el límite, al inicio.
- **Comisión de no disponibilidad:** porcentaje anual sobre el saldo medio no dispuesto, con cada
  liquidación.
- **Excedido:** lo que se dispone por encima del límite paga un tipo mayor (y a veces una
  comisión propia, no incluida).
- **Liquidación** mensual o trimestral. Convención de la operación: cada periodo dura 365/m días
  y el saldo dispuesto es constante e igual al saldo medio.
- **Coste efectivo anual:** TIR de los flujos (recibe el saldo medio menos comisiones iniciales,
  paga intereses y comisiones en cada liquidación y devuelve el saldo al final) anualizada.
  ⚠️ Pendiente de verificar: la TAE que publican las entidades para una póliza usa hipótesis
  normalizadas de disposición y no es comparable con este coste sobre el saldo medio.

## Fórmulas
$$
I_p = S \cdot r \cdot \frac{365/m}{B}, \qquad ND_p = (L - S) \cdot c_{nd} \cdot \frac{365/m}{B}
$$

$$
\text{Coste total} = n\,(I_p + ND_p + E_p) + L\,(c_{ap} + c_{es})
$$

$$
S - L\,(c_{ap} + c_{es}) = \sum_{k=1}^{n} \frac{I_p + ND_p + E_p}{(1+i)^k} + \frac{S}{(1+i)^n}, \qquad i_{ef} = (1+i)^m - 1
$$

Donde: $L$ = límite; $S$ = saldo medio dispuesto (más el excedido, si lo hay); $r$ = tipo
deudor; $m$ = liquidaciones al año; $n$ = liquidaciones del plazo; $B$ = 360 o 365;
$E_p$ = intereses del excedido por periodo.

## Ejemplo resuelto
Empresa ficticia (importes inventados): límite 200.000 €, 12 meses, saldo medio dispuesto
120.000 €, tipo 5 % Act/360 con liquidación trimestral, apertura 0,50 %, estudio 0,25 % y no
disponibilidad 0,10 %. Con la operación [Coste de una póliza de crédito](#op=poliza-credito):

| Concepto | Saldo medio 120.000 € | Saldo medio 40.000 € |
| --- | --- | --- |
| Intereses | 6.083,33 € | 2.027,78 € |
| Comisiones (apertura + estudio) | 1.500,00 € | 1.500,00 € |
| No disponibilidad | 81,11 € | 162,22 € |
| Coste total | 7.664,44 € | 3.690,00 € |
| Coste efectivo anual | 6,595 % | 9,789 % |

Usar poco una póliza grande la encarece: las comisiones sobre el límite pesan más. Verificado
con LibreOffice Calc (función TASA).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Flexibilidad: se paga por lo dispuesto | Comisiones sobre el límite aunque no se use |
| Liquidez disponible para imprevistos | Renovación anual: puede no renovarse en un mal momento |

## Riesgos
- **Renovación:** si no se renueva, hay que devolver el saldo dispuesto.
- Usar la póliza para financiar NOF permanentes o inversiones a largo.
- Excedidos frecuentes: tipo y comisiones mucho más caros.

## Operaciones relacionadas
- [Coste de una póliza de crédito](#op=poliza-credito)
- [Circulante: periodos medios y NOF](#op=circulante-nof)

## Fuentes
- Manuales generales de financiación bancaria a corto plazo (pólizas de crédito).
