---
titulo: "Capitalización simple y compuesta y depósitos a plazo"
idioma: es
traduccion: ""
categoria: tipos-interes
etiquetas: [interes-simple, interes-compuesto, capitalizacion-continua, deposito, plazo-fijo, tae, fgd]
operaciones: [capitalizacion, deposito-plazo]
patrones: [P-001, P-002, P-003, P-009, P-028]
fecha_creacion: 2026-11-27
ultima_revision: 2026-11-27
fuentes: ["Banco de España — Portal del Cliente Bancario (depósitos a plazo, TIN y TAE)", "Circular 5/2012 del Banco de España (transparencia; cálculo de la TAE)", "Fondo de Garantía de Depósitos de Entidades de Crédito (cobertura de 100.000 €)"]
---

# Capitalización simple y compuesta y depósitos a plazo

## Qué es
- **Interés simple:** los intereses se calculan siempre sobre el capital inicial. Es el régimen del
  corto plazo (menos de un año) y de los depósitos con pago al vencimiento.
- **Interés compuesto:** los intereses de cada periodo se suman al capital y generan nuevos
  intereses («interés sobre interés»).
- **Capitalización continua:** el límite del compuesto con infinitas capitalizaciones; se usa en
  valoración de derivados y en modelos teóricos.
- **Depósito a plazo fijo:** el cliente entrega un importe a la entidad durante un plazo a cambio
  de un tipo pactado (TIN). Se informa también de su **TAE**.

## Para qué se usa
- Comparar regímenes de capitalización y periodicidades.
- Calcular los intereses brutos y netos de un depósito y su TAE.
- Explicar por qué la TAE es mayor que el TIN cuando hay liquidaciones frecuentes.

## Cómo funciona
- Depósito con **pago al vencimiento**: intereses = capital × TIN × días / base (Act/365 habitual).
  La TAE anualiza ese rendimiento en días/365 con capitalización compuesta.
- Depósito con **liquidación periódica**: cada periodo se abona TIN / m; la TAE supone que esos
  intereses se reinvierten al mismo tipo: $(1 + TIN/m)^m - 1$.
- Sobre los intereses se practica la **retención** a cuenta del IRPF (19 % en el ejemplo; comprueba el vigente).
- El **Fondo de Garantía de Depósitos** cubre hasta 100.000 € por titular y entidad.

## Fórmulas
$$
C_{simple} = C (1 + r\,t), \qquad C_{comp} = C \left(1 + \frac{r}{m}\right)^{m t}, \qquad C_{cont} = C\,e^{r t}
$$

$$
TAE_{vencimiento} = \left(1 + r \cdot \frac{d}{B}\right)^{365/d} - 1, \qquad TAE_{periódica} = \left(1 + \frac{r}{m}\right)^{m} - 1
$$

Donde: $C$ = capital; $r$ = tipo nominal anual; $t$ = años; $m$ = capitalizaciones al año; $d$ = días; $B$ = 365 o 360.

## Ejemplo resuelto
Con la operación [Interés simple, compuesto y continuo](#op=capitalizacion), 10.000 € al 3 % durante 5 años:

| Régimen | Capital final |
| --- | --- |
| Simple | 11.500,00 € |
| Compuesta anual | 11.592,74 € |
| Compuesta mensual | 11.616,17 € |
| Continua | 11.618,34 € |

Con la operación [Depósito a plazo fijo](#op=deposito-plazo), 20.000 € al 2,50 % TIN:

| Caso | Resultado |
| --- | --- |
| 180 días, pago al vencimiento (Act/365): intereses brutos | 246,58 € |
| Idem: intereses netos (retención 19 %) | 199,73 € |
| Idem: TAE | 2,5158 % |
| 12 meses, liquidación mensual: intereses de cada mes | 41,67 € |
| Idem: TAE | 2,5288 % |

Verificado con LibreOffice Calc (`VF`, `EXP`, `INT.EFECTIVO`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| El depósito tiene rentabilidad conocida y garantía del FGD | Rentabilidad real baja o negativa si la inflación supera el TIN |
| La capitalización compuesta premia el largo plazo | Cancelar antes del vencimiento suele tener penalización |

## Riesgos
- Comparar el TIN de un depósito con la TAE de otro.
- Olvidar la inflación: ver [Tipo de interés real (Fisher)](#op=tipo-real).
- Superar el límite del FGD en una misma entidad.

## Operaciones relacionadas
- [Interés simple, compuesto y continuo](#op=capitalizacion)
- [Depósito a plazo fijo](#op=deposito-plazo)
- [Conversor TIN ↔ TAE](#op=tin-tae)

## Fuentes
- Banco de España — Portal del Cliente Bancario: depósitos a plazo, TIN y TAE.
- Circular 5/2012 del Banco de España, sobre transparencia (cálculo de la TAE).
- Fondo de Garantía de Depósitos de Entidades de Crédito: cobertura de 100.000 € por titular y entidad.
