import { precioBono, tirBono, diferencialPb } from '../lib/finanzas.js';
import { noNegativo, entero, exigir } from './_comun.js';

export default {
  id: 'bono-precio-rentabilidad',
  titulo: 'Bono: precio ↔ rentabilidad (TIR)',
  tituloIngles: 'Bond price ↔ yield',
  categoria: 'bolsa-inversion',
  ficha: 'conocimiento/bolsa-inversion/curva-de-tipos-y-prima-de-riesgo.md',
  resumen: 'Precio de un bono a partir de su rentabilidad (o al revés) y cuánto cambia el precio si la rentabilidad sube.',
  campos: [
    { id: 'sentido', etiqueta: 'Cálculo', tipo: 'seleccion', defecto: 'tir->precio',
      opciones: [{ valor: 'tir->precio', etiqueta: 'De rentabilidad (yield) a precio' }, { valor: 'precio->tir', etiqueta: 'De precio a rentabilidad (yield)' }] },
    { id: 'cupon', etiqueta: 'Cupón anual (coupon)', unidad: '%', tipo: 'porcentaje', defecto: '3,00' },
    { id: 'frecuencia', etiqueta: 'Pago del cupón', tipo: 'seleccion', defecto: '1',
      opciones: [{ valor: '1', etiqueta: 'Anual (bonos del Estado español y alemán)' }, { valor: '2', etiqueta: 'Semestral (Treasury, Gilt)' }] },
    { id: 'anios', etiqueta: 'Años hasta el vencimiento', unidad: 'años', tipo: 'entero', defecto: '10' },
    { id: 'tir', etiqueta: 'Rentabilidad a vencimiento (TIR, yield)', unidad: '%', tipo: 'porcentaje', defecto: '3,50',
      visibleSi: { campo: 'sentido', valor: 'tir->precio' } },
    { id: 'precio', etiqueta: 'Precio (por 100 de nominal)', unidad: '% del nominal', tipo: 'numero', defecto: '95,84',
      visibleSi: { campo: 'sentido', valor: 'precio->tir' } },
    { id: 'choque', etiqueta: 'Escenario: subida de la rentabilidad', unidad: 'pb', tipo: 'entero', defecto: '100' },
  ],
  calcular(v) {
    noNegativo(v.cupon, 'Cupón');
    const anios = entero(v.anios, 'Años');
    const f = Number(v.frecuencia);
    const choque = entero(v.choque, 'Escenario (pb)', 0);
    let precio; let y;
    if (v.sentido === 'precio->tir') {
      exigir(Number.isFinite(v.precio) && v.precio > 0, 'Precio: debe ser mayor que 0');
      precio = v.precio;
      y = tirBono({ precio, cupon: v.cupon, anios, frecuencia: f }); // P-024 (con P-004)
    } else {
      exigir(Number.isFinite(v.tir) && v.tir > -0.5, 'Rentabilidad no válida');
      y = v.tir;
      precio = precioBono({ cupon: v.cupon, tir: y, anios, frecuencia: f }); // P-024
    }
    const yEsc = y + choque / 10000;
    const precioEsc = precioBono({ cupon: v.cupon, tir: yEsc, anios, frecuencia: f });
    return {
      resultados: [
        { id: 'precio', etiqueta: 'Precio (clean price, % del nominal)', valor: precio, formato: 'num:4', destacado: v.sentido === 'tir->precio' },
        { id: 'tir', etiqueta: 'Rentabilidad a vencimiento (yield)', valor: y, formato: 'pct:4', destacado: v.sentido === 'precio->tir' },
        { id: 'diferencialCupon', etiqueta: 'Rentabilidad − cupón (spread vs coupon)', valor: diferencialPb(y * 100, v.cupon * 100), formato: 'num:1', nota: 'En pb. Positivo: el bono cotiza bajo la par.' },
        { grupo: 'Escenario', id: 'precioEscenario', etiqueta: `Precio si la rentabilidad sube ${choque} pb`, valor: precioEsc, formato: 'num:4' },
        { grupo: 'Escenario', id: 'variacionPrecio', etiqueta: 'Variación del precio', valor: precioEsc / precio - 1, formato: 'pct:3', variacion: 'normal' },
      ],
      convenciones: {
        base: 'En fecha de pago de cupón: sin cupón corrido (precio limpio = sucio); periodos enteros',
        periodicidad: `Cupón ${f === 1 ? 'anual' : 'semestral'}; la rentabilidad se compone con la misma frecuencia`,
        nominalEfectivo: 'Precio por 100 de nominal; rentabilidad a vencimiento (TIR) anual',
        comisiones: 'Sin comisiones ni impuestos',
      },
      avisos: [
        'Precio y rentabilidad se mueven en sentido contrario: si la rentabilidad sube, el precio baja (y más cuanto más largo es el bono).',
        '⚠️ Pendiente de verificar: entre dos fechas de cupón el mercado añade el cupón corrido y usa la base Act/Act; aquí se calcula solo en fecha de cupón.',
      ],
    };
  },
};
