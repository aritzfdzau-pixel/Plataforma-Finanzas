// Se carga de forma síncrona en <head> para aplicar el tema antes de pintar.
// Oscuro por defecto; la preferencia solo se guarda en este navegador.
(function () {
  try {
    var guardado = localStorage.getItem('tema');
    if (guardado === 'light' || guardado === 'dark') {
      document.documentElement.setAttribute('data-theme', guardado);
    }
  } catch (e) { /* almacenamiento no disponible: se queda en oscuro */ }
})();
