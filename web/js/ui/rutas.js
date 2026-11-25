// Navegación por el fragmento de la URL: #op=<id>[&campo=valor…], #ficha=<ruta>,
// #rv[=<índice>[&valor=<ticker>]] (renta variable) o #rf=<código> (renta fija, p. ej. ES10Y).
// El fragmento no se envía nunca al servidor.

export function leerRuta(hash = location.hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (p.has('op')) {
    const params = Object.fromEntries([...p.entries()].filter(([k]) => k !== 'op'));
    return { tipo: 'op', id: p.get('op'), params };
  }
  if (p.has('ficha')) return { tipo: 'ficha', ruta: p.get('ficha') };
  if (p.has('rv')) return { tipo: 'rv', indice: p.get('rv') || null, valor: p.get('valor') || null };
  if (p.has('rf')) return { tipo: 'rf', codigo: p.get('rf') || 'ES10Y' };
  return { tipo: 'inicio' };
}

export function irA(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
