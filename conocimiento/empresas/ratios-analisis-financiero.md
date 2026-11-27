---
titulo: "Análisis de estados financieros: ratios de una empresa"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [ratios, ebitda, deuda-financiera-neta, dscr, liquidez, rentabilidad, solvencia, riesgo-de-credito]
operaciones: [analisis-estados-financieros]
patrones: [P-018, P-019, P-026]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-27
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
  (*Net debt/EBITDA*, en "veces"), deuda financiera/EBITDA (bruta), endeudamiento
  (pasivo / patrimonio neto), solvencia (activo / pasivo) y autonomía financiera.
- **Liquidez:** liquidez (*current ratio*, AC / PC), tesorería (*cash ratio*,
  (disponible + inversiones a corto) / PC), fondo de maniobra (*working capital*) y tesorería neta.
- **Riesgo de crédito:** DSCR (*debt service coverage ratio*) y cobertura de intereses
  (*interest coverage*).
- **Rentabilidad:** ROE y ROA.

**Rango recomendado y valoración** (con icono y texto, nunca solo color) en cada ratio. Son
**referencias generales de manuales de análisis**, dependen del sector y del tamaño, y **no son
criterios de ningún banco** (⚠️ Pendiente de verificar; conviene contrastarlos con las medias del
sector, p. ej. la Central de Balances del Banco de España):

| Ratio | Rango recomendado |
| --- | --- |
| Liquidez (AC / PC) | 1,5 – 2,0 (por encima de 2, posible activo ocioso) |
| Tesorería ((disponible + inversiones a corto) / PC) | 0,1 – 0,3 |
| Endeudamiento (pasivo / PN) | 0,7 – 1,5 |
| Solvencia (activo / pasivo) | ≥ 1,5 |
| Deuda financiera / EBITDA | < 3,5x |
| DFN / EBITDA | < 3x (3x–5x vigilancia; ≥ 5x elevado) |
| Autonomía financiera (PN / activo) | ≥ 30 % |
| DSCR | ≥ 1,20x (< 1,00x no cubre) |
| Cobertura de intereses | ≥ 3x |
| ROA | ≥ 5 % |
| ROE | ≥ 8 % (por encima del coste del capital) |
| Margen neto / margen EBITDA | ≥ 5 % / ≥ 10 % (según sector) |
| EBITDA, fondo de maniobra | > 0 |
| Tesorería neta | ≥ 0 |

**Comparación entre años:** con el año anterior, cada ratio muestra los dos valores, la
evolución (en puntos porcentuales para los porcentajes) con ▲▼ y un comentario: mejora o empeora
según el sentido del ratio (en endeudamiento y deuda/EBITDA, bajar es mejorar) y su valoración.
**Informe:** resume la valoración global (ratios dentro, en vigilancia y fuera de rango),
puntos fuertes y débiles, la evolución y una conclusión; se descarga en Markdown o se imprime
(también como PDF). Se genera en el navegador.

**Semáforo principal** (resumen de la operación). Los umbrales son
**referencias generales de mercado, no criterios de ningún banco**, y cambian por sector:
- DFN/EBITDA: < 3x cómodo; de 3x a 5x zona de vigilancia; ≥ 5x elevado. Con EBITDA ≤ 0 el ratio
  **no es significativo** y no se calcula. Con DFN < 0 la empresa tiene **caja neta positiva**.
- DSCR: ≥ 1,20x aceptable; < 1,00x no cubre el servicio de la deuda; entre medias, ajustado.

⚠️ Pendiente de verificar: variantes habituales de las definiciones.
- **Autonomía financiera:** aquí, patrimonio neto / activo total. También se calcula como
  patrimonio neto / pasivo exigible.
- **Pasivo:** se toma como pasivo exigible = activo total − patrimonio neto. El patrimonio neto
  incluye los fondos propios, los ajustes por cambios de valor y las subvenciones.
- **Tesorería:** aquí, (disponible + inversiones financieras a corto) / PC. Otros manuales
  llaman así a la prueba ácida ((AC − existencias) / PC), con un rango cercano a 1.
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
\text{Tesorería} = \frac{\text{Disponible} + \text{Inv. CP}}{PC}, \qquad \text{Endeudamiento} = \frac{P}{PN}, \qquad \text{Solvencia} = \frac{A}{P}, \qquad \frac{D_{CP} + D_{LP}}{EBITDA}
$$

$$
ROE = \frac{BN}{PN}, \qquad ROA = \frac{BN}{\text{Activo total}}, \qquad g_{ventas} = \frac{V_t - V_{t-1}}{V_{t-1}}
$$

Donde: $D_{CP}$, $D_{LP}$ = deuda financiera a corto y largo plazo; $AC$, $PC$ = activo y
pasivo corriente; $BN$ = beneficio neto; $PN$ = patrimonio neto; $A$ = activo total;
$P = A - PN$ = pasivo exigible.

## Ejemplo resuelto
Empresa ficticia "Talleres del Norte, S.L." (importes inventados): ventas 2.000.000 €, EBIT
180.000 €, amortizaciones 70.000 €, gastos financieros 40.000 €, beneficio neto 100.000 €,
deuda a corto 150.000 € y a largo 650.000 €, caja 120.000 €, inversiones financieras a corto
30.000 €, patrimonio neto 900.000 €, activo
2.400.000 €, activo corriente 1.000.000 €, pasivo corriente 700.000 €, CFADS 260.000 € y cuotas
del año 200.000 €. Con la operación [Análisis de estados financieros](#op=analisis-estados-financieros):

| Bloque | Ratio | Resultado |
| --- | --- | --- |
| Análisis financiero | EBITDA / margen EBITDA / margen neto | 250.000,00 € / 12,50 % / 5,00 % |
| Solvencia | DFN / DFN/EBITDA | 680.000,00 € / 2,72x (cómodo) |
| Solvencia | Deuda financiera/EBITDA | 3,20x (dentro del rango) |
| Solvencia | Endeudamiento / solvencia | 1,67x (vigilancia) / 1,60x (dentro del rango) |
| Solvencia | Autonomía financiera | 37,50 % |
| Liquidez | Liquidez / tesorería | 1,43x (vigilancia) / 0,21x (dentro del rango) |
| Liquidez | Fondo de maniobra / tesorería neta | 300.000,00 € / −30.000,00 € |
| Riesgo de crédito | DSCR / cobertura de intereses | 1,30x (aceptable) / 6,25x |
| Rentabilidad | ROE / ROA | 11,11 % / 4,17 % |

El informe resume: 12 de 16 ratios dentro del rango recomendado, 4 en zona de vigilancia
(endeudamiento, liquidez, tesorería neta y ROA) y 0 fuera; conclusión: «situación financiera
aceptable, con puntos que conviene vigilar».

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
