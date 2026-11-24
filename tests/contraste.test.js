import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ratioContraste, tokensDeBloque } from './lib/contraste.js';

// --- La función de contraste se verifica con valores de referencia ---
test('ratioContraste: valores de referencia', () => {
  // Referencia: definición WCAG 2.x, blanco sobre negro = 21:1 exacto.
  assert.equal(ratioContraste('#FFFFFF', '#000000'), 21);
  // Referencia: WebAIM Contrast Checker, #767676 sobre #FFFFFF → 4,54:1.
  assert.equal(Number(ratioContraste('#767676', '#FFFFFF').toFixed(2)), 4.54);
  // Referencia: WebAIM Contrast Checker, #777777 sobre #FFFFFF → 4,48:1.
  assert.equal(Number(ratioContraste('#777777', '#FFFFFF').toFixed(2)), 4.48);
  // Simétrica.
  assert.equal(ratioContraste('#000000', '#FFFFFF'), 21);
});

// --- Los tokens de ambos temas cumplen AA (≥ 4,5:1 para texto normal) ---
const css = readFileSync(new URL('../web/css/tokens.css', import.meta.url), 'utf8');
const temas = {
  oscuro: tokensDeBloque(css, ':root[data-theme="dark"]'),
  claro: tokensDeBloque(css, ':root[data-theme="light"]'),
};

const TEXTOS = [
  '--color-text', '--color-text-muted', '--color-accent',
  '--color-up', '--color-down',
  '--cat-fx', '--cat-empresas', '--cat-bolsa-inversion', '--cat-real-estate', '--cat-institucional',
];
const FONDOS = ['--color-bg', '--color-surface', '--color-surface-raised'];
const AA = 4.5;

for (const [nombreTema, t] of Object.entries(temas)) {
  test(`tema ${nombreTema}: el fondo principal es casi negro / claro según el tema`, () => {
    assert.ok(t['--color-bg'], 'falta --color-bg');
  });

  for (const texto of TEXTOS) {
    for (const fondo of FONDOS) {
      test(`tema ${nombreTema}: ${texto} sobre ${fondo} ≥ ${AA}:1`, () => {
        assert.ok(t[texto] && t[fondo], `faltan tokens ${texto} o ${fondo}`);
        const r = ratioContraste(t[texto], t[fondo]);
        assert.ok(r >= AA, `${t[texto]} sobre ${t[fondo]} = ${r.toFixed(2)}:1`);
      });
    }
  }

  test(`tema ${nombreTema}: texto sobre ámbar ≥ ${AA}:1`, () => {
    const r = ratioContraste(t['--color-accent-contrast'], t['--color-accent']);
    assert.ok(r >= AA, `${r.toFixed(2)}:1`);
  });
}

test('el tema oscuro usa el fondo #0B0D10', () => {
  assert.equal(temas.oscuro['--color-bg'].toUpperCase(), '#0B0D10');
});
