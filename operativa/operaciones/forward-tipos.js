import { forwardImplicito, liquidacionFra } from '../lib/finanzas.js';
import { entero, exigir } from './_comun.js';

export default {
  id: 'forward-tipos',
  titulo: 'Tipo forward implícito y FRA',
  tituloIngles: 'Implied forward rate and FRA',
  categoria: 'tipos-interes',
  ficha: 'conocimiento/tipos-interes/forward-de-tipos-y-fra.md',
  resumen: 'Tipo implícito entre dos plazos del mercado monetario y liquidación de un FRA.',
  campos: [
    { id: 'tipoCorto', etiqueta: 'Tipo a plazo corto (p. ej. 3 meses)', unidad: '%', tipo: 'porcentaje', defecto: '2,00', grupo: 'Tipos de contado' },
    { id: 'diasCorto', etiqueta: 'Plazo corto', unidad: 'días', tipo: 'entero', defecto: '90', grupo: 'Tipos de contado' },
    { id: 'tipoLargo', etiqueta: 'Tipo a plazo largo (p. ej. 6 meses)', unidad: '%', tipo: 'porcentaje', defecto: '2,20', grupo: 'Tipos de contado' },
    { id: 'diasLargo', etiqueta: 'Plazo largo', unidad: 'días', tipo: 'entero', defecto: '180', grupo: 'Tipos de contado' },
    { id: 'conFra', etiqueta: 'Calcular la liquidación de un FRA', tipo: 'casilla', defecto: 'si', grupo: 'FRA (Forward Rate Agreement)' },
    { id: 'nominal', etiqueta: 'Nominal del FRA', unidad: 'EUR', tipo: 'numero', defecto: '1.000.000', grupo: 'FRA (Forward Rate Agreement)', visibleSi: { campo: 'conFra', valor: 'si' } },
    { id: 'tipoFra', etiqueta: 'Tipo pactado (K)', unidad: '%', tipo: 'porcentaje', defecto: '2,40', grupo: 'FRA (Forward Rate Agreement)', visibleSi: { campo: 'conFra', valor: 'si' } },
    { id: 'tipoReferencia', etiqueta: 'Tipo de referencia al fijar (L)', unidad: '%', tipo: 'porcentaje', defecto: '2,60', grupo: 'FRA (Forward Rate Agreement)', visibleSi: { campo: 'conFra', valor: 'si' },
      ayuda: 'Euribor del plazo del FRA el día de fijación (escenario).' },
  ],
  calcular(v) {
    const d1 = entero(v.diasCorto, 'Plazo corto');
    const d2 = entero(v.diasLargo, 'Plazo largo');
    exigir(d2 > d1, 'El plazo largo debe ser mayor que el corto');
    const { forward, dias } = forwardImplicito({ tipoCorto: v.tipoCorto, diasCorto: d1, tipoLargo: v.tipoLargo, diasLargo: d2 });
    const resultados = [
      { id: 'forward', etiqueta: `Tipo forward implícito ${Math.round(d1 / 30)}x${Math.round(d2 / 30)} (${dias} días)`, valor: forward, formato: 'pct:4', destacado: true },
      { id: 'primaPb', etiqueta: 'Diferencia con el tipo a plazo largo (pb)', valor: (forward - v.tipoLargo) * 10000, formato: 'num:1' },
    ];
    const avisos = ['El forward implícito no es una previsión: es el tipo que hace indiferente invertir a plazo largo o a corto y renovar (sin arbitraje). Incluye primas de plazo.'];
    if (v.conFra) {
      const liq = liquidacionFra({ nominal: v.nominal, tipoFra: v.tipoFra, tipoReferencia: v.tipoReferencia, dias });
      resultados.push(
        { id: 'liquidacion', etiqueta: 'Liquidación del FRA (positivo: cobra el comprador)', valor: liq, formato: 'eur', grupo: 'FRA', destacado: true },
        { id: 'sinDescontar', etiqueta: 'Diferencial de intereses sin descontar', valor: v.nominal * (v.tipoReferencia - v.tipoFra) * dias / 360, formato: 'eur', grupo: 'FRA' },
      );
      avisos.push('El comprador del FRA se protege de subidas de tipos (típico de quien tiene deuda a tipo variable); el vendedor, de bajadas.');
    }
    return {
      resultados,
      convenciones: {
        base: 'Act/360 (mercado monetario del euro)', periodicidad: `Periodo forward de ${dias} días`,
        nominalEfectivo: 'Tipos nominales, interés simple; la liquidación del FRA se descuenta al inicio del periodo',
        comisiones: 'Sin comisiones ni margen de la entidad',
      },
      avisos,
    };
  },
};
