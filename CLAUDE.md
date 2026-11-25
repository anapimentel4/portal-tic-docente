# Portal TIC Docente — Instrucciones del proyecto

> Claude Code: lee este archivo completo al iniciar cada sesión. Es el plan oficial del proyecto. No agregues funcionalidades fuera de este plan sin preguntarme.

## Contexto

- Plataforma web para los docentes de un centro educativo dominicano (Nivel Secundario), gestionada por la dinamizadora TIC (yo).
- **Auditoría: la semana del 30 de noviembre de 2026** (se movió el 24-nov; antes era el 25-nov; fecha exacta por confirmar). Prioridad: una primera versión funcional, publicada en internet y con datos reales.
- Sé **Angular**. **No sé React**: no uses React ni Next.js.
- Yo voy a mantener el proyecto: al terminar cada fase, explícame brevemente los archivos importantes que creaste y para qué sirven.
- Toda la interfaz en **español**.

## Reglas de trabajo

1. Trabaja por fases, en orden. Al terminar cada una: haz commit, publica y dime qué quedó listo, cómo probarlo y qué tengo que hacer yo.
2. Marca la fase como completada en la sección "Estado" de este archivo.
3. Cuando algo falle, explícame el error en palabras sencillas y corrige solo eso, sin cambiar nada más.
4. Nunca pongas la `service_role` key en el frontend ni subas claves a GitHub.

## Stack

- Monorepo con **pnpm workspaces**.
- `apps/web`: **Angular** (versión actual, componentes standalone, signals, Angular Router), TypeScript y **Tailwind CSS**.
- `@supabase/supabase-js` dentro de servicios de Angular (`SupabaseService`, `AuthService`, `RecursosService`, `SolicitudesService`…) y guards de ruta según el rol.
- **Supabase**: Postgres, Auth (correo y contraseña), Storage y Row Level Security.
- `packages/shared`: tipos y catálogos.
- `supabase/migrations` y `supabase/seed` versionados en el repo.
- Despliegue en **Vercel** o Netlify.
- En `environment.ts` solo van la URL de Supabase y la anon key. `environment.example.ts` lleva los mismos campos sin valores.

## Estructura

```
portal-tic-docente/
├── CLAUDE.md
├── recursos.csv
├── apps/web/src/app/
│   ├── core/     (servicios, guards, modelos)
│   ├── pages/    (inicio, recursos, recurso-detalle, robotica, solicitudes, panel, login)
│   └── shared/   (header, footer, tarjeta-recurso, filtros, badge)
├── supabase/
│   ├── migrations/
│   └── seed/
└── packages/shared/
```

## Diseño

- Colores: primario `#1D4ED8`, oscuro `#0F172A`, fondo `#F6F7FB`, acento `#C2410C`, texto secundario `#475569`, bordes `#E2E8F0`.
- Fuentes (Google Fonts): **Space Grotesk** para los títulos e **Inter** para el texto.
- Tarjetas blancas con esquinas redondeadas; aspecto limpio e institucional; iconos SVG de trazo, sin emojis.
- Diseño mobile first y adaptable a computadora.
- Accesible: `<button>`, `<a>` y `<label>` reales, contraste AA y `aria-label` en los botones que solo tienen icono.

## Roles (tabla `profiles`: id, nombre, correo, area, rol)

| Rol | Puede |
|---|---|
| docente | Ver recursos publicados, proyectos de robótica y talleres; crear solicitudes y proponer recursos; ver solo sus propias solicitudes |
| dinamizadora | Gestionar todo |
| gestion | Solo lectura del panel y de los indicadores |

- Todo usuario nuevo se crea como `docente`, mediante un trigger.
- Los permisos se aplican con **RLS en Postgres**, no solo en el frontend. Usa la función `is_dinamizadora()` en las políticas.

## Tablas

1. **profiles**: ver arriba.
2. **recursos**: id, titulo, area, grado, tipo, estado (`en_revision` | `publicado` | `rechazado`), enlace_o_archivo, descripcion, competencias, tema_unidad, herramienta, duracion, nivel_tic (`basico` | `intermedio` | `avanzado`), autor, fuente, licencia, etiquetas, fecha_registro, bien_clasificado (bool), enlace_funciona (bool), derechos_uso (bool), util_aula (bool), creado_por (uuid), created_at.
3. **proyectos_robotica**: id, titulo, area, grado, competencias, materiales, pasos, foto_url, estado, created_at.
4. **solicitudes**: id, docente_id, tipo (`acompanamiento` | `problema_tecnico` | `reserva_laboratorio` | `reserva_kits` | `reserva_laptops`), fecha_deseada, detalle, estado (`pendiente` | `en_proceso` | `resuelta`), created_at.
5. **talleres, inscripciones, acompanamientos, inventario, incidencias, plan_trabajo**: se crean las tablas, pero en la interfaz solo se muestran como "Próximamente".

## Catálogos

- **Áreas**: Lengua Española, Matemática, Ciencias Sociales, Ciencias de la Naturaleza, Inglés, Francés, Educación Artística, Educación Física, Formación Integral Humana y Religiosa, Todas las áreas.
- **Grados**: 1.º Secundaria a 6.º Secundaria, Todos los grados.
- **Tipos**: Guía, Video, Plantilla, Presentación, Tutorial, Proyecto de robótica, Ciudadanía digital, Herramienta web.

## Datos reales

- `recursos.csv`, en la raíz del repo, tiene 30 recursos reales (29 originales y Libro Abierto del MINERD, agregado el 24-nov) con estas columnas: Título, Área, Grado, Tipo, Estado, Archivo o enlace, Descripción corta, Competencias, Tema / unidad, Herramienta usada, Duración sugerida, Nivel TIC del docente, Autor, Fuente, Licencia, Etiquetas, Fecha de registro, Bien clasificado, Enlace funciona, Derechos de uso, Útil para el aula.
- El script de seed convierte los valores así: "En revisión" → `en_revision`, "Publicado" → `publicado`, "Rechazado" → `rechazado`, "Básico" → `basico`, "Intermedio" → `intermedio`, "Avanzado" → `avanzado`, y TRUE/FALSE → booleanos.
- Los videos y las herramientas externas se guardan solo como enlace.

---

## Fases

### Fase 1 — Base del proyecto y primera publicación
- Crear el monorepo con pnpm workspaces: `apps/web`, `packages/shared`, `supabase/migrations`, `supabase/seed`.
- Crear el proyecto Angular con Angular CLI (componentes standalone, signals, Router).
- Configurar Tailwind con los colores y las fuentes del diseño.
- Crear las carpetas `core/`, `pages/` y `shared/`.
- `SupabaseService` y `AuthService`: registro, login, logout y sesión actual con signals.
- Páginas de login y registro en español.
- Header con el menú: Inicio, Recursos, Robótica, Solicitudes, Panel. Panel solo se muestra a los roles dinamizadora y gestión.
- `environment.ts` y `environment.example.ts`, con el `.gitignore` correcto.
- Configurar el despliegue en Vercel o Netlify y explicarme los pasos para conectarlo.

### Fase 2 — Base de datos, permisos y recursos reales
- Migraciones SQL con todas las tablas.
- Trigger que crea el perfil con rol `docente` al registrarse.
- RLS en todas las tablas:
  - **recursos**: el docente lee solo los publicados y puede insertar con estado `en_revision`; la dinamizadora lee y edita todo; gestión solo lee.
  - **proyectos_robotica**: todos los usuarios autenticados leen; solo la dinamizadora crea, edita y borra.
  - **solicitudes**: el docente crea y lee solo las suyas; la dinamizadora lee y edita todas; gestión solo lee.
  - **El resto de las tablas**: solo la dinamizadora.
- Función SQL `is_dinamizadora()`.
- Script de seed que importa `recursos.csv`.
- Modelos TypeScript y catálogos en `packages/shared`.
- Dime: cómo ejecutar las migraciones, el comando para importar el CSV y el SQL para cambiar mi usuario a dinamizadora.
- Explícame las reglas RLS en palabras sencillas.

### Fase 3 — Inicio y Banco de recursos
- **Inicio**:
  - un hero con el título "Tecnología al servicio de tu clase", un texto breve, un buscador y un selector de área que llevan al banco con los filtros aplicados;
  - los 6 módulos en tarjetas con iconos SVG (Banco de recursos, Robótica educativa, Formación docente, Planificación y evaluación, Soporte y acompañamiento, Ciudadanía digital), con la etiqueta "Próximamente" en los que aún no existen;
  - la sección de proyectos de robótica destacados;
  - un pie de página con [Nombre], Dinamizadora TIC y [correo] como placeholders.
- **Banco de recursos**:
  - filtros por área y grado (selects) y por tipo (chips), y búsqueda por texto en título, descripción y etiquetas;
  - tarjetas con un badge del tipo (un color por tipo), título, descripción, área y grado, y botones "Ver" y "Abrir enlace" (abre en una pestaña nueva);
  - un contador de resultados y un mensaje amable cuando no hay resultados.
- **Detalle del recurso**: todos sus campos, con el enlace destacado.
- **"Compartir un recurso"**: un formulario que guarda con estado `en_revision` y `creado_por` = usuario actual, y muestra una confirmación.
- `RecursosService` para todas las consultas.

### Fase 4 — Robótica y Solicitudes
- **Robótica**:
  - una lista con foto, título, área y grado, con filtros;
  - una página de detalle con competencias, materiales del kit, pasos numerados y foto;
  - un formulario para crear y editar proyectos, solo para la dinamizadora, que sube la foto a Storage (bucket `robotica`: lectura pública, escritura solo para la dinamizadora);
  - en el seed, 3 proyectos de ejemplo: "Semáforo inteligente" (Matemática, 1.º), "Estación meteorológica" (Ciencias de la Naturaleza, 3.º) y "Maqueta de ciudad sostenible" (Ciencias Sociales, 2.º);
  - conectar los proyectos destacados de Inicio con estos datos.
- **Solicitudes**:
  - un formulario con tipo (Acompañamiento en el aula, Problema técnico, Reserva del laboratorio, Reserva de kits de robótica, Reserva del carrito de laptops), fecha deseada y detalle;
  - una página "Mis solicitudes" con un badge de estado;
  - el formulario de Inicio y el de "Mis solicitudes" usan el mismo `SolicitudesService` y muestran una confirmación al enviar.
- Guards: hay que iniciar sesión para crear solicitudes, y para crear proyectos hay que ser dinamizadora.

### Fase 5 — Panel de la dinamizadora
- La ruta `/panel`, con un guard que solo deja entrar a los roles dinamizadora y gestion.
- Menú lateral: Resumen, Recursos en revisión, Solicitudes, y Talleres, Inventario y Acompañamientos como "Próximamente". En el celular se apila arriba.
- **Resumen**: tarjetas con indicadores reales (total de recursos, publicados, en revisión, solicitudes pendientes y docentes registrados) y un saludo con el nombre del usuario.
- **Recursos en revisión**: un checklist de 4 casillas que se guarda, un botón para abrir el enlace, los botones Aprobar (estado `publicado`) y Rechazar, y la acción "Aprobar seleccionados".
- **Solicitudes**: una tabla con el docente, el tipo, la fecha, el detalle y el estado, con un select para cambiar el estado y filtros por estado.
- El rol gestion lo ve todo en modo solo lectura.
- Los indicadores se actualizan después de cada acción.
- Flujo de prueba: un docente propone un recurso → la dinamizadora lo revisa y lo aprueba → el recurso aparece en el banco.

### Revisión final (antes de la auditoría)
- Que no haya claves expuestas.
- Que RLS funcione, probado con docente, dinamizadora y gestion.
- Que todas las páginas se vean bien en el celular.
- Que no haya errores en la consola ni en la compilación.
- Que los textos estén en español, con buena ortografía.
- Hacer una lista de los cambios y publicar la versión final.

---

## Estado

- [x] Fase 1 — Base del proyecto y primera publicación
- [x] Fase 2 — Base de datos, permisos y recursos reales
  - Ajustado en la revisión final (migración 5): la función se llama `is_dinamizadora()`; inventario, incidencias y plan_trabajo son solo de la dinamizadora. Se mantiene (decidido): los visitantes sin sesión ven los recursos y proyectos publicados, los borradores de robótica solo los ve el panel, y los docentes ven los talleres y sus propias inscripciones y acompañamientos (tabla Roles).
  - Agregado (aprobado): la base de datos exige las 4 casillas para publicar un recurso (migración 4).
- [x] Fase 3 — Inicio y Banco de recursos
  - Adelantado de la fase 4: el formulario de apoyo de Inicio.
- [x] Fase 4 — Robótica y Solicitudes
  - Cambio de diseño pedido el 23-nov: las tarjetas tienen colores suaves (paleta en `apps/web/src/app/shared/colores.ts`) en vez de ser solo blancas.
  - Agregado (aprobado el 23-nov, según el mockup): en Inicio, los proyectos de robótica van en una franja oscura con etiquetas de área y grado y una frase corta (campo `descripcion`, migración 6). Lo demás del mockup (talleres, "Esta semana", buenas prácticas) queda para después de la auditoría.
  - Cambio de diseño pedido el 23-nov ("más profesional y tecnológico"): hero oscuro con cuadrícula tipo circuito, cifras reales y "Lo más nuevo en el banco"; encabezados oscuros en Recursos, Robótica y Mis solicitudes; tarjetas que se elevan al pasar el ratón; nombre del centro en el encabezado. Mismos colores y fuentes del plan (estilos en `apps/web/src/styles.css`).
  - Agregado (aprobado el 23-nov): botón "Compartir por WhatsApp" en el detalle de recursos y de proyectos (`shared/compartir-whatsapp`).
  - Cambio de diseño pedido el 23-nov ("bonito y coqueto"): burbujas flotantes y ola en el hero; detalle de recurso y de proyecto con tarjetas oscuras; entrada en dos columnas con bienvenida; pie con iconos, enlaces de correo y teléfono, y línea de color.
  - Cambio de diseño pedido el 23-nov: tarjetas del banco más pequeñas (4 por fila) con una portada de color según el área (o el tipo, si es para todas las áreas), con icono y el sitio web (`PORTADA_AREA` y `PORTADA_TIPO` en `shared/colores.ts`).
- [x] Fase 5 — Panel de la dinamizadora
  - Agregado (aprobado): en Recursos en revisión, las pestañas Publicados/Rechazados y el botón "Volver a revisión".
- [x] Agregado (pedido por la auditoría el 24-nov) — Talleres: Sala de taller de English Hub
  - Botón "Talleres" en el menú (visible para todos) que lleva a `/talleres`: tema, QR con un enlace (ampliable), agenda del día que marca la actividad de "ahora", ruleta, temporizador con sonido, grupos al azar, marcador, banco de dinámicas, pantalla completa para proyectar y "Configurar el taller".
  - No usa la base de datos: lo configurado se guarda en el navegador. Código en `apps/web/src/app/pages/talleres/`. Especificación y mockups de English Hub en `docs/english-hub/`.
  - Lo demás de English Hub (registro con QR, recursos por grado, fotos, encuesta y certificado, panel de la técnica) queda para después de la auditoría, con su propio plan.
  - En Inicio, la tarjeta "Formación docente" lleva a Talleres (pedido el 24-nov).
  - Libro Abierto del MINERD agregado al Banco de recursos como "Herramienta web", publicado (fila nueva en `recursos.csv`, importada con `pnpm seed:recursos`).
- [ ] Revisión final
  - Hecho (23-nov): claves revisadas, pruebas de RLS con los 3 roles (`pnpm test:rls`), páginas públicas sin errores de consola y en celular, ortografía, lista de cambios en `CAMBIOS.md`.
  - Hecho (23-nov): migración 5 ejecutada en Supabase; Vercel conectado y publicado en https://portal-tic-docente-web.vercel.app (se publica solo con cada push a `main`).
  - Falta: poner esa dirección en Supabase → Authentication → URL Configuration y hacer el flujo de prueba en la web publicada con una cuenta de cada rol.

## Fase 2 del proyecto (después de la auditoría)

Talleres con inscripción, inventario e incidencias, registro de acompañamientos, plan de trabajo TIC, informe PDF para el distrito y conexión con la app de planificación Fortech-IA.

Ideas anotadas el 23-nov al revisar otros portales (FórmateRD Easy-plug, Escuela TIC Conectada, INTEF, Educ.ar, MINERD). Ninguna está aprobada todavía:

- **Robótica tipo lección**: objetivo, duración, "Qué necesitas", paso a paso, programa (ArduinoBlocks/código), "Cómo funciona", reto extra, "Piensa y conecta" y un botón "¡Lo logré!".
- **Catálogo del kit del centro**: una tarjeta con foto propia por módulo (sensores, actuadores, pantallas, comunicación) enlazada desde los materiales de cada proyecto.
- **Colecciones o rutas en el banco** ("Empieza con robótica", "IA en el aula"…) y marcar como "Archivo" los recursos desactualizados.
- **Inventario compatible con el del distrito** (Escuela TIC Conectada: total, funcionan, no funcionan, ubicación, observación) para no registrar dos veces; evidencias de dinamización y avisos de plazos.
- **Buscador global** en el encabezado (atajo Ctrl K).
- **Imagen propia por recurso** (campo `imagen_url` y subida a Storage); si no tiene, se sigue usando la portada de color.
- **Talleres, "Esta semana" y Buenas prácticas del centro** del mockup de Inicio, cuando haya fechas y fotos reales.
- Recursos sugeridos para el banco (los sube la dinamizadora como "Herramienta web" o "Tutorial", solo como enlace): lecciones de FórmateRD, Educando/Libro Abierto del MINERD, EducaSID, Procomún (INTEF) y colecciones de Educ.ar.
