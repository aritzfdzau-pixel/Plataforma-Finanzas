---
titulo: "Factoring: coste efectivo, con y sin recurso"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [factoring, circulante, anticipo, coste-efectivo, recurso, cobro]
operaciones: [factoring]
patrones: [P-001, P-002, P-009]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de financiación a corto plazo (factoring)"]
---

# Factoring: coste efectivo, con y sin recurso

## Qué es
La empresa **cede sus facturas** a una entidad de factoring, que gestiona el cobro y puede
**anticipar** una parte de su importe. Si es **sin recurso**, además asume el riesgo de
insolvencia de los deudores que acepta.

## Para qué se usa
- Convertir facturas a plazo en liquidez sin esperar al vencimiento.
- Externalizar la gestión de cobro.
- Sin recurso: transferir el riesgo de impago (y, si cumple los requisitos contables, sacar las
  facturas del balance).

## Cómo funciona
- **Anticipo:** un porcentaje del nominal (no siempre el 100 %).
- **Intereses** sobre lo anticipado: interés simple, Act/360 habitual, cobrados por anticipado.
- **Comisión de factoring** (gestión y cobro) sobre el **nominal** cedido.
- **Comisión de estudio** por cada deudor analizado.
- **Efectivo recibido** = anticipo − intereses − comisiones. Al vencimiento la entidad cobra la
  factura y entrega el resto (nominal − anticipo).
- **Coste efectivo anual** sobre lo anticipado: tipo compuesto en base 365 que iguala el efectivo
  de hoy con el anticipo que se "devuelve" al cobrar la factura.
- **Con recurso:** si el deudor no paga, la empresa devuelve lo anticipado. **Sin recurso:** la
  entidad asume la insolvencia (no los litigios comerciales) y suele cobrar más.

⚠️ Pendiente de verificar: algunas entidades liquidan los intereses a vencimiento y no por
anticipado; las comisiones de servicio del factoring pueden llevar IVA (no incluido).

## Fórmulas
$$
A = N \cdot a, \qquad I = A \cdot r \cdot \frac{t}{B}, \qquad E = A - I - N \cdot c_f - e \cdot k
$$

$$
i_{ef} = \left(\frac{A}{E}\right)^{365/t} - 1
$$

Donde: $N$ = nominal; $a$ = porcentaje de anticipo; $r$ = tipo anual; $t$ = días; $B$ = 360 o
365; $c_f$ = comisión de factoring; $e$ = estudio por deudor; $k$ = número de deudores.

## Ejemplo resuelto
Empresa ficticia (importes inventados): cede 100.000 € de facturas a 90 días; anticipo 80 %,
5 % Act/360, comisión de factoring 0,80 % y estudio de 60 € por un deudor. Con la operación
[Coste efectivo de factoring](#op=factoring):

| Concepto | Anticipo 80 % | Anticipo 100 % |
| --- | --- | --- |
| Importe anticipado | 80.000,00 € | 100.000,00 € |
| Intereses | 1.000,00 € | 1.250,00 € |
| Comisiones (factoring + estudio) | 860,00 € | 860,00 € |
| Efectivo recibido | 78.140,00 € | 97.890,00 € |
| Coste efectivo anual | 10,010 % | 9,034 % |

La comisión de factoring se cobra sobre el nominal: con menos anticipo, pesa más sobre lo que
de verdad se financia. Verificado con LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Liquidez y gestión de cobro en una sola operación | Coste efectivo alto por las comisiones sobre el nominal |
| Sin recurso: cubre la insolvencia del deudor aceptado | La entidad elige qué deudores acepta |

## Riesgos
- **Con recurso:** el riesgo de impago sigue en la empresa.
- Litigios comerciales (mercancía defectuosa) no los cubre ni el sin recurso.
- Comparar solo el tipo de interés y no el coste efectivo.

## Operaciones relacionadas
- [Coste efectivo de factoring](#op=factoring)
- [Coste efectivo de descuento comercial / confirming](#op=descuento-comercial)

## Fuentes
- Manuales generales de financiación a corto plazo: factoring con y sin recurso.
