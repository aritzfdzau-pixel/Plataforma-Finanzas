---
titulo: "Indicadores macroeconómicos: PIB, inflación, tipo real y M3"
idioma: es
traduccion: ""
categoria: macroeconomia
etiquetas: [pib, inflacion, ipc, ipca, deflactor, tipo-de-interes-real, fisher, m3, oferta-monetaria]
operaciones: []
patrones: []
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["INE — metodología del PIB trimestral y del IPC/IPCA", "Eurostat — IPCA (HICP)", "BCE — agregados monetarios de la zona euro"]
---

# Indicadores macroeconómicos: PIB, inflación, tipo real y M3

## Qué es
Las cifras con las que se lee el ciclo económico y que mueven los tipos de interés:
- **PIB (GDP)**: valor de los bienes y servicios finales producidos en un periodo.
- **Inflación**: variación del nivel general de precios, medida con el **IPC (CPI)** o el
  **IPCA (HICP)**, el índice armonizado que usa el BCE.
- **Deflactor del PIB**: índice de precios de todo lo producido, no solo de lo consumido.
- **Tipo de interés real**: el tipo nominal descontada la inflación.
- **M3**: agregado monetario amplio de la zona euro.

## Para qué se usa
- Entender las decisiones del BCE (ver [Tipos de referencia del euro](#ficha=conocimiento%2Fmacroeconomia%2Ftipos-de-referencia-del-euro.md)).
- Comparar rentabilidades y costes en términos reales (poder adquisitivo).
- Leer las noticias económicas que se etiquetarán en la fase 3.

## Cómo funciona
**PIB nominal y real.** El nominal se valora a precios corrientes; el real, a precios de un
año base (en España, el INE publica volúmenes encadenados). Crecer en nominal no implica crecer
en real: parte puede ser solo subida de precios. En España se publica trimestralmente
(avance, unos 30 días tras el trimestre) y se habla de **recesión técnica** con dos trimestres
seguidos de caída del PIB real (regla práctica, no definición oficial).

**Tres enfoques del PIB.** Gasto (C + I + G + X − M), producción (suma de valores añadidos) y
rentas (remuneración de asalariados + excedente de explotación + impuestos netos sobre la
producción). Los tres miden lo mismo.

**IPC frente a IPCA.** Ambos los publica el INE mensualmente (indicador adelantado a fin de
mes y dato definitivo a mediados del siguiente). El IPCA sigue una metodología común en la UE
para poder comparar países y es el que usa el BCE para su objetivo del **2 % simétrico a medio
plazo**. La **inflación subyacente** excluye energía y alimentos no elaborados (los más
volátiles).

**Deflactor frente a IPC.** El deflactor cubre todo el PIB (incluye inversión y exportaciones,
excluye importaciones); el IPC, una cesta fija de consumo (incluye bienes importados).

**Tipo real (ecuación de Fisher).** Lo que de verdad gana o paga quien presta o se endeuda.
Se usa ex ante con inflación esperada y ex post con la observada.

**Agregados monetarios (BCE).** M1 = efectivo + depósitos a la vista. M2 = M1 + depósitos a
plazo hasta 2 años + disponibles con preaviso hasta 3 meses. M3 = M2 + cesiones temporales,
participaciones en fondos del mercado monetario y valores de deuda hasta 2 años. El BCE ya
no fija un valor de referencia para M3: lo vigila dentro de su análisis monetario y financiero.

## Fórmulas
$$
\text{Deflactor} = \frac{\text{PIB nominal}}{\text{PIB real}} \times 100
$$

$$
\pi = \frac{IPC_t}{IPC_{t-12}} - 1 \qquad (\text{inflación interanual con índices mensuales})
$$

$$
r = \frac{1+i}{1+\pi} - 1 \;\approx\; i - \pi \qquad (\text{Fisher})
$$

$$
\text{Poder adquisitivo} = \frac{C}{(1+\pi)^n}
$$

Donde: $i$ = tipo nominal anual; $\pi$ = inflación anual; $r$ = tipo real; $C$ = importe;
$n$ = años. Todo en tasas anuales efectivas.

## Ejemplo resuelto
Datos inventados. Calculado con LibreOffice Calc (referencias `macro_deflactor`,
`macro_inflacion_ipc`, `macro_tipo_real` y `macro_poder_compra` en
`operativa/tests/referencias/referencias.fods`):

| Caso | Datos | Resultado |
| --- | --- | --- |
| Deflactor del PIB | PIB nominal 1.500; PIB real 1.400 | 107,14 |
| Inflación interanual | IPC 112,4 frente a 108,0 hace 12 meses | 4,07 % |
| Tipo real (exacto) | Depósito al 3,50 %; inflación 2,50 % | 0,98 % (aprox. 1,00 %) |
| Poder adquisitivo | 1.000 € tras 3 años con inflación del 3 % | 915,14 € |

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Datos oficiales, públicos y con calendario conocido | Se revisan: el primer dato del PIB puede cambiar |
| El IPCA permite comparar países de la UE | La cesta del IPC no es la de cada hogar |
| El tipo real evita la ilusión monetaria | La inflación esperada no se observa directamente |

## Riesgos
- Confundir tasa interanual con mensual, o variación en puntos con variación en %.
- Comparar PIB nominal de años distintos sin deflactar.
- Usar la aproximación $i - \pi$ con inflaciones altas: el error crece.

## Operaciones relacionadas
- [Hipoteca variable: cuota y revisión](#op=hipoteca-variable)
- [TIN y TAE](#op=tin-tae)

## Fuentes
- INE — metodología pública de la Contabilidad Nacional Trimestral y del IPC/IPCA.
- Eurostat — documentación pública del HICP.
- BCE — definiciones públicas de los agregados monetarios y estrategia de política monetaria (2021).
