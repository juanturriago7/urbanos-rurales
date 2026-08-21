# Spec 07 — Página "Quiénes somos" + "Trabaja con nosotros"

**Requerimientos originales cubiertos:**
- "En quiénes somos, no es una sección, debe ser una página nueva; ahí se
  profundiza, debe tener el template para ponerle visión, misión."
- "Al finalizar el quiénes somos, se puede hacer una sección de trabaja con
  nosotros, donde haya una parte para cargar la hoja de vida, como en la página de
  urbanosrurales." (ver nota sobre esta referencia en `00-overview.md` — no se tuvo
  acceso a esa página al escribir esta spec.)

**Depende de:** nada. **Migración propia:** sí, tabla nueva
(`postulaciones_laborales`) — sin solapamiento con otras tablas del lote.

## Objetivo

Hoy "Quiénes somos" es una sección ancla dentro de `HomePage.tsx`
(`id="quienes-somos"`, resuelta vía `AnchorLink` desde el nav). Pasa a ser una
página propia (`/quienes-somos` o `/nosotros` — a definir, ver "Preguntas
abiertas") con más profundidad de contenido, incluyendo bloques de Visión y Misión
como *template* (estructura y copy de relleno, listos para que el cliente los
llene con el contenido real — no se está pidiendo redactar la visión/misión real de
la empresa en esta spec). Al final de esa página va una sección "Trabaja con
Nosotros" con un formulario que permite adjuntar hoja de vida.

## Frontend — página institucional

**Crear:**
- `features/public/institucional/pages/QuienesSomosPage.tsx` — página completa,
  reutilizando el contenido/copy que hoy vive en la sección `id="quienes-somos"` de
  `HomePage.tsx` como punto de partida, mas los bloques nuevos:
  - Header de página (breadcrumb o hero corto, consistente con el resto del sitio).
  - Bloque "Quiénes somos" (contenido actual, ampliado).
  - Bloque "Misión" (template: encabezado + párrafo placeholder, ej. "Nuestra
    misión es [completar]" — visualmente terminado, listo para reemplazar el texto).
  - Bloque "Visión" (mismo tratamiento).
  - Bloque "Trabaja con Nosotros" (ver siguiente sección).
- `features/public/institucional/components/FormularioTrabajaConNosotros.tsx`.

**Modificar:**
- `app/layouts/public/navItems.ts` — el item `{ label: 'Quiénes somos', to: '/',
  anchor: 'quienes-somos' }` pasa a `{ label: 'Quiénes somos', to: '/quienes-somos' }`
  (sin `anchor` — ruta propia, ya no scroll).
- `app/router/index.tsx` — agregar `{ path: 'quienes-somos', element:
  <QuienesSomosPage /> }` bajo `PublicLayout`.
- `features/public/properties/pages/HomePage.tsx` — la sección `id="quienes-somos"`
  actual se recomienda **condensar a un teaser corto con CTA** ("Conócenos más →
  /quienes-somos") en vez de eliminarla del todo, para no vaciar de golpe el home;
  ver "Preguntas abiertas" si el cliente prefiere quitarla del home por completo.

## Modelo de datos — Trabaja con Nosotros

**Migración `CrearPostulacionesLaborales`:**

```sql
CREATE TABLE postulaciones_laborales (
    id                  BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    correo              VARCHAR(150) NOT NULL,
    telefono            VARCHAR(30),
    cargo_interes       VARCHAR(120),
    mensaje             TEXT,
    cv_storage_key      TEXT NOT NULL,
    cv_url              TEXT NOT NULL,
    ip_origen           INET,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_postulaciones_creado_en ON postulaciones_laborales(creado_en);
```

Mismo criterio que `leads` (no hay borrado lógico, no hay estado — es una bandeja de
entrada simple; agregar workflow de estados es una mejora futura si el volumen lo
justifica).

## Backend

**Crear:**
- `Portal.Domain/Entities/PostulacionLaboral.cs`.
- `Portal.Infrastructure/Persistence/Configurations/PostulacionLaboralConfiguration.cs`.
- `Portal.Application/Interfaces/IPostulacionLaboralRepository.cs` +
  `Portal.Infrastructure/Repositories/PostulacionLaboralRepository.cs`.
- `Portal.Application/Features/Postulaciones/Commands/GenerarUrlSubidaCv/*` —
  reutiliza `IAlmacenamientoObjetos` (mismo puerto que usan imágenes de inmueble y,
  tras la spec 06, portadas de blog), con `storageKey =
  $"postulaciones/{Guid.NewGuid():N}.{ext}"`. **Restringir el `contentType`
  aceptado a `application/pdf` en el handler** (a diferencia de imágenes, aquí
  claramente solo tiene sentido PDF/Word — recomendado limitar a
  `application/pdf` únicamente para v1, más simple de validar y de previsualizar
  después).
- `Portal.Application/Features/Postulaciones/Commands/CrearPostulacion/*` — recibe
  `{ Nombre, Correo, Telefono?, CargoInteres?, Mensaje?, CvStorageKey }`, confirma
  que el objeto exista en el bucket (mismo patrón que `RegistrarImagenCommand`),
  arma `CvUrl` vía `IAlmacenamientoObjetos.ConstruirUrlPublica(...)`, persiste.
- `Portal.Api/Controllers/PostulacionesController.cs` — público,
  `[AllowAnonymous]`, base `/api/postulaciones`: `POST /presign-cv`, `POST /`.
  Aplicar el mismo criterio de anti-spam que ya se documentó como pendiente para
  `leads` en `Task/BackEnd/03-backlog-backend.md` (rate limit por IP como mínimo;
  reCAPTCHA/honeypot si ya existe una implementación reutilizable de leads al
  momento de construir esto — si no, un honeypot simple es suficiente para v1).

**No se incluye, a propósito, un `AdminPostulacionesController`/panel de listado**
en el alcance base de esta spec: el propio panel de leads (`/admin/leads`) hoy es
solo un `<div>Leads</div>` placeholder en el router — construir un admin de
postulaciones completo antes de que exista uno de leads sería invertir el orden de
prioridad del propio backlog. Ver "Fuera de alcance".

## Frontend — formulario

`FormularioTrabajaConNosotros.tsx`:
- Campos: nombre, correo, teléfono (opcional), cargo de interés (opcional),
  mensaje (opcional, textarea corto), archivo de hoja de vida (input file,
  `accept="application/pdf"`, límite de tamaño razonable — ej. 5 MB, validar
  client-side antes de pedir la URL prefirmada).
- Flujo de subida: idéntico en estructura a `subirImagen()` en
  `features/admin/properties/api/imagenesApi.ts` — `presignCv(nombreArchivo,
  contentType)` → `fetch(urlSubida, { method: 'PUT', ... })` directo al storage,
  **no** vía `apiClient` → `crearPostulacion({...datos, cvStorageKey})`. La
  diferencia clave frente al flujo de imágenes: este es un formulario público sin
  sesión, así que el endpoint de presign también debe ser `[AllowAnonymous]` (a
  diferencia de `AdminImagenesController`) — mismo mecanismo, distinta superficie
  de autorización.
- Checkbox de tratamiento de datos, **no premarcado** (mismo criterio ya aplicado
  al formulario de contacto de inmueble, RNF-061).
- Mensaje de confirmación tras enviar (sin redirigir a otra página — mismo patrón
  de UX que se espera de un formulario de contacto corto).

## Criterios de aceptación

- [ ] `/quienes-somos` es una ruta propia, accesible desde el nav, con bloques de
      Misión y Visión visiblemente presentes (aunque el copy sea de relleno).
- [ ] Al final de esa página existe el formulario de "Trabaja con Nosotros".
- [ ] Enviar el formulario con un PDF adjunto crea una fila en
      `postulaciones_laborales` con `cv_url` apuntando a un objeto real y
      descargable en el bucket.
- [ ] Intentar subir un archivo que no sea PDF es rechazado antes de gastar una URL
      prefirmada (validación client-side) y también en el backend si se salta la UI.
- [ ] El checkbox de tratamiento de datos nunca llega premarcado.

## Preguntas abiertas

- ¿La ruta debe ser `/quienes-somos` o `/nosotros`? Cualquiera es razonable; se deja
  a criterio de quien implemente salvo indicación del cliente.
- ¿La sección "Quiénes somos" actual del home se condensa a teaser (recomendado,
  ver arriba) o se elimina del home por completo? Afecta solo a `HomePage.tsx`, sin
  impacto en el resto de esta spec.
- No hubo acceso a "la página de urbanosrurales" mencionada como referencia visual
  para el formulario de hoja de vida — si el cliente puede compartir capturas o el
  link exacto, el formulario descrito arriba cubre la funcionalidad esperada
  (nombre, contacto, adjuntar CV) pero no está validado contra su diseño real.

## Fuera de alcance

- Panel admin de postulaciones (bandeja de entrada) — se reevalúa junto con el
  panel de leads, hoy también pendiente.
- Notificación automática por correo al recibir una postulación (mismo backlog
  pendiente que "Notificación al crear lead" en `Task/BackEnd/03-backlog-backend.md`
  — si ya existe esa infraestructura de notificación al momento de implementar,
  reutilizarla aquí es trivial; si no, no bloquea esta spec).
- Estados de postulación (revisada, descartada, contactado).
