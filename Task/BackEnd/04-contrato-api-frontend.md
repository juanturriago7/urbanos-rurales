## 4. Contrato de API para Frontend (referencia de integración paralela)

> Frontend puede construir sobre este contrato con datos *mock* mientras Backend implementa los endpoints reales. Ajustar nombres según el framework elegido (REST/GraphQL).

| Endpoint | Método | Propósito |
| --- | --- | --- |
| `/api/inmuebles` | GET | Listado con filtros (query params: `operacion`, `tipo`, `ubicacion_id`, `precio_min`, `precio_max`, `area_min`, `area_max`, `habitaciones`, `banos`, `parqueaderos`, `mascotas`, `estrato`, `admin_incluida`, `q`, `orden`, `page`) |
| `/api/inmuebles/{slug}` | GET | Detalle completo del inmueble. Incluye `tiposParqueadero`: arreglo con cero o más de `privado`, `privado_uso_exclusivo`, `doble`, siempre en ese orden; vacío si no se indicó o si `parqueaderos` es 0 |
| `/api/inmuebles/{id}/similares` | GET | Inmuebles similares |
| `/api/catalogos/ubicaciones` | GET | Árbol zona → localidad → upz → barrio |
| `/api/catalogos/tipos-inmueble` | GET | Lista de tipos |
| `/api/catalogos/caracteristicas` | GET | Lista agrupada por categoría |
| `/api/leads` | POST | Captura de lead (general o por inmueble) |
| `/api/postulaciones/presign` | POST | URL prefirmada para subir la hoja de vida (PDF) — body `{ nombreArchivo, contentType }` |
| `/api/postulaciones` | POST | Crea la postulación con el `cvStorageKey` confirmado; notifica a RR. HH. con el CV adjunto |
| `/api/visitas` | POST | Solicita una visita a un inmueble — body `{ inmuebleId, nombre, correo, telefono?, fecha (yyyy-MM-dd), franja (HH:mm), mensaje?, aceptoTratamientoDatos, sitio? }`. Crea el evento en la agenda M365 y notifica por correo; responde `{ agendada, inicioLocal }`. Franjas: L–V 08–18, Sáb 09–13, slots de 1 h, ≥3 h de antelación. Si la franja ya tiene un evento en la agenda responde **409** `{ title: "Franja no disponible", detail }` |
| `/api/visitas/disponibilidad?fecha=yyyy-MM-dd` | GET | Franjas ya ocupadas del día (el calendario es único para todos los inmuebles) — responde `{ fecha, ocupadas: ["HH:mm", ...] }`. El frontend las oculta del selector. Sin agenda configurada responde `ocupadas: []`. Rate limit 30/min por IP |
| `/api/auth/login` | POST | Login admin — responde `{ user, tokens: { accessToken, refreshToken, expiresIn } }` |
| `/api/auth/refresh` | POST | Rotación de tokens — body `{ refreshToken }`, responde `{ accessToken, refreshToken, expiresIn }` |
| `/api/auth/logout` | POST | Logout (revoca el refresh token; requiere sesión) |
| `/api/auth/recuperar-password` | POST | Solicitar token de recuperación (siempre 202) |
| `/api/auth/restablecer-password` | POST | Consumir token y fijar nueva contraseña — body `{ token, nuevaPassword }` |
| `/api/admin/inmuebles` | GET/POST | CRUD listar/crear (requiere sesión). El body de POST acepta `tiposParqueadero` (opcional, selección múltiple de `privado`, `privado_uso_exclusivo`, `doble`). Responde **400** si hay un valor desconocido o repetido. Con `parqueaderos` = 0 se guarda vacío |
| `/api/admin/inmuebles/{id}` | GET/PUT/DELETE | CRUD ver/editar/borrado lógico. GET devuelve `tiposParqueadero`. PUT lo reemplaza con las mismas reglas que POST; si se omite, queda vacío |
| `/api/admin/inmuebles/{id}/imagenes` | POST/PUT/DELETE | Gestión de galería |
| `/api/admin/inmuebles/{id}/operaciones` | POST/PUT | Precio y estado de venta/arriendo |
| `/api/admin/inmuebles/{id}/destacado` | PUT | Marcar/quitar destacado — body `{ destacado }`. Máximo 3 destacados a la vez (solo publicados). Responde **400** `{ title: "Solicitud inválida", detail: "Máximo 3 inmuebles destacados. Quita uno para destacar otro." }` si no hay cupo, o `detail: "Solo los inmuebles publicados pueden destacarse."`. Pausar, archivar o eliminar un inmueble lo desmarca |
| `/api/admin/inmuebles/destacados/resumen` | GET | Cupo de destacados — responde `{ total, maximo }` (contador "X/3" del listado admin) |
| `/api/admin/leads` | GET/PUT | Gestión y asignación de leads |
| `/api/sitemap.xml` | GET | Sitemap dinámico |

