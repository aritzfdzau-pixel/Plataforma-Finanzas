---
titulo: "Seguro de cambio (forward de divisas)"
idioma: es
traduccion: ""
categoria: fx
etiquetas: [forward, cobertura, paridad-de-tipos, puntos-swap, estr]
operaciones: [fx-forward]
patrones: [P-001, P-002, P-007]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Hull, J. C. — Options, Futures and Other Derivatives (capítulo de forwards)", "BCE — página informativa del €STR"]
---

# Seguro de cambio (forward de divisas)

## Qué es
Un contrato por el que se fija **hoy** el tipo de cambio al que se comprará o venderá una
divisa en una **fecha futura**. Elimina la incertidumbre del tipo de cambio para ese importe
y esa fecha.

## Para qué se usa
- Una empresa exportadora que cobrará dólares dentro de 90 días fija hoy cuántos euros recibirá.
- Una importadora que pagará en libras asegura el coste en euros de su compra.
- Presupuestar márgenes sin depender del mercado de divisas.

## Cómo funciona
El tipo a plazo **no es una previsión** del tipo futuro: se deduce por **arbitraje**. Si se
invierte un euro al tipo del euro o se cambia a la divisa, se invierte al tipo de la divisa y
se vuelve a cambiar a plazo, ambos caminos deben dar lo mismo (paridad cubierta).

- Cotización indirecta del euro: **unidades de divisa por 1 EUR** (EUR/USD = 1,0850 significa
  1,0850 USD por euro).
- Interés **simple** al plazo, con la base de cada divisa: EUR y USD en Act/360; GBP y JPY
  habitualmente en Act/365 (⚠️ Pendiente de verificar la convención de cada índice).
- Como referencia del euro se usa el **€STR**. Es un tipo a un día: para un plazo hay que usar
  un tipo a ese plazo (€STR compuesto u OIS).
- Si la divisa tiene un tipo **mayor** que el euro, el forward EUR/divisa queda **por encima**
  del spot (el euro cotiza con prima); si es menor, por debajo (descuento).
- El precio de un banco incluye además su **margen**: aquí se calcula el precio teórico.
- Es un contrato **firme**: se liquida aunque la operación comercial no llegue a producirse.
  Un *outright* es una sola compraventa a plazo; un *FX swap* combina una operación al contado
  y la contraria a plazo (ver la ficha [Mercado de divisas](#ficha=conocimiento%2Ffx%2Fmercado-de-divisas.md)).
- Los **puntos swap** se expresan en *pips* (cuarto decimal), no en porcentaje.

## Fórmulas
$$
F = S \cdot \frac{1 + r_{div} \cdot \frac{d}{B_{div}}}{1 + r_{EUR} \cdot \frac{d}{B_{EUR}}}
$$

$$
\text{Puntos swap} = (F - S) \cdot 10^4 \quad (10^2 \text{ para el JPY})
$$

Donde: $S$ = spot; $F$ = forward; $r$ = tipos nominales anuales; $d$ = días del plazo;
$B$ = base de cada divisa (360 o 365).

## Ejemplo resuelto
Empresa ficticia que cobrará 100.000 EUR equivalentes en dólares a 90 días. Spot EUR/USD
1,0850; tipo del euro 3,00 % (Act/360); tipo del dólar 4,50 % (Act/360). Calculado con la
operación [Seguro de cambio (forward)](#op=fx-forward):

| Concepto | Resultado |
| --- | --- |
| Forward EUR/USD a 90 días | 1,089038 |
| Puntos swap | 40,38 |
| Contravalor a plazo de 100.000 EUR | 108.903,85 USD |

Con EUR/GBP: spot 0,8500, libra al 4,75 % (Act/365), 180 días → forward 0,857055.
Valores verificados con LibreOffice Calc (tests `fx-forward`).

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Certeza sobre el tipo de cambio | Se renuncia a una evolución favorable de la divisa |
| Sin prima inicial | Obliga a liquidar aunque la operación comercial no se produzca |
| Adaptable en importe y fecha | Requiere línea de riesgo con el banco |

## Riesgos
- **Riesgo de contrapartida:** que la otra parte no cumpla.
- **Riesgo de la operación subyacente:** si el cobro no llega, el forward sigue vivo.
- **Coste de oportunidad** si el tipo de cambio se mueve a favor.

## Operaciones relacionadas
- [Seguro de cambio (forward)](#op=fx-forward)
- [Conversión con el tipo de referencia del BCE](#op=fx-conversion-bce)

## Fuentes
- Hull, J. C. — *Options, Futures and Other Derivatives*: paridad cubierta de tipos de interés.
- BCE — información pública sobre el €STR (tipo a un día del euro).
