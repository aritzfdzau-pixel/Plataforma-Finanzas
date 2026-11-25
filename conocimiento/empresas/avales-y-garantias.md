---
titulo: "Avales y garantías bancarias: coste"
idioma: es
traduccion: ""
categoria: empresas
etiquetas: [avales, garantias, bank-guarantee, comisiones, riesgo-de-firma]
operaciones: [avales]
patrones: [P-022]
fecha_creacion: 2026-11-25
ultima_revision: 2026-11-25
fuentes: ["Manuales generales de operaciones bancarias de riesgo de firma"]
---

# Avales y garantías bancarias: coste

## Qué es
Un **aval** (*bank guarantee*) es el compromiso de una entidad de pagar a un tercero si la
empresa avalada no cumple. No hay dinero prestado: es **riesgo de firma**.
- **Técnico:** garantiza el cumplimiento de un contrato (licitaciones, buena ejecución,
  devolución de anticipos).
- **Financiero:** garantiza el pago de una deuda; suele tener una comisión de riesgo mayor.

## Para qué se usa
- Presentarse a concursos públicos y contratos que exigen garantía.
- Garantizar pagos aplazados o anticipos recibidos de clientes.

## Cómo funciona
- **Comisión de riesgo:** porcentaje anual sobre el importe avalado, liquidado por periodos
  (trimestral habitual), con un **mínimo por periodo**.
- **Comisión de formalización:** porcentaje sobre el importe al emitir el aval.
- **Gastos fijos:** intervención, correo, etc.
- Convención de la operación: se cobra **cada periodo iniciado entero** (sin prorrata). Periodos
  = ⌈días / (365/m)⌉.
- **% anual equivalente:** coste total / importe × 365 / días. Es un coste simple, no un tipo de
  interés (no hay financiación).

⚠️ Pendiente de verificar: algunas entidades prorratean el último periodo o siguen cobrando
hasta que se devuelve el documento original del aval.

## Fórmulas
$$
n = \left\lceil \frac{t \cdot m}{365} \right\rceil, \qquad C_p = \max\left(\frac{A \cdot c_r}{m}, \text{mín}\right)
$$

$$
\text{Coste} = n \cdot C_p + A \cdot c_f + G, \qquad \%_{anual} = \frac{\text{Coste}}{A} \cdot \frac{365}{t}
$$

Donde: $A$ = importe avalado; $t$ = días; $m$ = periodos al año; $c_r$ = comisión de riesgo
anual; $c_f$ = formalización; $G$ = gastos fijos.

## Ejemplo resuelto
Con la operación [Coste de avales y garantías](#op=avales), comisión de riesgo 1 % trimestral
con mínimo de 30 €, formalización 0,50 % y gastos de 50 € (condiciones inventadas):

| Concepto | 100.000 € a 365 días | 10.000 € a 200 días |
| --- | --- | --- |
| Periodos cobrados | 4 | 3 |
| Comisión por periodo | 250,00 € | 30,00 € (mínimo) |
| Coste total | 1.550,00 € | 190,00 € |
| % anual equivalente | 1,550 % | 3,468 % |

En avales pequeños y cortos pesan los mínimos y los periodos iniciados. Verificado con
LibreOffice Calc.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Permite contratar sin inmovilizar caja | Consume límite de riesgo con la entidad |
| Coste bajo frente a un depósito en garantía | Mínimos y periodos enteros encarecen los avales pequeños |

## Riesgos
- Si el beneficiario ejecuta el aval, la entidad paga y reclama el importe a la empresa.
- Avales sin fecha de vencimiento: siguen generando comisiones hasta su cancelación.

## Operaciones relacionadas
- [Coste de avales y garantías](#op=avales)

## Fuentes
- Manuales generales de operaciones bancarias: riesgo de firma, avales técnicos y financieros.
