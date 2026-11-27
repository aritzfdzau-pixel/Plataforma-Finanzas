---
titulo: "Saldo medio y liquidación de intereses de una cuenta"
idioma: es
traduccion: ""
categoria: tipos-interes
etiquetas: [saldo-medio, numeros-comerciales, metodo-hamburgues, cuenta-corriente, descubierto, fecha-valor]
operaciones: [saldos-medios]
patrones: [P-001, P-027]
fecha_creacion: 2026-11-27
ultima_revision: 2026-11-27
fuentes: ["Banco de España — Portal del Cliente Bancario (cuentas a la vista, fecha valor y descubiertos)", "Ley 16/2011, de contratos de crédito al consumo (límite de la TAE en descubiertos)", "Manuales de matemática financiera: método hamburgués (números comerciales)"]
---

# Saldo medio y liquidación de intereses de una cuenta

## Qué es
- **Saldo medio:** el saldo que, mantenido constante todos los días del periodo, daría los mismos
  números comerciales que el saldo real. Es la media de los saldos diarios ponderada por días.
- **Números comerciales:** saldo × días que se mantiene ese saldo. Los positivos son
  **acreedores** (a favor del cliente) y los negativos, **deudores** (descubierto).
- **Método hamburgués:** se ordenan los movimientos por **fecha valor**, se calcula el saldo de
  cada tramo y sus números, y al final se liquidan los intereses.

## Para qué se usa
- Liquidar intereses de cuentas corrientes, cuentas remuneradas y cuentas de crédito.
- Comprobar condiciones ligadas al saldo medio (remuneración por tramos, exención de comisiones).
- Calcular el saldo medio dispuesto de una póliza de crédito (ver [Póliza de crédito](#ficha=conocimiento%2Fempresas%2Fpoliza-de-credito.md)).

## Cómo funciona
- El periodo va del día de inicio al de fin, **ambos incluidos** (días naturales).
- Cada movimiento cambia el saldo **desde su fecha valor incluida**; la fecha de operación no cuenta.
- Intereses acreedores = números acreedores × tipo acreedor / base; los deudores, igual con el tipo deudor.
- Base de cálculo: **Act/365** es lo habitual en cuentas de clientes en España; Act/360 en algunas cuentas de empresa.
- Sobre los intereses acreedores se practica la **retención** a cuenta del IRPF (19 % en el ejemplo;
  comprueba el tipo vigente).
- Los descubiertos pueden llevar además una **comisión de descubierto**; no está incluida.

## Fórmulas
$$
\text{Números}_k = S_k \cdot d_k, \qquad \bar S = \frac{\sum_k S_k \, d_k}{D}
$$

$$
I_{acr} = \frac{\sum_{S_k>0} S_k d_k \cdot r_{acr}}{B}, \qquad I_{deu} = \frac{\sum_{S_k<0} |S_k| d_k \cdot r_{deu}}{B}
$$

Donde: $S_k$ = saldo del tramo $k$; $d_k$ = días del tramo; $D$ = días del periodo; $B$ = 365 o 360.

## Ejemplo resuelto
Con la operación [Saldo medio y liquidación de una cuenta](#op=saldos-medios), cuenta inventada
del 01/01/2026 al 31/03/2026 (90 días), saldo inicial 5.000 €; abono de 3.000 € el 15/01,
cargo de 9.000 € el 10/02 y abono de 4.000 € el 01/03. Tipo acreedor 1 %, deudor 7 %, Act/365,
retención 19 %:

| Tramo | Días | Saldo | Números |
| --- | --- | --- | --- |
| 01/01 – 14/01 | 14 | 5.000,00 € | 70.000 |
| 15/01 – 09/02 | 26 | 8.000,00 € | 208.000 |
| 10/02 – 28/02 | 19 | −1.000,00 € | −19.000 |
| 01/03 – 31/03 | 31 | 3.000,00 € | 93.000 |

| Resultado | Valor |
| --- | --- |
| Saldo medio diario | 3.911,11 € |
| Números acreedores / deudores | 371.000 / 19.000 |
| Intereses acreedores brutos | 10,16 € |
| Retención (19 %) | −1,93 € |
| Intereses deudores | −3,64 € |
| Liquidación neta | 4,59 € |

Verificado con LibreOffice Calc (días con `FECHA`, números y saldo medio en `referencias.fods`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Un solo número resume la posición de todo el periodo | Oculta los picos: un descubierto corto apenas mueve el saldo medio |
| Liquida a la vez saldos a favor y en contra | Depende de las fechas valor que aplique la entidad |

## Riesgos
- Confundir la fecha de operación con la fecha valor (cambia los días de cada tramo).
- Olvidar la comisión de descubierto, que suele pesar más que los intereses deudores.
- Pegar movimientos reales de clientes: la herramienta es de estudio y no debe usarse con datos de terceros.

## Operaciones relacionadas
- [Saldo medio y liquidación de una cuenta](#op=saldos-medios)
- [Póliza de crédito](#op=poliza-credito)

## Fuentes
- Banco de España — Portal del Cliente Bancario: cuentas a la vista, fecha valor y descubiertos.
- Ley 16/2011, de contratos de crédito al consumo: límite de la TAE en los descubiertos tácitos.
- Manuales de matemática financiera: método hamburgués y números comerciales.
