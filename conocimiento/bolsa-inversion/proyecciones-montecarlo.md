---
titulo: "Proyecciones con Montecarlo y validación frente al paseo aleatorio"
idioma: es
traduccion: ""
categoria: bolsa-inversion
etiquetas: [montecarlo, proyecciones, paseo-aleatorio, bandas, incertidumbre, backtesting, rmse, theil]
operaciones: []
patrones: [P-015, P-016]
fecha_creacion: 2026-11-24
ultima_revision: 2026-11-24
fuentes: ["Manuales generales de econometría financiera y previsión (paseo aleatorio, RMSE, U de Theil)", "Manuales generales de simulación de Montecarlo en finanzas"]
---

# Proyecciones con Montecarlo y validación frente al paseo aleatorio

## Qué es
Una **simulación de Montecarlo** genera miles de trayectorias posibles de una serie (un tipo de
cambio, un tipo de interés) a partir de cómo se ha movido en el pasado, y resume el resultado
en **bandas**: entre qué valores quedaría el 90 % de los casos (percentiles 5 % y 95 %).
No es una predicción: es un **rango de escenarios** coherente con la volatilidad histórica.

## Para qué se usa
- Ver la incertidumbre: con qué amplitud se puede mover un tipo de cambio en 3 o 6 meses.
- Dimensionar coberturas o colchones de liquidez.
- Comprobar, con datos pasados, si un modelo aporta algo frente a la hipótesis más simple.

## Cómo funciona
- **Modelo**: paseo aleatorio. Para precios y tipos de cambio, sobre el logaritmo (las
  rentabilidades log son normales con media μ y desviación σ); para tipos de interés, sobre el
  nivel (las variaciones en pb son normales).
- μ y σ se estiman con las últimas observaciones de la serie. Por defecto **sin tendencia**
  (μ = 0): la tendencia histórica es muy ruidosa y la validación suele mostrar que no ayuda.
- Se simulan 2.000 trayectorias con una semilla fija (resultado reproducible) y se dibujan las
  bandas 5 %–95 % y 25 %–75 % con la mediana: **nunca una sola línea**.
- **Validación (origen móvil)**: en muchos momentos del pasado se proyecta a *h* periodos con
  los datos disponibles entonces y se compara con lo que ocurrió. Se mide el error del modelo y
  el del **paseo aleatorio** ("mañana igual que hoy"), la **U de Theil** (RMSE modelo / RMSE
  paseo aleatorio; < 1 mejora al paseo aleatorio) y la **cobertura** de la banda (debería
  rondar el 90 %).

## Fórmulas
$$
\ln S_{t+1} = \ln S_t + \mu + \sigma Z_t, \qquad Z_t \sim N(0,1)
$$

$$
\text{Banda equivalente: } S_0\,e^{\mu h \pm z_{0{,}95}\,\sigma\sqrt{h}}, \qquad z_{0{,}95} = 1{,}6449
$$

$$
\text{RMSE} = \sqrt{\tfrac{1}{n}\sum (y_i - \hat y_i)^2}, \qquad U = \frac{\text{RMSE}_{modelo}}{\text{RMSE}_{paseo\ aleatorio}}
$$

## Ejemplo resuelto
Serie inventada: valor 100, μ = 0,02 % y σ = 1 % por periodo, horizonte 20 periodos. Banda
5 %–95 % calculada con LibreOffice (`EXP`, `DISTR.NORM.INV`): **93,28 – 108,06**. La simulación
con 20.000 trayectorias reproduce esos percentiles con un error menor del 0,5 % (test de P-015).

Errores (LibreOffice, `ABS` y `SUMA.XMENOSY2`): con reales 10, 12, 11, 13 frente a 11, 11, 12, 12,
el error medio absoluto es 1; con reales 10, 12, 11, 14, la RMSE es 1,3229.

## Ventajas e inconvenientes
| Ventajas | Inconvenientes |
| --- | --- |
| Muestra la incertidumbre en vez de una cifra única | Supone normalidad: subestima las colas (crisis) |
| Reproducible y fácil de explicar | Volatilidad constante en todo el horizonte |
| La validación frente al paseo aleatorio evita engañarse | El pasado no garantiza el futuro |

## Riesgos
- Presentar la mediana como "la previsión": lo útil es la banda.
- Fiarse de una tendencia histórica sin validarla.
- Ignorar que la cobertura real de la banda suele ser menor del 90 % en mercados con saltos.

## Operaciones relacionadas
- Zona **Proyecciones y escenarios** de la web (Montecarlo y validación sobre las series de Históricos).
- [Escenario de tipo de cambio](#op=escenario-tipo-cambio)
- [Escenario de Euribor en una hipoteca](#op=escenario-euribor)

## Fuentes
- Manuales generales de econometría financiera y previsión: paseo aleatorio, RMSE, U de Theil.
- Manuales generales de simulación de Montecarlo aplicada a finanzas.
