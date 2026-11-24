---
titulo: "Mercado de divisas: cotizaciones, horquilla, tipos cruzados y fechas valor"
idioma: es
traduccion: ""
categoria: fx
etiquetas: [forex, cotizacion, bid-ask, tipo-cruzado, spot, tom-next, swap, riesgo-de-cambio]
operaciones: []
patrones: [P-007, P-008]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["BIS — Triennial Central Bank Survey (volumen del mercado de divisas)", "BCE — tipos de cambio de referencia del euro", "Hull, J. C. — Options, Futures and Other Derivatives"]
---

# Mercado de divisas: cotizaciones, horquilla, tipos cruzados y fechas valor

## Qué es
El mercado donde se intercambian monedas. Es descentralizado (OTC): no tiene una sede
física y funciona las 24 horas en días laborables a través de bancos, plataformas
electrónicas y bancos centrales. Es el mercado financiero con más volumen del mundo.

## Para qué se usa
- Pagar y cobrar operaciones de comercio exterior.
- Invertir o financiarse en otra moneda.
- Cubrir el **riesgo de cambio** (seguros de cambio, swaps) o especular.

## Cómo funciona
**Cotización.** Un par `BASE/COTIZADA` indica cuántas unidades de la divisa cotizada vale
1 unidad de la base: EUR/USD = 1,0850 son 1,0850 USD por euro. Desde España:
- *Indirecta* (la del BCE y la del mercado para el euro): divisa extranjera por 1 EUR.
- *Directa*: euros por 1 unidad de divisa extranjera (es la inversa, 1/1,0850).

Si EUR/USD **sube**, el euro se aprecia: al importador le cuesta menos cada dólar y el
exportador recibe menos euros por cada dólar.

**Horquilla (bid/ask).** Quien cotiza da dos precios sobre la divisa **base**:
- *Bid*: precio al que **compra** la base. *Ask (offer)*: precio al que la **vende**.
- Ask > bid siempre; la diferencia (*spread*) es su margen. El precio medio es la media.
- ⚠️ Ojo con los nombres en banca: con cotización indirecta, el "cambio comprador" de la
  divisa extranjera (el banco compra dólares) es el número **más alto** (1,0852 en vez de
  1,0850), porque el banco entrega menos euros por cada dólar. Por eso conviene pensar
  siempre "¿cuántos euros recibo o pago?" y no fiarse solo de la palabra.

**Tipo cruzado.** El mercado cotiza casi todo contra el dólar; dos divisas entre sí se
obtienen combinando sus cotizaciones con el dólar, multiplicando o dividiendo según el
sentido de cada par para que el USD se cancele:
- EUR/CHF = EUR/USD × USD/CHF (USD en el denominador de uno y numerador del otro).
- EUR/GBP = EUR/USD ÷ GBP/USD (el USD está "arriba" en ambos: se divide).

**Fechas valor.**

| Operación | Liquidación |
| --- | --- |
| *Today* (valor hoy) | T+0 |
| *Tom* (valor mañana) | T+1 |
| **Spot** (contado) | **T+2** días hábiles (USD/CAD: T+1) |
| **Forward outright** | Cualquier fecha posterior al spot |

Si es festivo en alguno de los dos países (o en EE. UU. para pares con USD), se pasa al
siguiente día hábil común. Valor hoy o mañana tiene un precio distinto del spot: se ajusta
por los puntos de esos días.

**Forward outright y FX swap.** El *outright* es una única compraventa a plazo. Un *FX swap*
son dos patas opuestas: una compra (o venta) en una fecha y la operación contraria en otra;
*tom-next* es un swap de T+1 a T+2. Los **puntos swap** son la diferencia forward − spot en
unidades del 4.º decimal (*pips*; 2.º decimal en pares con JPY), **no** un porcentaje.

**Tamaño.** La encuesta trienal del BIS de 2022 situó el volumen en unos 7,5 billones de
dólares diarios (en inglés, *7.5 trillion*: en español "billón" = 10¹²). Londres concentra la
mayor parte, seguido de Nueva York. ⚠️ Pendiente de verificar la cifra de la encuesta de
2025, que apunta a un volumen mayor.

## Fórmulas
$$
\text{Directa} = \frac{1}{\text{Indirecta}} \qquad \text{Medio} = \frac{\text{bid} + \text{ask}}{2} \qquad \text{Spread (pips)} = (\text{ask} - \text{bid}) \cdot 10^4
$$

$$
\frac{CHF}{EUR} = \frac{USD}{EUR} \cdot \frac{CHF}{USD} \qquad \frac{GBP}{EUR} = \frac{USD/EUR}{USD/GBP}
$$

Las fracciones están escritas en unidades: $USD/EUR$ son dólares por euro (el par EUR/USD).
Si las unidades se simplifican hasta dejar la divisa buscada por euro, la operación es correcta.

## Ejemplo resuelto
Cotizaciones inventadas: EUR/USD 1,0850/1,0852; USD/CHF 0,8800; USD/JPY 150,00; GBP/USD
1,2700. Resultados calculados con LibreOffice Calc (referencias `bidask_*` y `cruce_*`):

| Caso | Resultado |
| --- | --- |
| Precio medio EUR/USD | 1,0851 |
| Cliente vende 100.000 USD (el banco le vende EUR al ask 1,0852) | 92.148,91 EUR |
| Cliente vende 100.000 EUR (el banco le compra EUR al bid 1,0850) | 108.500,00 USD |
| Cruzado EUR/CHF = 1,0850 × 0,8800 | 0,9548 |
| Cruzado EUR/JPY = 1,0850 × 150,00 | 162,75 |
| Cruzado EUR/GBP = 1,0850 ÷ 1,2700 | 0,854331 |

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Liquidez muy alta en los pares principales | Pares exóticos con horquillas amplias |
| Opera casi 24 horas | Muy sensible a noticias y a la política monetaria |
| Precios transparentes entre bancos | El cliente final paga un margen sobre el precio interbancario |

## Riesgos
- **Riesgo de cambio** en exportaciones, importaciones, préstamos e inversiones en divisa:
  se reduce si los cobros y pagos están en la misma moneda (cobertura natural) o con
  forwards, swaps u opciones.
- **Riesgo de liquidación**: que una de las dos patas no se entregue (CLS lo mitiga).
- **Restricciones de convertibilidad**: el CNY (China continental) está controlado; el CNH
  (offshore) cotiza libre y puede diferir.

## Operaciones relacionadas
- [Seguro de cambio (forward)](#op=fx-forward)
- [Conversión con el tipo de referencia del BCE](#op=fx-conversion-bce)

## Fuentes
- BIS — *Triennial Central Bank Survey* de divisas y derivados OTC (volúmenes por divisa y plaza).
- BCE — información pública sobre los tipos de cambio de referencia del euro.
- Hull, J. C. — *Options, Futures and Other Derivatives*: mercado de divisas y forwards.
