# Catálogo de patrones

Un **patrón** es un bloque de cálculo reutilizable (p. ej. "descuento de flujos",
"cuadro de amortización", "conversión de tipos entre periodicidades") implementado como
función pura en `operativa/lib/` y cubierto por tests con valores de referencia.

Antes de crear o cambiar una operación, consulta esta tabla. Cambiar un patrón exige que
pasen los tests de todas las operaciones que lo usan.

| ID | Nombre | Función(es) | Tests | Usado por | Estado |
| --- | --- | --- | --- | --- | --- |
| P-001 | Fracción de año según base (Act/360, Act/365) | `fraccionAnio` | `operativa/tests/finanzas.test.js` | fx-forward, descuento-comercial | Estable |
| P-002 | Interés simple a corto plazo | `factorSimple`, `interesSimple` | `operativa/tests/finanzas.test.js` | fx-forward, descuento-comercial | Estable |
| P-003 | Conversión de tipos entre periodicidades (TIN ↔ TAE) | `tinATae`, `taeATin`, `periodicoAAnual` | `operativa/tests/finanzas.test.js` | tin-tae, prestamo-frances-aleman | Estable |
| P-004 | Descuento de flujos (VAN, TIR Newton-Raphson + bisección) | `van`, `tir`, `cambiosDeSigno` | `operativa/tests/finanzas.test.js` | van-tir, tin-tae | Estable |
| P-005 | Cuadro de amortización (francés / alemán, carencia) | `cuotaFrancesa`, `pendienteFrances`, `cuadroAmortizacion` | `operativa/tests/finanzas.test.js` | prestamo-frances-aleman, hipoteca-variable, tin-tae | Estable |
| P-006 | Rentabilidades, varianza y volatilidad | `rentabilidadesSimples`, `rentabilidadesLog`, `media`, `varianzaMuestral`, `desviacionMuestral`, `volatilidadAnualizada` | `operativa/tests/finanzas.test.js` | rentabilidad-volatilidad | Estable |
| P-007 | Paridad cubierta de tipos (forward) | `forwardParidad` | `operativa/tests/finanzas.test.js` | fx-forward | Estable |
| P-008 | Conversión con tipo de referencia y redondeo | `redondear`, `convertirConReferencia` | `operativa/tests/finanzas.test.js` | fx-conversion-bce | Estable |
| P-009 | Coste efectivo anual de un único flujo | `costeEfectivoAnual` | `operativa/tests/finanzas.test.js` | descuento-comercial | Estable |

Todas las funciones viven en `operativa/lib/finanzas.js`. Los tests comparan con valores
calculados por **LibreOffice Calc** (`operativa/tests/referencias/referencias.fods`, con las
fórmulas visibles; resultados en `referencias.json`). Cualquier hoja de cálculo (Google Sheets,
Excel) puede abrir el `.fods` para comprobarlos.

Las operaciones se definen en `operativa/operaciones/<id>.js` con: campos del formulario,
función `calcular` pura (sin DOM) y convenciones (base, periodicidad, nominal/efectivo,
comisiones). La interfaz genérica las pinta; no hay lógica financiera en la interfaz.

## Cómo registrar un patrón
1. Implementa la función pura en `operativa/lib/` (sin efectos secundarios, sin DOM).
2. Añade tests en `operativa/tests/` con valores de referencia y su fuente.
3. Añade una fila a la tabla: ID (`P-NNN`), nombre, funciones, archivo de tests,
   operaciones que lo usan y estado.
