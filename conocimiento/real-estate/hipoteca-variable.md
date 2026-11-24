---
titulo: "Hipoteca a tipo variable (Euribor + diferencial)"
idioma: es
traduccion: ""
categoria: real-estate
etiquetas: [hipoteca, euribor, diferencial, revision, vivienda]
operaciones: [hipoteca-variable]
patrones: [P-005]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Banco de España — Portal del Cliente Bancario (hipotecas y tipos de referencia oficiales)", "Ley 5/2019, reguladora de los contratos de crédito inmobiliario"]
---

# Hipoteca a tipo variable (Euribor + diferencial)

## Qué es
Un préstamo hipotecario cuyo tipo de interés se **revisa** periódicamente: TIN = índice de
referencia (normalmente el **Euribor a un año**) + un **diferencial** fijo.

## Para qué se usa
- Financiar la compra de vivienda o inmuebles.
- Entender cómo cambia la cuota cuando se mueve el Euribor.

## Cómo funciona
- Cuotas mensuales por sistema francés: tipo mensual = TIN / 12.
- En cada **revisión** (anual o semestral) se toma el nuevo índice y se recalcula la cuota con
  el **capital pendiente** y los **meses que faltan**.
- Índice oficial: la **media mensual del Euribor** que publica el Banco de España (el Euribor
  diario tiene licencia y no se usa aquí). En esta fase se introduce a mano.
- ⚠️ Pendiente de verificar: la Ley 5/2019 establece que el interés remuneratorio no puede ser
  negativo; por eso, por defecto, el TIN no baja de 0 %.
- No se incluyen comisiones ni seguros vinculados.

## Fórmulas
$$
TIN = \text{Euribor} + \text{diferencial}, \qquad \text{Cuota} = C \cdot \frac{i}{1-(1+i)^{-n}}, \quad i = \frac{TIN}{12}
$$

$$
C_k = C \cdot (1+i)^k - \text{Cuota} \cdot \frac{(1+i)^k - 1}{i}
$$

$$
\text{Nueva cuota} = C_k \cdot \frac{i'}{1-(1+i')^{-(n-k)}}
$$

Donde: $C$ = capital inicial; $n$ = meses totales; $k$ = mes de la revisión; $i'$ = nuevo tipo mensual.

## Ejemplo resuelto
Hipoteca inventada de 200.000 € a 25 años, Euribor 2,50 % + 0,90 %. En la revisión anual el
Euribor es 2,10 %. Con la operación [Hipoteca variable: cuota y revisión](#op=hipoteca-variable):

| Concepto | Resultado |
| --- | --- |
| Cuota inicial (TIN 3,40 %) | 990,55 € |
| Capital pendiente a los 12 meses | 194.833,34 € |
| Nueva cuota (TIN 3,00 %) | 949,83 € |
| Variación mensual | ▼ 40,72 € |

Verificado con LibreOffice Calc (`PAGO`, `VF`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Suele empezar con un tipo menor que la hipoteca fija | Cuota incierta: sube si sube el Euribor |
| Se beneficia de bajadas de tipos | Dificulta planificar a largo plazo |

## Riesgos
- **Riesgo de tipo de interés:** subidas del Euribor elevan la cuota.
- Sobreendeudamiento si se calcula la capacidad de pago con un Euribor bajo.
- Comisiones y productos vinculados que encarecen la operación.

## Operaciones relacionadas
- [Hipoteca variable: cuota y revisión](#op=hipoteca-variable)
- [Préstamo francés y alemán con carencia](#op=prestamo-frances-aleman)
- [Conversor TIN ↔ TAE](#op=tin-tae)

## Fuentes
- Banco de España — Portal del Cliente Bancario: hipotecas y tipos de referencia oficiales.
- Ley 5/2019, de 15 de marzo, reguladora de los contratos de crédito inmobiliario.
