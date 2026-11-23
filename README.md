# Portal TIC Docente

Plataforma web para los docentes del Nivel Secundario, gestionada por la dinamizadora TIC.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `apps/web` | App Angular (standalone, signals, Tailwind) |
| `apps/web/src/app/core` | Servicios (Supabase, Auth…), guards y configuración |
| `apps/web/src/app/pages` | Una carpeta por página |
| `apps/web/src/app/shared` | Componentes reutilizables (header, footer…) |
| `packages/shared` | Catálogos (áreas, grados, tipos, estados) y tipos compartidos |
| `supabase/migrations` | SQL de las tablas y de las reglas RLS, en orden |
| `supabase/seed` | Script que importa `recursos.csv` |

## Comandos

```bash
corepack enable pnpm   # solo la primera vez
pnpm install           # instala todo el monorepo
pnpm dev               # abre la app en http://localhost:4200
pnpm build             # compila para producción (apps/web/dist/web/browser)
```

## Claves

- `apps/web/src/environments/environment.ts`: URL de Supabase y **anon key** (públicas).
- `.env` (copiar de `.env.example`): **service_role**, solo para el seed. Nunca se sube a git.

## Despliegue

Vercel lee `vercel.json` en la raíz: instala con pnpm, compila `apps/web` y publica
`apps/web/dist/web/browser`. Cada push a `main` publica una versión nueva.
