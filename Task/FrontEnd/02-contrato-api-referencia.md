## 2. Contrato de API de referencia (para mocks mientras Backend construye)

> Frontend puede construir sobre este contrato con datos simulados (JSON mock / MSW / json-server) mientras Backend implementa los endpoints reales. Confirmar con Backend cualquier ajuste de nombres de campos antes de integrar.

### 2.1 Endpoints públicos

| Endpoint | Método | Query params / Body | Propósito |
| --- | --- | --- | --- |
| `/api/inmuebles` | GET | `operacion`, `tipo`, `ubicacion_id`, `precio_min`, `precio_max`, `area_min`, `area_max`, `habitaciones`, `banos`, `parqueaderos`, `mascotas`, `estrato`, `admin_incluida`, `caracteristicas[]`, `q`, `orden`, `page` | Listado con filtros combinables (AND entre filtros, OR dentro de un mismo filtro) |
| `/api/inmuebles/{slug}` | GET | — | Detalle completo del inmueble |
| `/api/inmuebles/{id}/similares` | GET | — | Inmuebles similares (mismo barrio + rango de precio + tipo) |
| `/api/catalogos/ubicaciones` | GET | — | Árbol zona → localidad → upz → barrio |
| `/api/catalogos/tipos-inmueble` | GET | — | Lista de tipos (apartamento, casa, etc.) |
| `/api/catalogos/caracteristicas` | GET | — | Lista de características agrupadas por categoría, con bandera `filtrable` |
| `/api/leads` | POST | `nombre`, `correo`, `telefono`, `mensaje`, `inmueble_id?`, `origen`, `acepto_tratamiento_datos` | Captura de lead (general o por inmueble) |
| `/api/postulaciones/presign` | POST | `nombreArchivo`, `contentType` | URL prefirmada para subir la hoja de vida (PDF) |
| `/api/postulaciones` | POST | `nombre`, `correo`, `telefono?`, `cargoInteres?`, `mensaje?`, `cvStorageKey` | Crea la postulación; RR. HH. recibe el CV adjunto por correo |
| `/api/visitas` | POST | `inmuebleId`, `nombre`, `correo`, `telefono?`, `fecha` (yyyy-MM-dd), `franja` (HH:mm), `mensaje?`, `aceptoTratamientoDatos`, `sitio?` | Solicita visita a un inmueble → evento en agenda M365 + correos. Responde `{ agendada, inicioLocal }`. Franjas L–V 08–18 / Sáb 09–13, 1 h, ≥3 h de antelación |
| `/api/sitemap.xml` | GET | — | Sitemap dinámico |

### 2.2 Endpoints de autenticación y panel admin

| Endpoint | Método | Propósito |
| --- | --- | --- |
| `/api/auth/login` | POST | Login admin/asesor — responde `{ user, tokens: { accessToken, refreshToken, expiresIn } }` |
| `/api/auth/refresh` | POST | Rotación de tokens — body `{ refreshToken }`, responde `{ accessToken, refreshToken, expiresIn }` |
| `/api/auth/logout` | POST | Logout (revoca el refresh token; requiere sesión) |
| `/api/auth/recuperar-password` | POST | Solicitar token de recuperación (siempre 202) |
| `/api/auth/restablecer-password` | POST | Consumir token y fijar nueva contraseña — body `{ token, nuevaPassword }` |
| `/api/admin/inmuebles` | GET/POST | Listar (con filtro por estado) / crear inmueble |
| `/api/admin/inmuebles/{id}` | GET/PUT/DELETE | Ver / editar / borrado lógico |
| `/api/admin/inmuebles/{id}/imagenes` | POST/PUT/DELETE | Subir, reordenar, marcar portada, eliminar, editar alt |
| `/api/admin/inmuebles/{id}/operaciones` | POST/PUT | Precio, cuota admin y estado de venta/arriendo (independientes) |
| `/api/admin/leads` | GET/PUT | Listado, filtro por estado, asignación a asesor |

### 2.3 Ejemplo de shape de respuesta — tarjeta de listado

```json
{
  "id": 1234,
  "codigo_referencia": "INM-001234",
  "slug": "apartamento-arriendo-chapinero-bog-001234",
  "titulo": "Apartamento con vista en Chapinero",
  "tipo_inmueble": "apartamento",
  "ubicacion": { "barrio": "Chapinero Alto", "localidad": "Chapinero", "zona": "Norte" },
  "operaciones": [
    { "tipo": "arriendo", "precio": 2500000, "cuota_administracion": 300000, "admin_incluida": false }
  ],
  "area_construida_m2": 65,
  "habitaciones": 2,
  "banos": 2,
  "parqueaderos": 1,
  "estrato": 4,
  "politica_mascotas": "con_restricciones",
  "destacado": true,
  "imagen_portada": "https://cdn.example.com/inmuebles/1234/portada.webp"
}
```

### 2.4 Ejemplo de shape de respuesta — detalle de inmueble

```json
{
  "id": 1234,
  "codigo_referencia": "INM-001234",
  "titulo": "Apartamento con vista en Chapinero",
  "descripcion": "...",
  "tipo_inmueble": "apartamento",
  "ubicacion": { "barrio": "Chapinero Alto", "localidad": "Chapinero", "zona": "Norte" },
  "ubicacion_mapa": { "lat": 4.6567, "lng": -74.0565 },
  "operaciones": [
    { "tipo": "arriendo", "precio": 2500000, "cuota_administracion": 300000, "admin_incluida": false, "estado": "disponible" }
  ],
  "area_construida_m2": 65,
  "area_privada_m2": 58,
  "habitaciones": 2,
  "banos": 2,
  "parqueaderos": 1,
  "piso": 5,
  "pisos_edificio": 12,
  "estrato": 4,
  "antiguedad": "usado_menos_5",
  "orientacion": "oriente",
  "amoblado": "no",
  "politica_mascotas": "con_restricciones",
  "caracteristicas": [
    { "categoria": "Zonas comunes", "items": ["Piscina", "Gimnasio", "Salón social"] },
    { "categoria": "Interior", "items": ["Calentador", "Internet", "Closets: 3"] }
  ],
  "imagenes": [
    { "url_cdn": "https://cdn.example.com/inmuebles/1234/1.webp", "es_portada": true, "texto_alt": "Sala con vista" }
  ],
  "meta_titulo": "...",
  "meta_descripcion": "..."
}
```

