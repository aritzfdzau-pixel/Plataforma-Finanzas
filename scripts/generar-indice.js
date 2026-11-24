// Uso: node scripts/generar-indice.js
// Regenera conocimiento/indice.json a partir de las cabeceras de las fichas.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { construirIndice, RAIZ } from './indice.js';

const indice = await construirIndice();
writeFileSync(join(RAIZ, 'conocimiento/indice.json'), `${JSON.stringify(indice, null, 2)}\n`);
console.log(`Índice generado: ${indice.fichas.length} fichas, ${indice.operaciones.length} operaciones.`);
