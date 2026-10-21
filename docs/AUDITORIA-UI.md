# Auditoría de UI — MedApp

Fecha: 21/10/2026 · Rama: `feat/ui-paciente-3d`

Alcance: `PartePaciente/paciente-app` (turnero público) y `ParteAdmin/Frontend` (panel administrativo).
Cada hallazgo indica severidad (**Alta** = rompe una función o la accesibilidad, **Media** = confunde o se ve descuidado, **Baja** = pulido) y si quedó **resuelto en esta rama** o **pendiente**.

---

## 1. Turnero del paciente

### Funcionalidad y bugs

| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| P1 | El botón de menú en mobile (`Navbar`) no tenía `onClick`: en celular no había forma de navegar a Médicos o Cómo funciona. | Alta | Resuelto: menú desplegable con `aria-expanded`/`aria-controls`. |
| P2 | La línea de progreso del wizard (`ReservaPage`) no se veía: las barras usan `-z-10` sin un contexto de apilamiento propio y quedaban detrás del fondo. | Media | Resuelto: `isolate` en el contenedor. |
| P3 | "Reservar" en la página Médicos llevaba al paso 1 sin recordar el profesional elegido. | Media | Resuelto: preselecciona especialidad y médico y abre el paso 3 (fecha y hora). |
| P4 | `fetchApi` hacía `console.log` de cada URL en producción. | Baja | Resuelto. |
| P5 | `index.html` declaraba `lang="en"` y un favicon inexistente (`/vite.svg`). | Media | Resuelto: `lang="es"`, `/favicon.svg`, meta description y `theme-color`. |

### Contenido mostrado al paciente

| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| P6 | El paso 2 mostraba datos inventados en `medicos.service`: "Lunes a Viernes" para todos los médicos y la bio "Profesional de excelencia en nuestra clínica." | Alta | Resuelto: se quitaron. Los días reales ya los muestra el paso 3 (`/disponibilidad/:id/dias`). |
| P7 | Los avatares se pedían a `ui-avatars.com` enviando el nombre del profesional a un tercero (y con colores al azar). | Media | Resuelto: componente `Avatar` local con iniciales. |
| P8 | Copy genérico de marketing ("Los mejores especialistas", "¿Listo para cuidar tu salud?") y el badge "Nuevo portal de pacientes". | Baja | Resuelto: copy concreto sobre lo que hace el sistema (correo, WhatsApp, horarios libres). |
| P9 | El hero tenía una foto de Unsplash con hotlink y un "mockup" de tarjetas grises vacías. | Media | Resuelto: escena 3D propia (ver §3). |

### Accesibilidad

| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| P10 | Los `<label>` del formulario (paso 4) no estaban asociados a sus inputs; tampoco tenían `autocomplete`. | Alta | Resuelto: `htmlFor`/`id` y `autocomplete` (given-name, family-name, tel-national, email). El error de envío se anuncia con `role="alert"`. |
| P11 | No había estilo de foco visible para navegar con teclado. | Alta | Resuelto: `:focus-visible` con contorno ámbar. |
| P12 | No se respetaba `prefers-reduced-motion`. | Media | Resuelto, de forma global y en la escena 3D. |
| P13 | Etiquetas en mayúsculas con tracking amplio en el resumen del turno. | Baja | Resuelto: tipografía normal. |

### Pendientes (paciente)

- **Paso 3 / días:** la tira de 14 días se desplaza en horizontal sin indicarlo; en mobile conviene agregar un degradado o flechas en el borde.
- **Paso 5:** el ícono con `animate-bounce` rebota sin parar. Alcanza con una sola animación de confirmación.
- **Estados de error:** `getEspecialidades` y `getMedicosByEspecialidad` devuelven `[]` cuando falla la red, y la UI muestra "No hay médicos disponibles". Conviene distinguir "error de conexión" de "vacío" (la búsqueda flotante y la página Médicos ya lo hacen).
- `ReservaContext` no persiste el estado: si se recarga `/reserva` en el paso 3, se pierde la selección. Se puede guardar en `sessionStorage`.

---

## 2. Panel administrativo

### Funcionalidad y bugs

| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| A1 | El botón "Ver agenda" del Dashboard no hacía nada. | Media | Resuelto: ahora es un `Link` a `/agenda`. |
| A2 | Las páginas usan `animate-in fade-in` (sintaxis de `tailwindcss-animate`), pero ese plugin no está instalado: las clases no hacían nada. | Baja | Resuelto: keyframe propio en `index.css`. |
| A3 | El botón Editar de la tabla de pacientes tiene `opacity-0` hasta el hover: en tablet o celular nunca se ve. | Alta | Resuelto: solo se oculta en dispositivos con hover; tiene `aria-label`. |
| A4 | Los modales (nuevo turno, cambiar estado, paciente) no cierran con Escape ni declaran `role="dialog"`. | Media | Resuelto: hook `useEscape`, `role="dialog"`, `aria-modal` y `aria-label` en la X. |
| A5 | 8 KPIs en una grilla de 5 columnas (`xl:grid-cols-5`): en pantallas grandes quedan 3 tarjetas sueltas en la segunda fila. | Baja | Resuelto: 4 columnas (2 filas parejas). |
| A6 | Sin foco visible para teclado. | Alta | Resuelto: `:focus-visible` global. |
| A7 | "¿Olvidaste tu contraseña?" apunta a `#`. | Media | **Pendiente**: implementar `supabase.auth.resetPasswordForEmail` o quitar el enlace. |
| A8 | La tarjeta "Actividad reciente" es un placeholder permanente. | Media | **Pendiente**: llenarla (por ejemplo, con los últimos turnos creados o cancelados vía `historial`) o quitarla. |

### Diseño (pendientes, no se tocaron para no alterar las capturas de la tesis)

- **El rojo como acento choca con la semántica de estados.** `#E53935` se usa en la marca, los botones primarios y el ítem activo del menú, y el estado *cancelado* también es rojo. En la agenda, "rojo" debería significar una sola cosa. Propuesta: un acento neutro-cálido o el mismo aqua/petróleo del turnero, y reservar el rojo para errores y cancelaciones.
- **Colores hardcodeados.** `index.css` define tokens (`--color-accent`, `--color-surface-*`), pero los componentes usan `bg-[#1a1a1a]`, `text-[#E53935]` y `text-gray-400` directamente (182 ocurrencias de colores hex arbitrarios en los `.tsx`). Pasar a `bg-surface-elevated`, `text-accent`, etc. permite cambiar el tema en un solo lugar.
- **`font-[var(--font-display)]`** se repite en cada título; Tailwind v4 ya genera la clase `font-display` a partir del token.
- **TimeGrid:** textos de 8–9 px (`text-[8px]`, `text-[9px]`) ilegibles; el mínimo razonable es 11–12 px. El estado se repite en el texto y en el color: se puede dejar solo el color más un ícono o una inicial.
- **Marca inconsistente:** el login dice "blenexIA" y "Plataforma SaaS multi-tenant", el sidebar dice "MedApp" y el turnero "MedAPP". Conviene unificar el nombre y escribir el copy para la recepcionista, no para un inversor.
- **Etiquetas en mayúsculas** (KPIs, cabecera de la tabla, rol en el sidebar): pasarlas a sentence case mejora la lectura.
- El `<select>` nativo de profesionales en la agenda se ve con el estilo del sistema operativo sobre el tema oscuro.
- Lint: `useAgenda.ts` llama a `setState` de forma sincrónica dentro de un efecto (advertencia de oxlint que ya existía).

---

## 3. Qué se agregó al turnero

**Dirección visual.** Paleta petróleo `#0B3B42`, aqua `#129E8A`/`#0B8273` para "libre" y ámbar `#F4B740` para "tu turno", sobre un fondo `#F3F6F5`. Títulos en Bricolage Grotesque y texto en Atkinson Hyperlegible Next, una tipografía diseñada para máxima legibilidad (pensando en pacientes mayores). Los tokens `brand-*` se redefinieron en `@theme`, así que todos los componentes heredan la paleta sin cambiar clases.

**Escena 3D del hero** (`components/home/three/`):
- three.js r186: un `InstancedMesh` de 42 cápsulas (7 días × 6 horarios), un solo draw call.
- Las cápsulas se elevan y se aclaran cerca del puntero, la grilla gira con parallax y la de "tu turno" late en ámbar. Al tocar una cápsula libre, el turno se muda ahí y un texto en `aria-live` lo anuncia ("Elegiste el jueves a las 11:30…").
- Se carga con `React.lazy`: three.js va en un chunk aparte (~135 kB gzip) y no frena la primera pintura.
- Se pausa fuera de pantalla (`IntersectionObserver`), hace un render estático con `prefers-reduced-motion`, libera la memoria de GPU al desmontar y, si no hay WebGL, el hero sigue funcionando sin la escena.

**Tarjetas de especialidades con inclinación 3D** (`components/ui/TiltCard.tsx`): se inclinan siguiendo al puntero, con el ícono en `translateZ` y un brillo que sigue al cursor. Solo se activan con mouse o trackpad y sin reduced-motion.

**Búsqueda** (`components/search/BusquedaPalette.tsx`):
- Se abre con la lupa de la navbar flotante (en todas las páginas), `⌘K`/`Ctrl+K`, `/` o el botón del hero.
- Busca especialidades y médicos sin distinguir tildes ("pediatria" encuentra "Pediatría") y muestra cuántos profesionales tiene cada especialidad.
- Teclado completo: ↑ ↓ Enter Esc, patrón combobox/listbox con `aria-activedescendant`, foco atrapado en el diálogo y devuelto al cerrar.
- Al elegir una especialidad abre el paso 2; al elegir un médico abre directamente el paso 3 con sus horarios.
- En mobile se abre como hoja desde abajo.
- Los datos se piden recién la primera vez que se abre.

---

## 4. Skills

Las cuatro skills pedidas ya figuraban en `skills-lock.json` y en `.agents/skills/` (y se copiaron a `.claude/skills/`):

- **frontend-design:** guió la dirección visual (paleta, tipografía, una sola pieza memorable, copy).
- **threejs-geometry:** guió la escena (`CapsuleGeometry` con `heightSegments`, `InstancedMesh`, `setColorAt`, disposal).
- **banner-design:** está orientada a piezas sueltas (redes, publicidad). Se usó como referencia para el hero, sin su flujo de preguntas.
- **godot-3d-essentials:** es para el motor de juegos Godot. No aplica a una app React/Vite, así que no se usó.
