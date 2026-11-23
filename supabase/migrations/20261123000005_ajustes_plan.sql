-- =====================================================================
-- Portal TIC Docente · 5. Ajustes para seguir el plan (CLAUDE.md, fase 2)
--
-- 1) La función de rol se llama is_dinamizadora(), como pide el plan.
--    Las políticas RLS siguen funcionando solas: Postgres las enlaza a la función,
--    no a su nombre. Solo hay que reescribir la función del trigger, que la llama por nombre.
-- 2) inventario, incidencias y plan_trabajo: solo la dinamizadora (gestión ya no los lee).
--    talleres, inscripciones y acompañamientos siguen como estaban: los docentes
--    ven los talleres y sus propias inscripciones y acompañamientos (tabla Roles del plan).
-- =====================================================================

-- ---------- 1. es_dinamizadora() → is_dinamizadora() ----------
alter function public.es_dinamizadora() rename to is_dinamizadora;

create or replace function public.proteger_rol_y_correo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.rol is distinct from old.rol or new.correo is distinct from old.correo or new.id is distinct from old.id)
     and auth.uid() is not null
     and not public.is_dinamizadora() then
    raise exception 'Solo la dinamizadora puede cambiar el rol o el correo de un perfil.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------- 2. Tablas solo para la dinamizadora ----------
-- Queda la política "… la dinamizadora gestiona" de cada una (lee y escribe).
drop policy "inventario: panel lee" on public.inventario;
drop policy "incidencias: panel lee" on public.incidencias;
drop policy "plan_trabajo: panel lee" on public.plan_trabajo;
