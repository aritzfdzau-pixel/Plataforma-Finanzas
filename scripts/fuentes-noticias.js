// Feeds RSS de noticias (fase 3). Editable: añadir, quitar o cambiar direcciones aquí.
// `seccion`: categoría que se asigna por la sección del feed (null = solo palabras clave).
// `institucional`: noticias del BCE y del Banco de España (categoría "Institucional").
// `dePago`: la fuente tiene muro de pago; la web lo indica junto al titular.
//
// ⚠️ Pendiente de verificar: las direcciones no se han podido probar desde el entorno de
// desarrollo (sin red). La tarea comprueba cada feed en cada ejecución y publica su estado
// en datos/noticias.json ("fuentes"); la web lo muestra en el panel "Ver todas".

export const FUENTES_NOTICIAS = Object.freeze([
  { id: 'eleconomista-mercados', fuente: 'elEconomista', url: 'https://www.eleconomista.es/rss/rss-mercados.php', seccion: 'bolsa-inversion' },
  { id: 'eleconomista-economia', fuente: 'elEconomista', url: 'https://www.eleconomista.es/rss/rss-economia.php', seccion: 'macroeconomia' },
  { id: 'eleconomista-empresas', fuente: 'elEconomista', url: 'https://www.eleconomista.es/rss/rss-empresas.php', seccion: 'empresas' },
  { id: 'eleconomista-vivienda', fuente: 'elEconomista', url: 'https://www.eleconomista.es/rss/rss-vivienda.php', seccion: 'real-estate' },
  { id: 'ft-mercados', fuente: 'Financial Times', url: 'https://www.ft.com/markets?format=rss', seccion: 'bolsa-inversion', dePago: true },
  { id: 'ft-empresas', fuente: 'Financial Times', url: 'https://www.ft.com/companies?format=rss', seccion: 'empresas', dePago: true },
  { id: 'ft-economia-global', fuente: 'Financial Times', url: 'https://www.ft.com/global-economy?format=rss', seccion: 'macroeconomia', dePago: true },
  { id: 'ft-divisas', fuente: 'Financial Times', url: 'https://www.ft.com/currencies?format=rss', seccion: 'fx', dePago: true },
  { id: 'bce-prensa', fuente: 'BCE', url: 'https://www.ecb.europa.eu/rss/press.html', seccion: null, institucional: true },
  { id: 'bde-noticias', fuente: 'Banco de España', url: 'https://www.bde.es/wbe/es/inicio/rss/rss-noticias/', seccion: null, institucional: true },
]);
