import { cuotaFrancesa, pendienteFrances } from '../lib/finanzas.js';
import { positivo, entero, exigir } from './_comun.js';

export default {
  id: 'hipoteca-variable',
  titulo: 'Hipoteca variable: cuota y revisión',
  tituloIngles: 'Variable-rate mortgage',
  categoria: 'real-estate',
  ficha: 'conocimiento/real-estate/hipoteca-variable.md',
  resumen: 'Cuota con Euribor + diferencial y nueva cuota tras la revisión.',
  campos: [
    { id: 'capital', etiqueta: 'Capital del préstamo', unidad: 'EUR', tipo: 'numero', defecto: '200.000' },
    { id: 'anios', etiqueta: 'Plazo', unidad: 'años', tipo: 'entero', defecto: '25' },
    { id: 'euribor', etiqueta: 'Euribor inicial (media mensual BdE)', unidad: '%', tipo: 'porcentaje', defecto: '2,50',
      ayuda: 'Introducido a mano. Referencia oficial: media mensual publicada por el Banco de España.' },
    { id: 'diferencial', etiqueta: 'Diferencial', unidad: '%', tipo: 'porcentaje', defecto: '0,90' },
    { id: 'mesesRevision', etiqueta: 'Revisión', tipo: 'seleccion', defecto: '12',
      opciones: [{ valor: '12', etiqueta: 'Anual (12 meses)' }, { valor: '6', etiqueta: 'Semestral (6 meses)' }] },
    { id: 'euriborRevision', etiqueta: 'Euribor en la revisión', unidad: '%', tipo: 'porcentaje', defecto: '2,10' },
    { id: 'sinNegativo', etiqueta: 'El TIN no puede ser negativo', tipo: 'seleccion', defecto: 'si',
      opciones: [{ valor: 'si', etiqueta: 'Sí (TIN mínimo 0 %)' }, { valor: 'no', etiqueta: 'No' }] },
  ],
  calcular(v) {
    const capital = positivo(v.capital, 'Capital');
    const n = entero(v.anios, 'Plazo') * 12;
    const k = Number(v.mesesRevision);
    exigir(k < n, 'La revisión debe ser anterior al final del préstamo');
    const ajustar = (t) => (v.sinNegativo === 'si' ? Math.max(0, t) : t);
    const tin1 = ajustar(v.euribor + v.diferencial);
    const tin2 = ajustar(v.euriborRevision + v.diferencial);
    exigir(tin1 > -1 && tin2 > -1, 'Tipos no válidos');
    const cuota1 = cuotaFrancesa(capital, tin1 / 12, n);
    const pendiente = pendienteFrances(capital, tin1 / 12, n, k);
    const cuota2 = cuotaFrancesa(pendiente, tin2 / 12, n - k);
    const avisos = [];
    if (v.sinNegativo === 'si' && (v.euribor + v.diferencial < 0 || v.euriborRevision + v.diferencial < 0)) {
      avisos.push('El TIN calculado sería negativo y se ha fijado en 0 %.');
    }
    avisos.push('⚠️ Pendiente de verificar: la Ley 5/2019 (art. 21.4) establece que el interés remuneratorio no puede ser negativo; confirma el alcance exacto antes de usarlo como regla general.');
    return {
      resultados: [
        { id: 'tin1', etiqueta: 'TIN inicial (Euribor + diferencial)', valor: tin1, formato: 'pct:3' },
        { id: 'cuota1', etiqueta: 'Cuota mensual inicial', valor: cuota1, formato: 'eur', destacado: true },
        { id: 'pendiente', etiqueta: `Capital pendiente en la revisión (mes ${k})`, valor: pendiente, formato: 'eur' },
        { id: 'tin2', etiqueta: 'TIN revisado', valor: tin2, formato: 'pct:3' },
        { id: 'cuota2', etiqueta: 'Nueva cuota mensual', valor: cuota2, formato: 'eur', destacado: true },
        { id: 'variacion', etiqueta: 'Variación de la cuota', valor: cuota2 - cuota1, formato: 'eur', variacion: true },
        { id: 'variacionAnual', etiqueta: 'Variación anual (×12)', valor: (cuota2 - cuota1) * 12, formato: 'eur', variacion: true },
      ],
      convenciones: {
        base: 'Tipo mensual = TIN / 12',
        periodicidad: `Cuotas mensuales; revisión cada ${k} meses`,
        nominalEfectivo: 'TIN nominal (índice + diferencial)',
        comisiones: 'No incluidas (ni seguros vinculados)',
      },
      avisos,
    };
  },
};
