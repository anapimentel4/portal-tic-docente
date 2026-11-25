// Catálogos del portal. Son la única fuente de verdad: los usan la app web,
// el seed del CSV y (como texto) las restricciones de la base de datos.
// Si cambias un valor aquí, cambia también la migración correspondiente.

export const AREAS = [
  'Lengua Española',
  'Matemática',
  'Ciencias Sociales',
  'Ciencias de la Naturaleza',
  'Inglés',
  'Francés',
  'Educación Artística',
  'Educación Física',
  'Formación Integral Humana y Religiosa',
  'Todas las áreas',
] as const;
export type Area = (typeof AREAS)[number];

export const GRADOS = [
  '1.º Secundaria',
  '2.º Secundaria',
  '3.º Secundaria',
  '4.º Secundaria',
  '5.º Secundaria',
  '6.º Secundaria',
  'Todos los grados',
] as const;
export type Grado = (typeof GRADOS)[number];

export const TIPOS_RECURSO = [
  'Guía',
  'Video',
  'Plantilla',
  'Presentación',
  'Tutorial',
  'Proyecto de robótica',
  'Ciudadanía digital',
  'Herramienta web',
] as const;
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

/** Valor en la base de datos → texto que ve el usuario. */
export const ESTADOS_RECURSO = {
  en_revision: 'En revisión',
  publicado: 'Publicado',
  rechazado: 'Rechazado',
} as const;
export type EstadoRecurso = keyof typeof ESTADOS_RECURSO;

export const NIVELES_TIC = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
} as const;
export type NivelTic = keyof typeof NIVELES_TIC;

export const ROLES = {
  docente: 'Docente',
  dinamizadora: 'Dinamizadora TIC',
  gestion: 'Gestión',
} as const;
export type Rol = keyof typeof ROLES;

export const TIPOS_SOLICITUD = {
  acompanamiento: 'Acompañamiento en el aula',
  problema_tecnico: 'Problema técnico',
  reserva_laboratorio: 'Reserva del laboratorio',
  reserva_kits: 'Reserva de kits de robótica',
  reserva_laptops: 'Reserva del carrito de laptops',
} as const;
export type TipoSolicitud = keyof typeof TIPOS_SOLICITUD;

export const ESTADOS_SOLICITUD = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
} as const;
export type EstadoSolicitud = keyof typeof ESTADOS_SOLICITUD;

/** Categorías de las publicaciones del muro colaborativo (Talleres). Igual que el check de la migración 7. */
export const CATEGORIAS_MURO = ['Juegos', 'Canciones', 'Speaking', 'Vocabulario', 'Otra idea'] as const;
export type CategoriaMuro = (typeof CATEGORIAS_MURO)[number];
