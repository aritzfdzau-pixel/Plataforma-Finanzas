# Catálogo de patrones

Un **patrón** es un bloque de cálculo reutilizable (p. ej. "descuento de flujos",
"cuadro de amortización", "conversión de tipos entre periodicidades") implementado como
función pura en `operativa/lib/` y cubierto por tests con valores de referencia.

Antes de crear o cambiar una operación, consulta esta tabla. Cambiar un patrón exige que
pasen los tests de todas las operaciones que lo usan.

| ID | Nombre | Función(es) | Tests | Usado por | Estado |
| --- | --- | --- | --- | --- | --- |
| — | *(vacío: el catálogo inicial se crea en la fase 1)* | | | | |

## Cómo registrar un patrón
1. Implementa la función pura en `operativa/lib/` (sin efectos secundarios, sin DOM).
2. Añade tests en `operativa/tests/` con valores de referencia y su fuente.
3. Añade una fila a la tabla: ID (`P-NNN`), nombre, funciones, archivo de tests,
   operaciones que lo usan y estado.
