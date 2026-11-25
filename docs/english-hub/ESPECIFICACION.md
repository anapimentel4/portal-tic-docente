# English Hub — módulo para el Portal TIC Docente

Especificación para construir con Claude Code. Autora: Ana J. Pimentel, técnica colaboradora de Inglés, Nivel Primario (2.º ciclo: 4.º, 5.º y 6.º).

## Cómo usar este paquete con Claude Code

1. Copia la carpeta `english-hub/` dentro del repositorio del Portal TIC Docente (por ejemplo en `docs/english-hub/`).
2. Abre Claude Code en la raíz del repositorio y escríbele:

   > Lee `docs/english-hub/ESPECIFICACION.md` y los mockups de `docs/english-hub/mockup/`. Revisa primero cómo está organizado este proyecto y propón un plan para agregar el módulo English Hub siguiendo las convenciones que ya existen. No escribas código hasta que yo apruebe el plan.

3. Ve fase por fase (ver "Fases" al final); pide a Claude Code que haga commit al terminar cada una.

**Sobre los mockups:** son archivos `.dc.html` de un lienzo de diseño. Úsalos como referencia visual y de contenido (textos, campos, colores, orden de las pantallas). No se copian tal cual: el marcado `<x-dc>`, `<sc-for>`, `<sc-if>` y `class Component extends DCLogic` es propio del editor de diseño y debe reescribirse como componentes Angular.

## Stack propuesto

- **Angular** (standalone components, signals, router). Si el portal ya usa otra versión o librería de UI, seguir la del portal.
- **Firebase**: Auth (técnica con correo/Google; docentes con inicio anónimo e invisible), Firestore (datos), Storage (PDF y fotos), con AngularFire.
- **PWA** con `@angular/pwa`, para que el docente pueda "Agregar a la pantalla de inicio" sin descargar nada de una tienda.
- Si el portal ya tiene un backend o base de datos propia, adaptar este modelo a lo que exista en lugar de añadir Firebase.

## Sistema visual

- Fuentes: Space Grotesk (títulos) e Inter (texto), de Google Fonts.
- Colores: fondo `#F6F5F0`, tinta `#1C2333`, texto secundario `#5B6170`, bordes `#E4E2DA`, azul `#2B50C8`, naranja `#D9622B`, verde `#1B8A6B`.
- Tarjetas blancas con radio 14 px; botones y controles de al menos 44 px de alto.
- La vista del docente se diseña para celular primero (390 px de ancho).

## Roles

| Rol | Acceso | Puede |
|---|---|---|
| Técnica | Cuenta propia (administradora) | Todo: subir materiales PDF, gestionar docentes, visitas, observaciones, talleres, aprobar fotos y recursos, generar informes |
| Docente | **Sin cuenta**: entra con el QR del taller y se identifica con su teléfono | Registrar asistencia, ver y descargar recursos, llenar plantillas de planificación, subir fotos (pendientes de aprobación), responder la encuesta, descargar su certificado |

## Vista del docente (mockup/docente) — PRIORIDAD

Ruta pública: `/taller/:codigo`. Se abre escaneando el QR o con el enlace enviado por WhatsApp.

1. **Registro** (`Registro.dc.html`)
   - Paso 1: teléfono (WhatsApp).
   - Si el teléfono no existe: formulario con nombre completo, centro educativo (lista con búsqueda + "Otro"), grados que imparte (4.º, 5.º, 6.º; selección múltiple), secciones, tanda y una casilla obligatoria para autorizar el uso de sus datos.
   - Si el teléfono ya existe: mostrar **solo** "¡Hola de nuevo, {nombre a medias}…!" (por ejemplo "Ana P…"), con los botones "Sí, soy yo · Confirmar", "Actualizar mis datos" y "No soy yo". **Nunca** mostrar centro, grados ni otros datos completos a quien solo escribió un número.
   - Confirmación: hora de llegada, equipo y mesa, y el botón "Entrar al taller".
2. **Inicio** (`Inicio.dc.html`): la actividad del momento, la agenda del día con su estado (hecho / ahora / pendiente) y accesos a Materiales y Fotos.
3. **Recursos** (`Recursos.dc.html`): selector de grado; el libro del grado (abrir PDF); materiales por unidad (planificación, flashcards, canción, juego); los materiales del taller del día.
4. **Planificar** (`Planificar.dc.html`): plantillas de plan de unidad, plan de clase y secuencia didáctica. Campos: grado, unidad, intención pedagógica, inicio / desarrollo / cierre con sus minutos y recursos. Botones "Descargar Word" y "Enviar a la técnica".
5. **Fotos** (`Fotos.dc.html`): cámara o galería (hasta 10), actividad, descripción, casilla de autorización si salen estudiantes. Se guardan con `aprobada: false`.
6. **Encuesta** (`Encuesta.dc.html`): 3 preguntas de 1 a 5 y una abierta. Al enviar se muestra el certificado con "Descargar PDF" y "Enviar por WhatsApp".

Menú inferior fijo en las pantallas 2 a 6: Inicio, Recursos, Planificar, Fotos, Encuesta.

## Vista de la técnica (mockup/tecnica)

Rutas protegidas con el rol técnica.

- `Main`: panel con resumen, agenda de la semana, docentes sin visita reciente y compromisos.
- `Docente`: ficha con historial, fortalezas, aspectos a fortalecer y evidencias.
- `Observacion`: rúbrica de 6 criterios (1 a 4) con puntuación total.
- `Calendario`: vista mensual, necesidades formativas e informe mensual (PDF o Excel).
- `Recursos`: banco por grado y unidad, libros de 4.º a 6.º, plantillas y **subida de PDF** (ver abajo).
- `Evidencias`: álbum por taller, aprobación de fotos y "Incluir en informe".
- `Taller`, `Juegos`, `Asistencia`, `Muro`: pantallas para proyectar en el taller (agenda, ruleta, temporizador, grupos, marcador, quiz, Jeopardy, bingo, flashcards, lista de asistencia, resultados de la encuesta, certificados).

## Subida de materiales PDF por la técnica (requisito clave)

Solo la técnica sube materiales. Los docentes solo los ven y los descargan.

- Formulario "Subir material": archivo PDF (también aceptar `.docx`, `.pptx`, `.mp3` y imágenes para flashcards), título, tipo (libro del estudiante, guía docente, planificación, ficha, flashcards, canción, juego, material de taller), grado (4.º, 5.º, 6.º o "todos"), unidad, taller asociado (opcional) y descripción.
- Validar tipo y tamaño (sugerido: máximo 25 MB por archivo); mostrar barra de progreso.
- Guardar el archivo en Storage: `materiales/{grado}/{unidad}/{id}-{nombre}.pdf` (o `talleres/{tallerId}/materiales/...`).
- Guardar los datos en `recursos/{id}`.
- Los libros grandes se suben una vez y se indican las páginas de inicio de cada unidad, para abrir el PDF directo en esa unidad.
- El docente ve los PDF dentro del navegador (visor) y con un botón de descargar.
- La técnica puede editar los datos, reemplazar el archivo, ocultar o eliminar un material.
- Advertir en la interfaz que solo se suban libros y materiales que se tenga permiso de compartir con los docentes.

## Modelo de datos (Firestore)

```
usuarios/{uid}                    solo la técnica (y lectores futuros)
  nombre, correo, rol: "tecnica"

docentes/{telefonoNormalizado}    p. ej. "18095551234"
  nombre, telefono, centro, centroId, grados[], secciones, tanda,
  autorizaDatos: true, fechaRegistro, ultimoTaller

centros/{centroId}
  nombre, distrito, tanda

talleres/{tallerId}
  tema, fecha, lugar, agenda[{hora, titulo, minutos}],
  codigo (para el QR), activo: true/false, cierreRegistro
  ├─ asistencia/{telefono}   nombre, centro, grados, horaLlegada, equipo, mesa
  ├─ fotos/{id}              storagePath, url, actividad, descripcion,
  │                          subidaPor (telefono), aprobada: false, fecha
  ├─ muro/{id}               texto, categoria, fotoUrl, likes, aprobada
  └─ encuesta/{telefono}     respuestas{}, aplicara, fecha

recursos/{id}
  titulo, tipo, grado, unidad, tallerId?, descripcion,
  storagePath, url, tamano, mime, paginaInicio?, visible: true,
  subidoPor (uid técnica), fecha

planificaciones/{id}
  telefonoDocente, plantilla, grado, unidad, intencion,
  inicio, desarrollo, cierre, recursos, estado: "enviada" | "revisada",
  comentarioTecnica, fecha

visitas/{id}                      solo la técnica
  telefonoDocente, fecha, tipo, rubrica{}, fortalezas, aspectosAMejorar

compromisos/{id}                  solo la técnica
  telefonoDocente, visitaId, texto, fechaLimite, estado
```

## Seguridad (reglas de Firestore y Storage)

- El docente entra con inicio de sesión anónimo e invisible; sin eso no se puede escribir nada.
- Sin cuenta solo se permite **crear** la asistencia, las fotos, la encuesta, la planificación y las publicaciones del muro, y solo en un taller con `activo == true` y con un código válido. Nunca leer ni modificar los datos de otros docentes.
- La búsqueda por teléfono se hace con una Cloud Function que devuelve únicamente el nombre a medias, no con lectura directa de `docentes`.
- `recursos` y los PDF en Storage: lectura para quien tenga un código de taller válido (o para todos los docentes, a decidir); escritura **solo** para la técnica.
- Fotos con `aprobada == false`: visibles solo para la técnica.
- Fotos de estudiantes en Storage privado, sin enlaces públicos.
- Limitar la frecuencia de escritura (App Check y límites en las Functions) para evitar abusos del registro sin cuenta.
- Reducir las fotos en el navegador antes de subirlas (máximo unos 1600 px de ancho, JPEG al 80 %).

## Fases sugeridas

1. Estructura del módulo, rutas, tema visual y configuración de Firebase.
2. Vista del docente: Registro → Inicio (con datos reales de un taller).
3. Subida de PDF por la técnica + Recursos del docente.
4. Fotos (con aprobación) y Encuesta con certificado en PDF.
5. Planificar (formulario, Word, envío a la técnica).
6. Panel de la técnica: talleres, asistencia, aprobación de fotos, evidencias.
7. Docentes, visitas, observaciones, compromisos, calendario e informes.
8. Pantallas para proyectar (juegos, ruleta, temporizador, muro) y PWA.

## Datos que faltan (dejarlos configurables)

- Nombre de la institución o distrito y logo para el certificado.
- Lista de centros educativos.
- Títulos reales de los libros y unidades de 4.º, 5.º y 6.º.
- Formato oficial de planificación del distrito, si existe.
