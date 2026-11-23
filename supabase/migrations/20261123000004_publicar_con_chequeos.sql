-- =====================================================================
-- Portal TIC Docente · 4. Un recurso solo se publica con las 4 comprobaciones
--   bien_clasificado, enlace_funciona, derechos_uso y util_aula.
--   La pantalla del panel ya lo pide; esto lo exige también la base de datos
--   (aunque alguien use la API directamente).
--
-- Si ya hay recursos publicados sin las 4 marcas, esta migración falla con
-- "violates check constraint ... is violated by some row". En ese caso, primero:
--   update public.recursos set estado = 'en_revision'
--   where estado = 'publicado'
--     and not (bien_clasificado and enlace_funciona and derechos_uso and util_aula);
-- =====================================================================

alter table public.recursos
  add constraint recursos_publicado_con_chequeos check (
    estado <> 'publicado'
    or (bien_clasificado and enlace_funciona and derechos_uso and util_aula)
  );
