-- =====================================================================
-- Portal TIC Docente · 6. Frase corta para los proyectos de robótica
--
-- Agregado (aprobado el 23-nov, según el mockup de Inicio): cada proyecto
-- tiene una descripción breve que se ve en su tarjeta y en su página.
-- Los permisos (RLS) no cambian: la columna sigue las reglas de la tabla.
-- =====================================================================

alter table public.proyectos_robotica
  add column descripcion text
  constraint proyectos_robotica_descripcion_corta check (char_length(descripcion) <= 160);

-- Frases para los 3 proyectos de ejemplo (solo si todavía no tienen una).
update public.proyectos_robotica set descripcion = 'Tiempos, secuencias y patrones programando LED.'
  where titulo = 'Semáforo inteligente' and descripcion is null;
update public.proyectos_robotica set descripcion = 'Sensores de temperatura y humedad con registro de datos.'
  where titulo = 'Estación meteorológica' and descripcion is null;
update public.proyectos_robotica set descripcion = 'Alumbrado automático y gestión de recursos en la comunidad.'
  where titulo = 'Maqueta de ciudad sostenible' and descripcion is null;
