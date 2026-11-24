// Feeds RSS de noticias (fase 3). Editable: añadir, quitar o cambiar direcciones aquí.
// `seccion`: categoría que se asigna por la sección del feed (null = solo palabras clave).
// `institucional`: noticias del BCE y del Banco de España (categoría "Institucional").
// `dePago`: la fuente tiene muro de pago; la web lo indica junto al titular.
//
// ⚠️ Pendiente de verificar: las direcciones no se han podido probar desde el entorno de
// desarrollo (sin red). La tarea comprueba cada feed en cada ejecución y publica su estado
// en datos/noticias.json ("fuentes"); la web lo muestra en el panel "Ver todas".

export const FUENTES_NOTICIAS = Object.freeze([
  // Prensa económica española en abierto (sustituye a elEconomista, que responde HTTP 403 a
  // GitHub Actions). ⚠️ Pendiente de verificar: candidatas; se dejan solo las que respondan.
  { id: 'cincodias-portada', fuente: 'Cinco Días', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/cincodias.elpais.com/portada', seccion: null },
  { id: 'cincodias-mercados', fuente: 'Cinco Días', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/cincodias.elpais.com/section/mercados/portada', seccion: 'bolsa-inversion' },
  { id: 'cincodias-empresas', fuente: 'Cinco Días', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/cincodias.elpais.com/section/companias/portada', seccion: 'empresas' },
  { id: 'elconfidencial-economia', fuente: 'El Confidencial', url: 'https://rss.elconfidencial.com/economia/', seccion: 'macroeconomia' },
  { id: 'elconfidencial-empresas', fuente: 'El Confidencial', url: 'https://rss.elconfidencial.com/empresas/', seccion: 'empresas' },
  { id: 'elconfidencial-mercados', fuente: 'El Confidencial', url: 'https://rss.elconfidencial.com/mercados/', seccion: 'bolsa-inversion' },
  { id: 'elconfidencial-vivienda', fuente: 'El Confidencial', url: 'https://rss.elconfidencial.com/vivienda/', seccion: 'real-estate' },
  { id: 'expansion-portada', fuente: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/portada.xml', seccion: null },
  { id: 'expansion-mercados', fuente: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/mercados.xml', seccion: 'bolsa-inversion' },
  { id: 'expansion-economia', fuente: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/economia.xml', seccion: 'macroeconomia' },
  { id: 'expansion-empresas', fuente: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/empresas.xml', seccion: 'empresas' },
  { id: 'ft-mercados', fuente: 'Financial Times', url: 'https://www.ft.com/markets?format=rss', seccion: 'bolsa-inversion', dePago: true },
  { id: 'ft-empresas', fuente: 'Financial Times', url: 'https://www.ft.com/companies?format=rss', seccion: 'empresas', dePago: true },
  { id: 'ft-economia-global', fuente: 'Financial Times', url: 'https://www.ft.com/global-economy?format=rss', seccion: 'macroeconomia', dePago: true },
  { id: 'ft-divisas', fuente: 'Financial Times', url: 'https://www.ft.com/currencies?format=rss', seccion: 'fx', dePago: true },
  { id: 'bce-prensa', fuente: 'BCE', url: 'https://www.ecb.europa.eu/rss/press.html', seccion: null, institucional: true },
  { id: 'bde-noticias', fuente: 'Banco de España', url: 'https://www.bde.es/wbe/es/inicio/rss/rss-noticias/', seccion: null, institucional: true },
]);
