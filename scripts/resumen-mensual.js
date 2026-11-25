// Genera el resumen de la revisión mensual en Markdown (stdout).
// Uso: node scripts/resumen-mensual.js [AAAA-MM] [owner/repo]
//   Sin mes, usa el mes anterior al actual. Necesita el historial de git completo
//   (en Actions: actions/checkout con fetch-depth: 0).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, construirIndice } from './indice.js';
import { rangoMes, mesAnterior, fusionesDelMes, decisionesDelMes, pendientes, cuerpoRevision } from './revision.js';
import { grafo, disponer, huecos } from '../web/js/lib/mapa.js';
import { composicionDesfasada } from '../web/js/lib/mercados.js';

const mes = process.argv[2] ?? mesAnterior(new Date().toISOString());
const repo = process.argv[3] ?? process.env.GITHUB_REPOSITORY ?? '';
rangoMes(mes); // valida el formato

const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const log = git('log', '--first-parent', '--format=%H%x09%ad%x09%s', '--date=short', 'HEAD');
const decisionesMd = readFileSync(join(RAIZ, 'decisiones.md'), 'utf8');

// Archivos versionados de texto en los que buscar "⚠️ Pendiente de verificar".
// Se excluyen los archivos que solo definen la marca (normas y plantillas) y los registros de revisión.
const DEFINEN_LA_MARCA = ['AGENTS.md', 'conocimiento/_plantilla.md', '.github/pull_request_template.md', 'scripts/revision.js', 'scripts/resumen-mensual.js'];
const rutas = git('ls-files').split('\n')
  .filter((r) => /\.(md|js|html|css|py|yml)$/.test(r) && !r.startsWith('revisiones/') && !r.startsWith('tests/') && !DEFINEN_LA_MARCA.includes(r));
const archivos = rutas.map((ruta) => ({ ruta, texto: readFileSync(join(RAIZ, ruta), 'utf8') }));

const indice = await construirIndice();
// Fase 8: aviso si la composición de algún índice tiene más de 3 meses (cambia con cada rebalanceo).
const composicion = composicionDesfasada(JSON.parse(readFileSync(join(RAIZ, 'conocimiento/mercados/composicion-indices.json'), 'utf8')), new Date().toISOString(), 3);
process.stdout.write(cuerpoRevision({
  mes,
  repo,
  fusiones: fusionesDelMes(log, mes),
  decisiones: decisionesDelMes(decisionesMd, mes),
  listaPendientes: pendientes(archivos),
  huecos: huecos(disponer(grafo(indice))),
  composicion,
  totales: {
    fichas: indice.fichas.length,
    operaciones: indice.operaciones.length,
    patrones: indice.patrones.length,
    decisiones: (decisionesMd.match(/^## D-\d{3}/gm) ?? []).length,
  },
}));
