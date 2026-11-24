// Navegación por el fragmento de la URL: #op=<id>[&campo=valor…] o #ficha=<ruta>.
// El fragmento no se envía nunca al servidor.

export function leerRuta(hash = location.hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (p.has('op')) {
    const params = Object.fromEntries([...p.entries()].filter(([k]) => k !== 'op'));
    return { tipo: 'op', id: p.get('op'), params };
  }
  if (p.has('ficha')) return { tipo: 'ficha', ruta: p.get('ficha') };
  return { tipo: 'inicio' };
}

export function irA(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
