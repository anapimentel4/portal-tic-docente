import type { CategoriaMuro } from '@portal/shared';

/**
 * Datos de ejemplo de la Sala de taller (English Hub).
 * Todo se puede cambiar desde "Configurar el taller" en la misma página;
 * estos valores solo se usan la primera vez o al pulsar "Volver al ejemplo".
 */

export interface ActividadAgenda {
  /** Hora de inicio en formato 24 h, por ejemplo "09:15". */
  hora: string;
  minutos: number;
  titulo: string;
}

export interface ConfigTaller {
  tema: string;
  dirigido: string;
  /** Dirección que abre el código QR. */
  enlace: string;
  agenda: ActividadAgenda[];
  /** Un nombre por línea. Se usan en los grupos y en la ruleta. */
  participantes: string;
  /** Una pregunta por línea, para la ruleta. */
  preguntas: string;
}

export const CONFIG_EJEMPLO: ConfigTaller = {
  tema: 'Juegos y dinámicas para la clase de inglés',
  dirigido: 'Docentes de Inglés',
  enlace: '', // vacío = el Banco de recursos de este portal
  agenda: [
    { hora: '09:00', minutos: 15, titulo: 'Rompehielo' },
    { hora: '09:15', minutos: 60, titulo: 'Rotación por estaciones' },
    { hora: '10:15', minutos: 20, titulo: 'Receso' },
    { hora: '10:35', minutos: 10, titulo: 'Energizante' },
    { hora: '10:45', minutos: 45, titulo: 'Micro-clases' },
    { hora: '11:30', minutos: 30, titulo: 'Gallery walk y cierre' },
  ],
  participantes: '',
  preguntas: [
    'What is your favorite activity to teach vocabulary?',
    'Which song do your students love?',
    'How do you start your English class?',
    'What game would you play with 4th grade?',
    'Name three classroom commands in English.',
    'What will you try in your class tomorrow?',
  ].join('\n'),
};

/** Equipos del taller. Los colores van escritos completos para que Tailwind los incluya. */
export const EQUIPOS = [
  { nombre: 'Lions', tarjeta: 'bg-blue-50 border-blue-200', barra: 'bg-blue-700' },
  { nombre: 'Eagles', tarjeta: 'bg-orange-50 border-orange-200', barra: 'bg-orange-700' },
  { nombre: 'Dolphins', tarjeta: 'bg-emerald-50 border-emerald-200', barra: 'bg-emerald-700' },
  { nombre: 'Tigers', tarjeta: 'bg-amber-50 border-amber-200', barra: 'bg-amber-600' },
] as const;

/** Colores de los segmentos de la ruleta (se repiten si hay más opciones). */
export const COLORES_RULETA = ['#1d4ed8', '#c2410c', '#047857', '#d97706', '#6d28d9', '#be123c'];

export type CategoriaDinamica = 'Rompehielo' | 'Energizante' | 'Contenido' | 'Cierre';

export const CATEGORIAS: Record<CategoriaDinamica, string> = {
  Rompehielo: 'bg-blue-100 text-blue-800',
  Energizante: 'bg-amber-100 text-amber-800',
  Contenido: 'bg-orange-100 text-orange-800',
  Cierre: 'bg-emerald-100 text-emerald-800',
};

export interface Dinamica {
  categoria: CategoriaDinamica;
  nombre: string;
  descripcion: string;
  duracion: string;
  habilidad: string;
}

/** Banco de dinámicas y juegos: los docentes las viven en el taller y las llevan a su aula. */
export const DINAMICAS: Dinamica[] = [
  { categoria: 'Rompehielo', nombre: 'Find someone who…', descripcion: 'Tarjeta con frases: caminan y preguntan en inglés hasta completar cada casilla.', duracion: '15 min', habilidad: 'Speaking' },
  { categoria: 'Rompehielo', nombre: 'Two truths and a lie', descripcion: 'Cada quien dice tres frases sobre sí; el grupo adivina cuál es falsa.', duracion: '10 min', habilidad: 'Speaking' },
  { categoria: 'Rompehielo', nombre: 'Snowball fight', descripcion: 'Escriben una pregunta, la lanzan como bola de papel y responden la que reciben.', duracion: '10 min', habilidad: 'Writing' },
  { categoria: 'Energizante', nombre: 'TPR · Simon says', descripcion: 'Vocabulario con movimiento: solo se obedece si la orden empieza con “Simon says”.', duracion: '5 min', habilidad: 'Listening' },
  { categoria: 'Energizante', nombre: 'Stand up if…', descripcion: 'Se ponen de pie si la frase aplica a su práctica. Energiza y diagnostica.', duracion: '5 min', habilidad: 'Listening' },
  { categoria: 'Contenido', nombre: 'Running dictation', descripcion: 'Texto en la pared: uno corre, lee, vuelve y se lo dicta a su equipo.', duracion: '15 min', habilidad: 'Todas' },
  { categoria: 'Contenido', nombre: 'Rotación por estaciones', descripcion: 'Cuatro mesas: speaking, listening, vocabulario y juegos. Cambian cada 10 min.', duracion: '40 min', habilidad: 'Todas' },
  { categoria: 'Contenido', nombre: 'Board race', descripcion: 'Dos equipos compiten escribiendo palabras de una categoría en la pizarra.', duracion: '10 min', habilidad: 'Vocabulario' },
  { categoria: 'Contenido', nombre: 'Micro-clase', descripcion: 'Cada equipo modela una actividad de 5 min; los demás hacen de estudiantes.', duracion: '45 min', habilidad: 'Práctica' },
  { categoria: 'Cierre', nombre: 'Gallery walk', descripcion: 'Recorren los papelógrafos de otros grupos y dejan comentarios en post-its.', duracion: '20 min', habilidad: 'Reflexión' },
  { categoria: 'Cierre', nombre: '3-2-1', descripcion: '3 cosas aprendidas, 2 que aplicarán y 1 pregunta pendiente.', duracion: '5 min', habilidad: 'Reflexión' },
  { categoria: 'Cierre', nombre: 'Pelota de reflexión', descripcion: 'Quien recibe la pelota completa: “Tomorrow in my class I will…”.', duracion: '10 min', habilidad: 'Speaking' },
];

/** Colores de las publicaciones del muro colaborativo, por categoría. */
export const COLORES_MURO: Record<CategoriaMuro, { tarjeta: string; etiqueta: string }> = {
  Juegos: { tarjeta: 'bg-blue-50', etiqueta: 'bg-blue-100 text-blue-800' },
  Canciones: { tarjeta: 'bg-amber-50', etiqueta: 'bg-amber-100 text-amber-800' },
  Speaking: { tarjeta: 'bg-orange-50', etiqueta: 'bg-orange-100 text-orange-800' },
  Vocabulario: { tarjeta: 'bg-emerald-50', etiqueta: 'bg-emerald-100 text-emerald-800' },
  'Otra idea': { tarjeta: 'bg-violet-50', etiqueta: 'bg-violet-100 text-violet-800' },
};
