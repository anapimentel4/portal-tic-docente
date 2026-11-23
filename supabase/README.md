# Base de datos (Supabase)

## Migraciones (`migrations/`)

Se ejecutan **una vez y en orden** en Supabase → SQL Editor → New query (pegar y Run):

1. `20261123000001_tablas.sql`: tipos, tablas y el trigger que crea el perfil al registrarse.
2. `20261123000002_seguridad_rls.sql`: funciones de rol, reglas RLS e indicadores del panel.
3. `20261123000003_storage.sql`: buckets `recursos` y `robotica` y sus reglas.

Para un cambio futuro, crea un archivo nuevo con fecha más reciente (no edites los ya ejecutados).

## Hacerte dinamizadora

Todo usuario nuevo es `docente`. Después de crear tu cuenta en el portal, ejecuta en el SQL Editor:

```sql
update public.profiles set rol = 'dinamizadora' where correo = 'TU_CORREO';
```

(Para el rol de solo lectura usa `'gestion'`.) Desde el portal solo la dinamizadora puede cambiar roles.

## Pruebas de permisos

```bash
pnpm test:rls
```

Ejecuta las migraciones en un Postgres de prueba en memoria y comprueba cada regla
(qué puede ver y hacer cada rol) y que las listas coincidan con `packages/shared`.
Córrelo cada vez que cambies el SQL o los catálogos.
