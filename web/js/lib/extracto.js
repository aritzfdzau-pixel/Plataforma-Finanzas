// Importación de extractos de cuenta (Excel .xlsx o CSV) para la operación de saldo medio (D-045).
// Sin dependencias: el .xlsx es un ZIP que se abre con DecompressionStream (estándar del navegador)
// y sus hojas son XML. Todo ocurre en el navegador; el archivo no se envía a ningún sitio.
// Privacidad: de cada fila solo se leen la FECHA, el IMPORTE (o cargo/abono) y el SALDO; el resto de
// columnas (concepto, cuenta, titular…) y las filas anteriores a la cabecera se ignoran.
import { leerNumero, leerFecha } from './formato.js';

export const MAX_BYTES_EXTRACTO = 5 * 1024 * 1024;
export const MAX_FILAS_EXTRACTO = 20000;
/** Plantilla descargable (datos inventados: el ejemplo de la ficha). */
export const PLANTILLA_EXTRACTO = 'Fecha valor;Importe;Saldo\r\n15/01/2026;3.000,00;8.000,00\r\n10/02/2026;-9.000,00;-1.000,00\r\n01/03/2026;4.000,00;3.000,00\r\n';

const normalizar = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[().:_]/g, ' ').replace(/\s+/g, ' ').trim();

// Nombres de columna reconocidos (minúsculas, sin tildes ni signos), por prioridad.
const COLUMNAS = {
  fechaValor: ['fecha valor', 'f valor', 'valor', 'value date', 'fecha de valor'],
  fecha: ['fecha', 'fecha operacion', 'f operacion', 'fecha contable', 'fecha movimiento', 'date', 'dia', 'booking date'],
  importe: ['importe', 'importe eur', 'importe euros', 'cantidad', 'amount', 'movimiento', 'importe en euros'],
  cargo: ['cargo', 'cargos', 'debe', 'debito', 'debitos', 'salida', 'salidas', 'pagos', 'debit'],
  abono: ['abono', 'abonos', 'haber', 'credito', 'creditos', 'entrada', 'entradas', 'ingresos', 'credit'],
  saldo: ['saldo', 'saldo eur', 'saldo euros', 'saldo contable', 'saldo disponible', 'balance', 'saldo final'],
};
const buscarColumna = (cab, nombres) => {
  for (const n of nombres) { const k = cab.indexOf(n); if (k >= 0) return k; }
  return -1;
};

// ------------------------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------------------------
/** Separador más probable de la primera línea con datos: «;», tabulador o «,». */
function separadorCsv(lineas) {
  const muestra = lineas.slice(0, 30).join('\n');
  const cuenta = (c) => muestra.split(c).length - 1;
  if (cuenta(';') >= cuenta('\t') && cuenta(';') > 0) return ';';
  if (cuenta('\t') > 0) return '\t';
  return ',';
}

/** Celdas de una línea CSV con comillas («"1.234,56"», «""» dentro de comillas). */
function celdasCsv(linea, sep) {
  const celdas = []; let actual = ''; let comillas = false;
  for (let k = 0; k < linea.length; k++) {
    const c = linea[k];
    if (comillas) {
      if (c === '"' && linea[k + 1] === '"') { actual += '"'; k++; } else if (c === '"') comillas = false; else actual += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { celdas.push(actual); actual = ''; } else actual += c;
  }
  celdas.push(actual);
  return celdas.map((x) => x.trim());
}

/** Filas (matriz de textos) de un CSV y su separador. */
export function leerFilasCsv(texto) {
  const lineas = String(texto ?? '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lineas.length) throw new Error('El archivo está vacío.');
  if (lineas.length > MAX_FILAS_EXTRACTO) throw new Error(`Demasiadas filas (máximo ${MAX_FILAS_EXTRACTO}).`);
  const sep = separadorCsv(lineas);
  return { filas: lineas.map((l) => celdasCsv(l, sep)), sep };
}

// ------------------------------------------------------------------------------------
// XLSX (ZIP + XML)
// ------------------------------------------------------------------------------------
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/** Entradas de un ZIP: Map(nombre → () => Promise<Uint8Array>). */
export function entradasZip(bytes) {
  let fin = -1;
  for (let k = bytes.length - 22; k >= Math.max(0, bytes.length - 65557); k--) {
    if (u32(bytes, k) === 0x06054b50) { fin = k; break; }
  }
  if (fin < 0) throw new Error('No es un archivo .xlsx válido (ZIP sin directorio).');
  const total = u16(bytes, fin + 10);
  let p = u32(bytes, fin + 16);
  const entradas = new Map();
  const dec = new TextDecoder();
  for (let i = 0; i < total; i++) {
    if (u32(bytes, p) !== 0x02014b50) throw new Error('ZIP dañado.');
    const metodo = u16(bytes, p + 10);
    const comprimido = u32(bytes, p + 20);
    const lNombre = u16(bytes, p + 28); const lExtra = u16(bytes, p + 30); const lComent = u16(bytes, p + 32);
    const local = u32(bytes, p + 42);
    const nombre = dec.decode(bytes.subarray(p + 46, p + 46 + lNombre));
    entradas.set(nombre, async () => {
      if (u32(bytes, local) !== 0x04034b50) throw new Error('ZIP dañado.');
      const inicio = local + 30 + u16(bytes, local + 26) + u16(bytes, local + 28);
      const datos = bytes.subarray(inicio, inicio + comprimido);
      if (metodo === 0) return datos;
      if (metodo !== 8) throw new Error('Compresión del .xlsx no admitida.');
      const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(flujo).arrayBuffer());
    });
    p += 46 + lNombre + lExtra + lComent;
  }
  return entradas;
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const desescapar = (t) => t.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
  return ENTIDADES[e] ?? m;
});
/** Texto de los <t> de un fragmento (cadenas con formato enriquecido incluidas). */
const textoDeT = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => desescapar(m[1])).join('');
const columnaIndice = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

/** Fecha de un número de serie de Excel (sistema 1900): 46023 → '2026-01-01'. */
export function fechaSerieExcel(n) {
  if (!Number.isFinite(n) || n < 1 || n > 2958465) return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000).toISOString().slice(0, 10);
}

/** Filas de la primera hoja de un .xlsx (los números como número; el resto como texto). */
export async function leerFilasXlsx(bytes) {
  const zip = entradasZip(bytes);
  const leer = async (n) => (zip.has(n) ? new TextDecoder().decode(await zip.get(n)()) : null);
  // Primera hoja según el libro (workbook.xml + sus relaciones); si no, sheet1.xml.
  let hoja = 'xl/worksheets/sheet1.xml';
  const libro = await leer('xl/workbook.xml');
  const rels = await leer('xl/_rels/workbook.xml.rels');
  const rid = libro && /<sheet\b[^>]*\br:id="([^"]+)"/.exec(libro)?.[1];
  if (rid && rels) {
    const rel = new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*>`).exec(rels)?.[0];
    const destino = rel && /Target="([^"]+)"/.exec(rel)?.[1];
    if (destino) hoja = destino.startsWith('/') ? destino.slice(1) : `xl/${destino.replace(/^\.\//, '')}`;
  }
  const xml = await leer(hoja);
  if (!xml) throw new Error('El .xlsx no tiene hojas legibles.');
  const compartidas = [...((await leer('xl/sharedStrings.xml')) ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textoDeT(m[1]));
  const filas = [];
  for (const [, contenido] of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const fila = [];
    for (const m of contenido.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1]; const cuerpo = m[2] ?? '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const tipo = /\bt="(\w+)"/.exec(attrs)?.[1] ?? 'n';
      const v = /<v>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1];
      let valor = '';
      if (tipo === 's') valor = compartidas[Number(v)] ?? '';
      else if (tipo === 'inlineStr') valor = textoDeT(cuerpo);
      else if (tipo === 'str' || tipo === 'd' || tipo === 'e') valor = v === undefined ? '' : desescapar(v);
      else if (tipo === 'b') valor = v === '1' ? 'VERDADERO' : 'FALSO';
      else valor = v === undefined ? '' : Number(v);
      const k = ref ? columnaIndice(ref) : fila.length;
      while (fila.length < k) fila.push('');
      fila[k] = valor;
    }
    filas.push(fila);
    if (filas.length > MAX_FILAS_EXTRACTO) throw new Error(`Demasiadas filas (máximo ${MAX_FILAS_EXTRACTO}).`);
  }
  if (!filas.length) throw new Error('La primera hoja del .xlsx está vacía.');
  return filas;
}

// ------------------------------------------------------------------------------------
// Interpretación
// ------------------------------------------------------------------------------------
function fechaDe(celda) {
  if (typeof celda === 'number') return fechaSerieExcel(celda);
  const t = String(celda ?? '').trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
  const corto = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/.exec(t); // dd/mm/aa → 20aa
  return leerFecha(corto ? `${corto[1]}/${corto[2]}/20${corto[3]}` : t);
}
/** Importe de una celda; con CSV separado por «,» los decimales van con punto. */
function numeroDe(celda, sep) {
  if (typeof celda === 'number') return celda;
  let t = String(celda ?? '').trim().replace(/\s|€|EUR/gi, '').replace(/^\((.*)\)$/, '-$1').replace(/^−/, '-');
  if (t === '' || t === '-') return null;
  if (/-$/.test(t)) t = `-${t.slice(0, -1)}`; // «1.234,56-»
  if (sep === ',' && /^[-+]?\d+(\.\d+)?$/.test(t)) return Number(t);
  const n = leerNumero(t);
  return Number.isNaN(n) ? NaN : n;
}

/**
 * Detecta la cabecera y las columnas de un extracto y devuelve las filas con fecha, importe y
 * saldo (los que haya). Sin cabecera reconocible, admite dos columnas «fecha; valor»: el valor se
 * toma como importe o como saldo según `porDefecto`.
 * @returns {{ entrada: 'movimientos'|'saldos', filas: Array<{fecha, importe, saldo}>, columnas: object, ignoradas: number, invertido: boolean, avisos: string[] }}
 */
export function interpretarExtracto(filasCrudas, { sep = ';', porDefecto = 'movimientos' } = {}) {
  let cabecera = -1; let col = null;
  for (let k = 0; k < Math.min(filasCrudas.length, 40); k++) {
    const cab = filasCrudas[k].map(normalizar);
    const c = Object.fromEntries(Object.entries(COLUMNAS).map(([id, nombres]) => [id, buscarColumna(cab, nombres)]));
    if (c.fechaValor < 0 && c.fecha < 0) continue;
    if (c.importe < 0 && c.cargo < 0 && c.abono < 0 && c.saldo < 0) continue;
    cabecera = k; col = c; break;
  }
  const avisos = [];
  if (cabecera < 0) {
    const primera = filasCrudas.findIndex((f) => fechaDe(f[0]) && Number.isFinite(numeroDe(f[1], sep)));
    if (primera < 0) {
      throw new Error('No se reconoce el formato. Usa una cabecera con «Fecha» (o «Fecha valor») y «Importe» (o «Cargo» y «Abono») y/o «Saldo», o dos columnas: fecha y valor.');
    }
    cabecera = primera - 1;
    col = { fechaValor: -1, fecha: 0, importe: porDefecto === 'movimientos' ? 1 : -1, cargo: -1, abono: -1, saldo: porDefecto === 'saldos' ? 1 : -1 };
    avisos.push(`Sin cabecera: se ha leído la segunda columna como ${porDefecto === 'saldos' ? 'saldo' : 'importe'}.`);
  }
  const colFecha = col.fechaValor >= 0 ? col.fechaValor : col.fecha;
  if (col.fechaValor < 0 && col.fecha >= 0 && cabecera >= 0 && filasCrudas[cabecera]) {
    avisos.push('No hay columna «Fecha valor»: se usa la fecha de operación (los intereses se calculan por fecha valor).');
  }
  const conImporte = col.importe >= 0 || col.cargo >= 0 || col.abono >= 0;
  const filas = []; let ignoradas = 0;
  for (const f of filasCrudas.slice(cabecera + 1)) {
    if (!f.some((x) => String(x ?? '').trim() !== '')) continue;
    const fecha = fechaDe(f[colFecha]);
    let importe = null;
    if (col.importe >= 0) importe = numeroDe(f[col.importe], sep);
    else if (conImporte) {
      const cargo = col.cargo >= 0 ? numeroDe(f[col.cargo], sep) : null;
      const abono = col.abono >= 0 ? numeroDe(f[col.abono], sep) : null;
      importe = (Number.isNaN(cargo) || Number.isNaN(abono)) ? NaN : (abono === null && cargo === null ? null : Math.abs(abono ?? 0) - Math.abs(cargo ?? 0));
    }
    const saldo = col.saldo >= 0 ? numeroDe(f[col.saldo], sep) : null;
    const valido = fecha && !Number.isNaN(importe) && !Number.isNaN(saldo) && (conImporte ? importe !== null : saldo !== null);
    if (!valido) { ignoradas++; continue; }
    filas.push({ fecha, importe, saldo });
  }
  if (!filas.length) throw new Error('No hay filas con fecha e importe o saldo válidos.');
  if (ignoradas) avisos.push(ignoradas === 1 ? '1 fila sin fecha o importe válidos se ha ignorado (p. ej. un total o una nota).' : `${ignoradas} filas sin fecha o importe válidos se han ignorado (p. ej. totales o notas).`);
  // Extractos en orden descendente (lo más reciente arriba): se invierten para que el orden dentro
  // de un mismo día siga siendo el real.
  const invertido = filas.length > 1 && filas[0].fecha > filas.at(-1).fecha;
  if (invertido) { filas.reverse(); avisos.push('El extracto venía de lo más reciente a lo más antiguo: se ha ordenado por fecha.'); }
  for (let k = 1; k < filas.length; k++) {
    if (filas[k].fecha < filas[k - 1].fecha) { avisos.push('Las fechas no están en orden: se ordenan por fecha (dentro de un día se respeta el orden del archivo).'); break; }
  }
  filas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)); // estable
  return { entrada: conImporte ? 'movimientos' : 'saldos', filas, columnas: col, ignoradas, invertido, avisos };
}

const textoNumero = (x) => {
  const r = Math.round(x * 100) / 100;
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(r === 0 ? 0 : r);
};
const textoFecha = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Convierte un extracto interpretado en textos para el formulario de la operación saldos-medios:
 * { entrada, movimientos | saldos, saldoInicial?, desde, hasta } y un resumen con avisos.
 * Con columna de saldo e importes, el saldo inicial es el saldo de la primera fila menos su
 * importe, y se comprueba que cada saldo = saldo anterior + importe.
 */
export function textosDesdeExtracto(ext) {
  const { filas } = ext;
  const avisos = [...ext.avisos];
  // Periodo propuesto: meses naturales completos que cubren el extracto (se puede ajustar).
  const primerDia = `${filas[0].fecha.slice(0, 8)}01`;
  const [a, m] = filas.at(-1).fecha.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  const textos = { entrada: ext.entrada, desde: textoFecha(primerDia), hasta: textoFecha(ultimoDia) };
  avisos.push(`Periodo propuesto: del ${textos.desde} al ${textos.hasta} (meses completos); ajústalo si liquidas otro periodo.`);
  if (ext.entrada === 'movimientos') {
    textos.movimientos = filas.map((f) => `${textoFecha(f.fecha)}; ${textoNumero(f.importe)}`).join('\n');
    if (filas[0].saldo !== null && Number.isFinite(filas[0].saldo)) {
      textos.saldoInicial = textoNumero(filas[0].saldo - filas[0].importe);
      let descuadres = 0;
      for (let k = 1; k < filas.length; k++) {
        if (filas[k].saldo !== null && Math.abs(filas[k - 1].saldo + filas[k].importe - filas[k].saldo) > 0.005) descuadres++;
      }
      if (descuadres) avisos.push(`⚠️ ${descuadres} ${descuadres === 1 ? 'fila cuyo saldo no cuadra' : 'filas cuyo saldo no cuadra'} con el saldo anterior más el importe: revisa el orden del extracto o el saldo inicial.`);
      else avisos.push('Saldo inicial deducido del extracto (saldo de la primera fila − su importe); todos los saldos cuadran.');
    } else {
      avisos.push('El extracto no trae saldos: revisa el «Saldo antes del primer dato».');
    }
  } else {
    textos.saldos = filas.map((f) => `${textoFecha(f.fecha)}; ${textoNumero(f.saldo)}`).join('\n');
  }
  return { textos, resumen: `${filas.length} ${ext.entrada === 'movimientos' ? 'movimientos' : 'saldos'} leídos (del ${textoFecha(filas[0].fecha)} al ${textoFecha(filas.at(-1).fecha)}).`, avisos };
}

/** Lee un archivo (.xlsx, .csv o .txt) ya cargado en memoria y devuelve los textos del formulario. */
export async function importarExtracto(nombre, bytes, { porDefecto = 'movimientos' } = {}) {
  if (bytes.length > MAX_BYTES_EXTRACTO) throw new Error('El archivo supera 5 MB.');
  const ext = String(nombre).toLowerCase().split('.').pop();
  if (ext === 'xls') throw new Error('Los .xls antiguos no se pueden leer sin librerías: guárdalo como .xlsx o .csv.');
  let filas; let sep = ';';
  if (ext === 'xlsx' || (bytes[0] === 0x50 && bytes[1] === 0x4b)) filas = await leerFilasXlsx(bytes);
  else {
    let texto;
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { texto = new TextDecoder('windows-1252').decode(bytes); } // CSV de Excel en Windows
    ({ filas, sep } = leerFilasCsv(texto));
  }
  return textosDesdeExtracto(interpretarExtracto(filas, { sep, porDefecto }));
}
