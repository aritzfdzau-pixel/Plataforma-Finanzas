---
titulo: "Intereses de demora"
idioma: es
traduccion: ""
categoria: tipos-interes
etiquetas: [demora, interes-legal-del-dinero, ley-3-2004, morosidad, impago]
operaciones: [intereses-demora]
patrones: [P-001, P-002]
fecha_creacion: 2026-11-27
ultima_revision: 2026-11-27
fuentes: ["Ley 3/2004, de medidas de lucha contra la morosidad en las operaciones comerciales (art. 7)", "Código Civil, art. 1108 (interés legal a falta de pacto)", "Ley de Presupuestos Generales del Estado (fija cada año el interés legal del dinero)", "BOE — resolución semestral de la Secretaría General del Tesoro con el tipo de demora comercial"]
---

# Intereses de demora

## Qué es
- Indemnización por el **retraso** en un pago, calculada como interés simple sobre la deuda
  desde el vencimiento hasta el pago.
- **Interés legal del dinero:** se aplica a falta de pacto (Código Civil, art. 1108). Lo fija cada
  año la Ley de Presupuestos.
- **Demora en operaciones comerciales (Ley 3/2004):** entre empresas, o entre empresas y la
  Administración, salvo pacto: tipo de las operaciones principales de financiación del BCE (MRO)
  vigente el 1 de enero o el 1 de julio, **más 8 puntos**.
- **Tipo pactado:** el que fije el contrato.

## Para qué se usa
- Reclamar o provisionar los intereses de una factura impagada.
- Comparar el coste de pagar tarde con el de financiarse.

## Cómo funciona
- Días: desde el día siguiente al vencimiento hasta el día de pago (días naturales, base 365).
- Interés simple: no se capitalizan los intereses vencidos salvo reclamación judicial (anatocismo).
- Si el retraso cruza años o semestres con tipos distintos, se calcula cada tramo con su tipo.
- La Ley 3/2004 permite reclamar además una indemnización por costes de cobro (no incluida).

## Fórmulas
$$
I = N \cdot r \cdot \frac{d}{365}, \qquad r_{comercial} = MRO_{semestre} + 8\ \text{p. p.}
$$

Donde: $N$ = importe impagado; $d$ = días de retraso; $r$ = tipo anual aplicable.

## Ejemplo resuelto
Con la operación [Intereses de demora](#op=intereses-demora), factura inventada de 15.000 € con
vencimiento el 01/10/2026 y pago el 15/12/2026 (75 días):

| Tipo aplicado | Intereses |
| --- | --- |
| Interés legal del dinero 3,25 % (⚠️ Pendiente de verificar para 2026) | 100,17 € |
| Demora comercial: MRO 2,15 % + 8 p. p. = 10,15 % (MRO del ejemplo) | 312,84 € |

Verificado con LibreOffice Calc (días con `FECHA`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Fórmula sencilla y reglada | El tipo cambia por año o semestre: hay que trocear |
| La demora comercial desincentiva pagar tarde | Reclamarla puede deteriorar la relación comercial |

## Riesgos
- Aplicar el tipo de un año o semestre que no corresponde.
- Confundir el interés legal con el interés de demora tributario (otro tipo, otra norma).
- Olvidar que los contratos pueden pactar otro tipo (con los límites de la Ley 3/2004).

## Operaciones relacionadas
- [Intereses de demora](#op=intereses-demora)
- [Descuento comercial](#op=descuento-comercial)

## Fuentes
- Ley 3/2004, de medidas de lucha contra la morosidad en las operaciones comerciales (art. 7).
- Código Civil, art. 1108.
- Ley de Presupuestos Generales del Estado de cada año (interés legal del dinero).
- BOE: resolución semestral de la Secretaría General del Tesoro con el tipo de demora comercial.
