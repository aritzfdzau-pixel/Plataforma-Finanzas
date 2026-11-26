// Hora de corte de los datos diarios (D-041): los datos que se publican una vez al día
// (tipos del BCE, series oficiales de Históricos y renta fija) se descargan en la primera
// actualización a partir de las 08:00 de Madrid; el resto del día se reutilizan.
// Puro: sin red ni sistema de archivos.

export const HORA_CORTE = 8;
export const ZONA = 'Europe/Madrid';

/** Desfase (ms) de la zona respecto a UTC en el instante `t` (ms). */
function desfase(t, zona) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
}

/** Último instante de corte (las `hora`:00 en `zona`) anterior o igual a `ahora` (ISO), en ISO UTC. */
export function ultimoCorte(ahora, hora = HORA_CORTE, zona = ZONA) {
  const t = Date.parse(ahora);
  if (!Number.isFinite(t)) throw new Error(`Fecha no válida: ${ahora}`);
  const local = new Date(t + desfase(t, zona)); // reloj de pared de la zona, leído con getUTC*
  let corte = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hora);
  if (local.getTime() < corte) corte -= 24 * 3600 * 1000;
  // Reloj de pared → UTC con el desfase de ese momento (cambia en los días de cambio de hora).
  return new Date(corte - desfase(corte - desfase(corte, zona), zona)).toISOString();
}

/** ¿Toca descargar los datos diarios? Sí si lo último descargado es anterior al último corte. */
export function tocaDescargaDiaria(descargadoAnterior, ahora) {
  if (!descargadoAnterior) return true;
  return Date.parse(descargadoAnterior) < Date.parse(ultimoCorte(ahora));
}
