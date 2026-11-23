# Cambios — Portal TIC Docente

Primera versión para la auditoría del 25 de noviembre de 2026. Plan completo y estado en `CLAUDE.md`.

## Fase 1 — Base del proyecto
- Monorepo con pnpm: `apps/web` (Angular + Tailwind), `packages/shared` (catálogos y tipos) y `supabase/` (base de datos).
- Diseño: colores y fuentes del plan, encabezado con menú (Inicio, Recursos, Robótica, Solicitudes y Panel), menú para celular y pie de página con los datos de contacto.
- Cuentas: registro, entrada y salida con correo y contraseña. Todo usuario nuevo es docente.
- Despliegue en Vercel (`vercel.json`).

## Fase 2 — Base de datos y permisos
- 10 tablas con sus catálogos validados (áreas, grados, tipos y estados).
- Reglas RLS en todas las tablas: cada rol solo ve y hace lo que le corresponde, y lo exige la base de datos, no solo la página.
- Storage: bucket `recursos` (archivos de docentes) y bucket `robotica` (fotos de proyectos).
- Datos reales: los 29 recursos de `recursos.csv` importados (`pnpm seed:recursos`).
- Un recurso solo se puede publicar con las 4 comprobaciones marcadas (migración 4).
- Pruebas automáticas de permisos: `pnpm test:rls`.

## Fase 3 — Inicio y Banco de recursos
- Inicio: buscador con selector de área, los 6 módulos con iconos y colores suaves, proyectos destacados y formulario de apoyo.
- Banco de recursos: filtros por área y grado, tipos como chips, búsqueda, contador de resultados y tarjetas con "Ver" y "Abrir enlace".
- Detalle del recurso con todos sus campos.
- "Compartir un recurso": los docentes proponen recursos, que quedan en revisión.

## Fase 4 — Robótica y Solicitudes
- Robótica: lista con filtros, detalle con materiales y pasos numerados, y formulario para la dinamizadora con subida de foto.
- 3 proyectos de ejemplo: Semáforo inteligente, Estación meteorológica y Maqueta de ciudad sostenible (`pnpm seed:robotica`).
- Solicitudes: formulario (acompañamiento, problema técnico y reservas) y "Mis solicitudes" con el estado de cada una.

## Fase 5 — Panel de la dinamizadora
- Menú lateral: Resumen, Recursos en revisión y Solicitudes; Talleres, Inventario y Acompañamientos como "Próximamente".
- Resumen con indicadores reales que se actualizan después de cada acción.
- Recursos en revisión: las 4 comprobaciones, Aprobar, Rechazar y "Aprobar seleccionados".
- Solicitudes: tabla con docente, tipo, fecha, detalle y estado, con filtros y cambio de estado.
- El rol gestión ve el panel en solo lectura.

## Revisión final
- Sin claves secretas en el código ni en el historial de git (la clave del frontend es la pública).
- Permisos ajustados al plan (migración 5): función `is_dinamizadora()`; inventario, incidencias y plan de trabajo solo para la dinamizadora.
- Pruebas de permisos ampliadas: aprobación en lote, solicitudes en el panel y tablas solo de la dinamizadora.
- Todas las páginas públicas revisadas sin errores en la consola, en celular y en computadora.
- Textos en español revisados; corregidos el nombre del centro y el formato del horario.

## Después de la auditoría
Talleres con inscripción, inventario e incidencias, registro de acompañamientos, plan de trabajo TIC, informe PDF para el distrito y conexión con Fortech-IA.
