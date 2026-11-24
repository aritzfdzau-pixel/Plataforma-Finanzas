// Punto de entrada de la interfaz (módulo ES, sin dependencias).

const raiz = document.documentElement;
const boton = document.getElementById('cambiar-tema');

function aplicarTema(tema) {
  raiz.setAttribute('data-theme', tema);
  const claro = tema === 'light';
  boton.textContent = claro ? 'Modo oscuro' : 'Modo claro';
  boton.setAttribute('aria-pressed', String(claro));
}

boton.addEventListener('click', () => {
  const nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  aplicarTema(nuevo);
  try { localStorage.setItem('tema', nuevo); } catch { /* sin almacenamiento */ }
});

aplicarTema(raiz.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
