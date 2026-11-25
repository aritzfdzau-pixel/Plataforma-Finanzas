---
titulo: "Deuda pública española: Letras, Bonos y Obligaciones, y la curva de tipos"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [renta-fija, letras-del-tesoro, bonos, obligaciones, curva-de-tipos, tesoro-publico]
operaciones: []
patrones: [P-001, P-002, P-004]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-25
fuentes: ["Tesoro Público — información pública sobre instrumentos y subastas", "Banco de España — mercado de deuda pública anotada"]
---

# Deuda pública española: Letras, Bonos y Obligaciones, y la curva de tipos

## Qué es
Los valores con los que se financia el Estado, emitidos por el Tesoro Público y representados
mediante anotaciones en cuenta:
- **Letras del Tesoro**: corto plazo (3, 6, 9 y 12 meses), **al descuento**: se compran por
  debajo de su nominal (1.000 €) y se cobra el nominal al vencimiento.
- **Bonos del Estado**: medio plazo (habitualmente 3 y 5 años), con cupón anual.
- **Obligaciones del Estado**: largo plazo (10, 15, 30 y 50 años), con cupón anual.

(Los antiguos "Pagarés del Tesoro" ya no se emiten.)

## Para qué se usa
- Inversión de bajo riesgo de crédito en euros y gestión de liquidez.
- Garantía (colateral) en repos y operaciones con el BCE.
- Su rentabilidad es la referencia "sin riesgo" de España: la **prima de riesgo** es la
  diferencia con el bono alemán al mismo plazo.

## Cómo funciona
- Emisión en **subastas** competitivas del Tesoro (mercado primario); después se negocian en
  el mercado secundario.
- **Precio y rentabilidad se mueven en sentido contrario**: si suben los tipos, baja el precio
  de los bonos ya emitidos (más cuanto más largo es el plazo).
- ⚠️ Pendiente de verificar: para Letras de hasta un año el Tesoro usa interés **simple** en
  base **Act/360**; para plazos mayores, capitalización compuesta en base Act/365.
- **Curva de tipos**: rentabilidad frente a plazo. Normalmente es **creciente** (se exige más
  por prestar a más plazo). Si se **invierte** (cortos por encima de largos), el mercado suele
  anticipar bajadas de tipos o una desaceleración; ha ocurrido en economías desarrolladas
  como EE. UU. en 2022–2024.

## Fórmulas
$$
P_{Letra} = \frac{N}{1 + r \cdot \frac{d}{360}} \qquad r = \left(\frac{N}{P} - 1\right) \cdot \frac{360}{d}
$$

$$
P_{Bono} = \sum_{t=1}^{n} \frac{C}{(1+y)^t} + \frac{N}{(1+y)^n} \qquad (y = \text{TIR del bono})
$$

Donde: $N$ = nominal; $d$ = días hasta el vencimiento; $C$ = cupón; $y$ = rentabilidad anual.

## Ejemplo resuelto
Letras inventadas de 1.000 € de nominal. Calculado con LibreOffice Calc (referencias
`letra_precio` y `letra_precio_6m`):

| Letra | Tipo | Precio |
| --- | --- | --- |
| 364 días | 2,50 % | 975,35 € |
| 182 días | 2,25 % | 988,75 € |

La TIR de un bono con cupones se obtiene con la operación [VAN y TIR](#op=van-tir):
flujos −precio, cupones y, el último año, cupón + nominal.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Riesgo de crédito bajo y mercado líquido | Rentabilidad menor que la de activos con más riesgo |
| Letras: sencillas, sin cupones intermedios | Bonos largos: muy sensibles a los tipos de interés |
| Se pueden comprar directamente al Tesoro | Venderlos antes del vencimiento puede dar pérdidas |

## Riesgos
- **Riesgo de tipo de interés** (precio): mayor cuanto más largo es el plazo.
- **Riesgo de reinversión** de los cupones a tipos más bajos.
- **Riesgo de inflación**: erosiona la rentabilidad real.
- **Riesgo soberano**: bajo, pero no nulo (lo refleja la prima de riesgo).

## Operaciones relacionadas
- [VAN y TIR](#op=van-tir)
- [Conversor TIN ↔ TAE](#op=tin-tae)
- [Bono: precio ↔ rentabilidad (TIR)](#op=bono-precio-rentabilidad)
- Ficha [Curva de tipos soberana y prima de riesgo](#ficha=conocimiento%2Fbolsa-inversion%2Fcurva-de-tipos-y-prima-de-riesgo.md)
- Zona **Renta variable y renta fija** → Renta fija: el bono español a 10 años y la prima de riesgo (`#rf=ES10Y`, `#rf=PRIMA-ES`).

## Fuentes
- Tesoro Público — información pública sobre Letras, Bonos y Obligaciones y su calendario de subastas.
- Banco de España — mercado de deuda pública anotada.
