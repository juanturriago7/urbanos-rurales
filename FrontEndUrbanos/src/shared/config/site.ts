/**
 * Fuente única de los datos de la empresa.
 *
 * Todos los valores están verificados contra urbanosrurales.com. Ningún
 * componente escribe un teléfono, correo, dirección o red social literal en el
 * JSX: todo se lee de aquí, para que cambiarlos sea editar un solo archivo.
 */
export const site = {
  razonSocial: 'URBANOS & RURALES S.A.S',
  nombreCorto: 'Urbanos & Rurales',
  lema: 'Conocemos el territorio para viabilizar sus proyectos',

  // TODO(cliente): el sitio actual dice "desde 1996" en un lugar y "18 años" en
  // otro, lo que en 2026 no cuadra (serían 30). Hasta que el cliente confirme
  // la cifra correcta, ninguna superficie muestra años de trayectoria.
  anioFundacion: 1996,

  contacto: {
    telefono: '+57 (1) 4557844',
    // Formato E.164 sin signos, que es lo que espera la URL de wa.me
    whatsapp: '573504636177',
    whatsappVisible: '+57 350 463 6177',
    email: 'contacto@urbanosrurales.com',
  },

  direccion: {
    calle: 'Carrera 15 # 98-12, Oficina 602',
    edificio: 'Edificio Office Point',
    ciudad: 'Bogotá',
    pais: 'Colombia',
  },

  redes: {
    facebook: 'https://www.facebook.com/urbanosrurales.sas',
    instagram: 'https://www.instagram.com/urbanos.rurales',
    youtube: 'https://www.youtube.com/channel/UCuX5QknUzLWEqT-xmk6WPAg',
    linkedin: 'https://www.linkedin.com/in/urbanos-rurales-41047b21a/',
  },

  legal: {
    // Apunta al sitio actual hasta que exista la página propia (sub-proyecto 4)
    politicaPrivacidad: 'https://urbanosrurales.com/politicas-de-privacidad-y-datos/',
  },
} as const
