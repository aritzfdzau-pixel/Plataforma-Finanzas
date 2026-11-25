---
titulo: "Circulante: periodos medios, ciclo de caja y NOF"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [circulante, working-capital, nof, fondo-de-maniobra, periodo-medio-de-cobro, ciclo-de-caja]
operaciones: [circulante-nof]
patrones: [P-020]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de dirección financiera (gestión del circulante)"]
---

# Circulante: periodos medios, ciclo de caja y NOF

## Qué es
- **Periodos medios:** días que tarda la empresa en cobrar a sus clientes (PMC), en pagar a sus
  proveedores (PMP) y en vender sus existencias (PMA).
- **Ciclo de caja** (*cash conversion cycle*): días que la empresa tiene que financiar entre que
  paga a proveedores y cobra a clientes.
- **NOF** (necesidades operativas de fondos): dinero invertido en el circulante de la actividad.

El periodo medio de cobro también se llama **PMR** (periodo medio de realización o de
recuperación): es el mismo concepto que el PMC.

## Para qué se usa
- Saber cuánta financiación a corto necesita la empresa y por qué.
- Ver el efecto de negociar plazos: cobrar antes, pagar después o rotar más el almacén.
- Comparar las NOF con el **fondo de maniobra** (la parte del circulante financiada a largo).

## Cómo funciona
- Se usan **saldos medios** del periodo (mejor que los de cierre, que dependen de la estacionalidad).
- Los saldos de clientes y proveedores del balance suelen **incluir IVA**; ventas y compras de la
  cuenta de resultados, no. Para comparar, se divide el saldo entre (1 + IVA). Las existencias
  no llevan IVA. ⚠️ Pendiente de verificar: supone un único tipo de IVA para todas las ventas y
  compras (exportaciones y operaciones exentas no lo llevan).
- Las NOF se calculan con los saldos tal cual (son el dinero real invertido).
- **FM − NOF ≥ 0:** el fondo de maniobra cubre las NOF (exceso de financiación del circulante).
  **FM − NOF < 0:** déficit que se cubre con deuda a corto (pólizas, descuento, factoring, confirming).

## Fórmulas
$$
PMC = \frac{\text{Clientes}/(1+IVA)}{\text{Ventas}} \cdot d, \quad PMP = \frac{\text{Proveedores}/(1+IVA)}{\text{Compras}} \cdot d, \quad PMA = \frac{\text{Existencias}}{\text{Coste de ventas}} \cdot d
$$

$$
\text{Ciclo de maduración} = PMA + PMC, \qquad \text{Ciclo de caja} = PMA + PMC - PMP
$$

$$
NOF = \text{Existencias} + \text{Clientes} + \text{Tesorería operativa} - \text{Proveedores} - \text{Otros acreedores operativos}
$$

Donde: $d$ = días del periodo (365 por defecto); IVA = 0 si los saldos no lo incluyen.

## Ejemplo resuelto
Empresa ficticia (importes inventados): ventas 2.400.000 €, compras 1.500.000 €, coste de
ventas 1.600.000 €, clientes 480.000 €, proveedores 300.000 € (ambos con IVA del 21 %),
existencias 250.000 € y fondo de maniobra 300.000 €. Con la operación
[Circulante: periodos medios y NOF](#op=circulante-nof):

| Resultado | Valor |
| --- | --- |
| PMC / PMP / PMA | 60,3 / 60,3 / 57,0 días |
| Ciclo de maduración / ciclo de caja | 117,4 / 57,0 días |
| NOF | 430.000,00 € |
| Fondo de maniobra − NOF | −130.000,00 € (déficit) |

Sin ajustar el IVA, el PMC saldría de 73,0 días: el ajuste importa. Verificado con LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Explica de dónde viene la necesidad de financiación a corto | Con saldos de cierre puede engañar (estacionalidad) |
| Permite simular el efecto de cambiar plazos | El ajuste de IVA es aproximado |

## Riesgos
- Financiar NOF permanentes con deuda a corto que hay que renovar cada año.
- Crecer en ventas sin prever el aumento de NOF (crecer consume caja).
- Confundir el PMP real con el plazo pactado: la ley de morosidad limita el plazo de pago.

## Operaciones relacionadas
- [Circulante: periodos medios y NOF](#op=circulante-nof)
- [Análisis de estados financieros (ratios)](#op=analisis-estados-financieros)

## Fuentes
- Manuales generales de dirección financiera: gestión del circulante, NOF y fondo de maniobra.
