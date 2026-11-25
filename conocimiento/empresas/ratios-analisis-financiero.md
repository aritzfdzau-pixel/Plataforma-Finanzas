---
titulo: "Análisis de estados financieros: ratios de una empresa"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [ratios, ebitda, deuda-financiera-neta, dscr, liquidez, rentabilidad, solvencia, riesgo-de-credito]
operaciones: [analisis-estados-financieros]
patrones: [P-018, P-019]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de análisis de estados financieros", "Plan General de Contabilidad (estructura del balance y de la cuenta de pérdidas y ganancias)"]
---

# Análisis de estados financieros: ratios de una empresa

## Qué es
Un conjunto de cocientes sobre las cuentas anuales que resume en pocas cifras cómo gana dinero
una empresa, cuánto debe, si puede pagar a corto plazo y si su caja cubre la deuda. Sirve para
comparar una empresa con su propio pasado y con su sector.

## Para qué se usa
- Primera lectura de unas cuentas anuales antes de estudiar una operación de financiación.
- Seguir la evolución de un año a otro (márgenes, endeudamiento, liquidez).
- Detectar señales de alerta: deuda alta frente al EBITDA, caja que no cubre las cuotas.

## Cómo funciona
Se agrupan en cinco bloques. Todos los importes, del mismo ejercicio y en la misma unidad
(EUR o miles de EUR); saldos de cierre del balance.
- **Análisis financiero:** EBITDA, margen EBITDA (*EBITDA margin*), margen neto y crecimiento
  de ventas si se introduce el año anterior.
- **Solvencia y endeudamiento:** deuda financiera neta (DFN, *net debt*), DFN/EBITDA
  (*Net debt/EBITDA*, en "veces") y autonomía financiera.
- **Liquidez:** fondo de maniobra (*working capital*), ratio de liquidez (*current ratio*) y
  tesorería neta.
- **Riesgo de crédito:** DSCR (*debt service coverage ratio*) y cobertura de intereses
  (*interest coverage*).
- **Rentabilidad:** ROE y ROA.

**Semáforo orientativo** (con icono y texto, nunca solo color). Los umbrales son
**referencias generales de mercado, no criterios de ningún banco**, y cambian por sector:
- DFN/EBITDA: < 3x cómodo; de 3x a 5x zona de vigilancia; ≥ 5x elevado. Con EBITDA ≤ 0 el ratio
  **no es significativo** y no se calcula. Con DFN < 0 la empresa tiene **caja neta positiva**.
- DSCR: ≥ 1,20x aceptable; < 1,00x no cubre el servicio de la deuda; entre medias, ajustado.

⚠️ Pendiente de verificar: variantes habituales de las definiciones.
- **Autonomía financiera:** aquí, fondos propios / activo total. También se calcula como fondos
  propios / pasivo exigible.
- **EBITDA:** aquí, EBIT + amortizaciones. A veces se suman deterioros y resultados no
  recurrentes.
- **DSCR:** el flujo disponible para el servicio de la deuda (CFADS) puede ser, por ejemplo,
  EBITDA − impuestos − inversiones ± variación del circulante, o la definición que fije cada
  contrato.

## Fórmulas
$$
EBITDA = EBIT + \text{Amortizaciones}, \qquad DFN = D_{CP} + D_{LP} - \text{Caja}
$$

$$
\frac{DFN}{EBITDA}, \qquad DSCR = \frac{CFADS}{\text{Principal} + \text{Intereses del año}}, \qquad \text{Cobertura} = \frac{EBITDA}{\text{Gastos financieros}}
$$

$$
FM = AC - PC, \qquad \text{Liquidez} = \frac{AC}{PC}, \qquad \text{Tesorería neta} = \text{Caja} - D_{CP}
$$

$$
ROE = \frac{BN}{FP}, \qquad ROA = \frac{BN}{\text{Activo total}}, \qquad g_{ventas} = \frac{V_t - V_{t-1}}{V_{t-1}}
$$

Donde: $D_{CP}$, $D_{LP}$ = deuda financiera a corto y largo plazo; $AC$, $PC$ = activo y
pasivo corriente; $BN$ = beneficio neto; $FP$ = fondos propios.

## Ejemplo resuelto
Empresa ficticia "Talleres del Norte, S.L." (importes inventados): ventas 2.000.000 €, EBIT
180.000 €, amortizaciones 70.000 €, gastos financieros 40.000 €, beneficio neto 100.000 €,
deuda a corto 150.000 € y a largo 650.000 €, caja 120.000 €, fondos propios 900.000 €, activo
2.400.000 €, activo corriente 1.000.000 €, pasivo corriente 700.000 €, CFADS 260.000 € y cuotas
del año 200.000 €. Con la operación [Análisis de estados financieros](#op=analisis-estados-financieros):

| Bloque | Ratio | Resultado |
| --- | --- | --- |
| Análisis financiero | EBITDA / margen EBITDA / margen neto | 250.000,00 € / 12,50 % / 5,00 % |
| Solvencia | DFN / DFN/EBITDA | 680.000,00 € / 2,72x (cómodo) |
| Solvencia | Autonomía financiera | 37,50 % |
| Liquidez | Fondo de maniobra / liquidez / tesorería neta | 300.000,00 € / 1,43x / −30.000,00 € |
| Riesgo de crédito | DSCR / cobertura de intereses | 1,30x (aceptable) / 6,25x |
| Rentabilidad | ROE / ROA | 11,11 % / 4,17 % |

Si la deuda a largo fuera de 1.200.000 € y el CFADS de 210.000 €, DFN/EBITDA pasaría a 4,92x
(zona de vigilancia) y el DSCR a 1,05x (ajustado). Verificado con LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Resumen rápido y comparable entre años y empresas | Mira al pasado: las cuentas pueden tener meses de antigüedad |
| Detecta desequilibrios entre deuda, caja y resultados | Las definiciones varían (EBITDA, CFADS) y cambian el resultado |
| Fácil de explicar en un comité | Los umbrales dependen del sector y del ciclo |

## Riesgos
- Comparar ratios calculados con definiciones distintas.
- Fiarse de un solo año: un buen ejercicio puntual o un cierre "maquillado" (saldos de cierre).
- Leer el semáforo como una decisión: es orientativo, no un criterio de riesgo.

## Operaciones relacionadas
- [Análisis de estados financieros (ratios)](#op=analisis-estados-financieros)
- [Circulante: periodos medios y NOF](#op=circulante-nof)

## Fuentes
- Manuales generales de análisis de estados financieros (ratios de liquidez, solvencia y rentabilidad).
- Plan General de Contabilidad: estructura de las cuentas anuales.
