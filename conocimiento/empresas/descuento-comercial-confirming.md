---
titulo: "Descuento comercial y confirming: coste efectivo"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [descuento, confirming, circulante, anticipo, coste-efectivo]
operaciones: [descuento-comercial, confirming]
patrones: [P-001, P-002, P-009]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de gestión financiera a corto plazo"]
---

# Descuento comercial y confirming: coste efectivo

## Qué es
- **Descuento comercial:** la empresa cede al banco efectos o pagarés de sus clientes y recibe
  hoy su importe menos intereses y comisiones.
- **Confirming** (*reverse factoring*): un cliente encarga al banco el pago a sus proveedores.
  Tiene dos lados:
  - **Proveedor:** puede **anticipar** el cobro pagando intereses y comisiones.
  - **Cliente pagador:** externaliza los pagos y a veces **aplaza** el pago más allá del
    vencimiento original, pagando intereses por ese aplazamiento y, si la entidad la cobra,
    una comisión por el servicio.

## Para qué se usa
- Convertir ventas a plazo en liquidez inmediata.
- Comparar el coste real de distintas formas de anticipar cobros.

## Cómo funciona
- Intereses por **interés simple** sobre el nominal: Act/360 habitual en el corto plazo.
- **Comisión** sobre el nominal, normalmente con un **mínimo** por efecto.
- **Gastos** fijos (correo, timbres…) si los hay.
- **Efectivo** = nominal − intereses − comisión − gastos.
- **Coste efectivo anual**: tipo compuesto en base 365 que iguala lo recibido hoy con el
  nominal al vencimiento. Permite comparar operaciones con plazos distintos.
- En confirming, el proveedor que **no** anticipa cobra el nominal al vencimiento sin coste.
- Algunas entidades aplican un número mínimo de días: no está incluido.
- **Cliente pagador:** coste = comisión del servicio + gastos + intereses del aplazamiento
  (nominal × tipo × días de aplazamiento / base). Si aplaza, su coste efectivo anual compara lo
  que deja de pagar hoy (nominal − comisión − gastos) con lo que paga en la fecha aplazada
  (nominal + intereses). ⚠️ Pendiente de verificar: muchas líneas no cobran nada al cliente
  pagador; se supone que la comisión se paga en la fecha original.

## Fórmulas
$$
I = N \cdot d_{\%} \cdot \frac{t}{B}, \qquad \text{Comisión} = \max(N \cdot c, \text{mínimo})
$$

$$
E = N - I - \text{Comisión} - \text{Gastos}, \qquad i_{ef} = \left(\frac{N}{E}\right)^{365/t} - 1
$$

Cliente pagador que aplaza $t_a$ días al tipo $r_a$ con comisión $c_s$ y gastos $G$:

$$
I_a = N \cdot r_a \cdot \frac{t_a}{B}, \qquad i_{ef} = \left(\frac{N + I_a}{N - N \cdot c_s - G}\right)^{365/t_a} - 1
$$

Donde: $N$ = nominal; $d_{\%}$ = tipo de descuento anual; $t$ = días; $B$ = 360 o 365;
$c$ = comisión en tanto por uno; $E$ = efectivo.

## Ejemplo resuelto
Con la operación [Coste efectivo de descuento comercial / confirming](#op=descuento-comercial):

| Concepto | Descuento | Confirming |
| --- | --- | --- |
| Nominal / plazo | 20.000 € / 60 días | 50.000 € / 90 días |
| Tipo / comisión | 6 % / 0,5 % (mín. 6 €) + 3 € | 4,5 % / 0,25 % |
| Efectivo | 19.697,00 € | 49.312,50 € |
| Coste efectivo anual | 9,732 % | 5,776 % |

Cliente pagador, con la operación [Confirming: visión del cliente pagador](#op=confirming):
50.000 € con comisión del servicio del 0,10 % y aplazamiento de 30 días al 4,5 % Act/360 →
intereses 187,50 €, coste total 237,50 € y coste efectivo anual del aplazamiento 5,941 %.

Con importes pequeños pesan los mínimos: 800 € a 30 días con las mismas condiciones del
descuento sale a un coste efectivo del 22,06 %. Verificado con LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Liquidez inmediata | Coste efectivo alto en importes pequeños o plazos cortos |
| Confirming: proveedor con riesgo del cliente pagador | El descuento suele ser "con recurso": si el cliente no paga, la empresa devuelve el importe |

## Riesgos
- **Impago** del librado en el descuento con recurso.
- Comparar solo el tipo nominal y no el coste efectivo (comisiones y mínimos).
- Dependencia del circulante de líneas bancarias renovables.

## Operaciones relacionadas
- [Coste efectivo de descuento comercial / confirming](#op=descuento-comercial) (descuento y anticipo del proveedor)
- [Confirming: visión del cliente pagador](#op=confirming)
- [Coste efectivo de factoring](#op=factoring)
- [Conversor TIN ↔ TAE](#op=tin-tae)

## Fuentes
- Manuales generales de gestión financiera a corto plazo (descuento de efectos y confirming).
