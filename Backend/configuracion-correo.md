# Configuración de correo y agenda de visitas (Microsoft Graph + SMTP)

Runbook paso a paso para dejar operativa la feature **agendamiento de visitas**
(`feature/agendamiento-visitas`, commit `923b31d`):

- Crear el evento de visita en un calendario de **Microsoft 365** vía
  **Microsoft Graph**.
- Enviar los correos transaccionales (confirmación al cliente, aviso interno al
  equipo comercial, CV de postulaciones a RR. HH.).

> Con Microsoft **no se usan "contraseñas de aplicación"** como en Gmail. El
> calendario se integra con un **registro de app en Entra ID** (OAuth2
> client-credentials). El correo puede ir por **SMTP** (usuario/contraseña del
> buzón) o —recomendado— también por **Graph**.

---

## 0. Cómo se comporta el backend según la config

El backend arranca siempre; elige implementación real o *stub* según la config:

| Sección | Real si… | Si no (stub) |
|---|---|---|
| `Graph` | `TenantId`, `ClientId`, `ClientSecret` y `MailboxVisitas` con valor real (≠ vacío / `CHANGE_ME`) → `GraphAgendaService` | `AgendaLogService`: solo escribe el evento en el log, el flujo responde 200 igual |
| `Correo` | `Correo:Host` con valor real → `SmtpCorreoService` | `CorreoLogService`: solo loguea el correo |
| `Notificaciones` | `CorreoVisitas` / `CorreoPostulaciones` con valor real → se envía el aviso interno | se salta el envío y deja un `warning` en el log |

Esto permite probar el formulario end-to-end **antes** de tener el registro de
Azure. La ruta pública es `POST /api/visitas` (sin auth, con rate limit por IP).

---

## 1. Confirmar quién hospeda el correo del dominio

Necesario para saber si aplica Graph / SMTP de Microsoft 365. Cualquiera sirve:

**a) Página de login del webmail.** Entrar por el navegador:
- Redirige a `login.microsoftonline.com` / `outlook.office365.com` → **Microsoft 365**.
- Redirige a `accounts.google.com` → Google Workspace (este runbook no aplica).

**b) Registros MX del dominio:**
```bash
nslookup -type=mx tudominio.com
```
- `...mail.protection.outlook.com` → **Microsoft 365**.

**c) Herramienta de Microsoft** (abrir con el correo real):
```
https://login.microsoftonline.com/getuserrealm.srf?login=TU_CORREO@tudominio.com&xml=1
```
`NameSpaceType="Managed"` → es Microsoft 365.

> La cuenta que organiza las visitas debe tener **licencia de Exchange Online**
> (buzón real). Una cuenta personal `@outlook.com` **no** sirve para el flujo
> app-only de calendario.

---

## 2. PASO A PASO — Registro de aplicación en Microsoft Entra ID

Requiere una cuenta con rol **Administrador de aplicaciones** / **Administrador
global** en el tenant (para el "grant admin consent" del paso 2.4).

### 2.1 Crear el registro

1. [Portal de Entra](https://entra.microsoft.com) → **Identidad → Aplicaciones →
   Registros de aplicaciones → Nuevo registro**.
2. Nombre: `portal-inmobiliario-agenda` (o el que quieras).
3. Tipos de cuenta admitidos: **Solo cuentas de este directorio organizativo
   (un solo inquilino)**.
4. URI de redirección: **dejar vacío** (es app-only, no hay login de usuario).
5. **Registrar**.

### 2.2 Copiar los identificadores

En **Información general** del registro:
- **Id. de aplicación (cliente)** → será `Graph:ClientId`.
- **Id. de directorio (inquilino)** → será `Graph:TenantId`.

### 2.3 Crear el secreto de cliente

1. **Certificados y secretos → Secretos de cliente → Nuevo secreto de cliente**.
2. Descripción `portal-agenda` y vencimiento (recomendado 12–24 meses; anotar la
   fecha para rotarlo).
3. **Agregar** → copiar de inmediato la columna **Valor** (solo se muestra una
   vez) → será `Graph:ClientSecret`.

### 2.4 Permisos de API + consentimiento de administrador

1. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de
   aplicación** (NO delegados).
2. Agregar:
   - `Calendars.ReadWrite` — crear el evento de visita. **(obligatorio)**
   - `Mail.Send` — solo si se enviará el correo por Graph (ver sección 4).
3. **Conceder consentimiento de administrador para \<tenant\>** → el estado de
   cada permiso debe quedar en **Concedido**.

### 2.5 Buzón organizador de las visitas

Elegir el buzón donde caerán los eventos (`Graph:MailboxVisitas`), por su UPN:
- Un buzón de usuario con licencia (p. ej. `visitas@tudominio.com`), **o**
- Un buzón compartido (no consume licencia), **o**
- Un buzón de sala.

### 2.6 (Recomendado) Restringir el acceso del app a ese único buzón

Con `Calendars.ReadWrite` de aplicación, el registro puede escribir en el
calendario de **cualquier** buzón del tenant. Para limitarlo al buzón de visitas,
crear una **Application Access Policy** en Exchange Online PowerShell:

```powershell
# 1. Grupo de correo-seguridad con solo el buzón de visitas como miembro
New-DistributionGroup -Name "sg-portal-agenda" -Type security `
  -Members visitas@tudominio.com

# 2. Política que ata el AppId (Graph:ClientId) a ese grupo
New-ApplicationAccessPolicy -AppId <GRAPH_CLIENT_ID> `
  -PolicyScopeGroupId sg-portal-agenda -AccessRight RestrictAccess `
  -Description "Portal inmobiliario: solo buzón de agenda"

# 3. Verificar
Test-ApplicationAccessPolicy -Identity visitas@tudominio.com -AppId <GRAPH_CLIENT_ID>
```

---

## 3. PASO A PASO — Configurar la aplicación

Los valores reales **nunca** van en `appsettings.json` (lleva placeholders
`CHANGE_ME` y está versionado). Van en `appsettings.Production.json` /
`appsettings.Staging.json` (gitignored) o en variables de entorno.

### 3.1 appsettings.\<Entorno\>.json

```jsonc
{
  "Graph": {
    "TenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "ClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "ClientSecret": "el-Valor-del-secreto",
    "MailboxVisitas": "visitas@tudominio.com",
    "ZonaHoraria": "America/Bogota"
  },
  "Notificaciones": {
    "CorreoPostulaciones": "rrhh@tudominio.com",
    "CorreoVisitas": "comercial@tudominio.com"
  },
  "Correo": {
    "Host": "smtp.office365.com",
    "Puerto": 587,
    "Usuario": "visitas@tudominio.com",
    "Password": "la-contraseña-del-buzón",
    "UsarSsl": true,
    "RemitenteNombre": "Urbanos & Rurales",
    "RemitenteCorreo": "visitas@tudominio.com"
  }
}
```

### 3.2 Variables de entorno (docker-compose / VPS)

`docker-compose.yml` ya expone las de Graph y Notificaciones; se alimentan desde
un `.env` junto al compose:

```dotenv
GRAPH_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CLIENT_SECRET=el-Valor-del-secreto
GRAPH_MAILBOX_VISITAS=visitas@tudominio.com
RRHH_EMAIL=rrhh@tudominio.com
VISITAS_EMAIL=comercial@tudominio.com
```

> **Pendiente de infra:** `docker-compose.yml` **no** trae todavía variables
> `Correo__*` para el SMTP. Si el correo va por SMTP en el contenedor, agregar al
> bloque `environment` del servicio `api`:
> ```yaml
>       Correo__Host: "${SMTP_HOST:-}"
>       Correo__Puerto: "${SMTP_PORT:-587}"
>       Correo__Usuario: "${SMTP_USER:-}"
>       Correo__Password: "${SMTP_PASS:-}"
>       Correo__UsarSsl: "true"
>       Correo__RemitenteNombre: "Urbanos & Rurales"
>       Correo__RemitenteCorreo: "${SMTP_FROM:-}"
> ```
> (los `__` mapean a la sección `Correo:` de config). Sin esto, en el contenedor
> el correo cae al stub `CorreoLogService`.

### 3.3 Nombres de clave exactos

| Config (appsettings) | Env var | Notas |
|---|---|---|
| `Graph:TenantId` | `Graph__TenantId` | GUID del tenant |
| `Graph:ClientId` | `Graph__ClientId` | GUID de la app |
| `Graph:ClientSecret` | `Graph__ClientSecret` | el *Value* del secreto |
| `Graph:MailboxVisitas` | `Graph__MailboxVisitas` | UPN del buzón organizador |
| `Graph:ZonaHoraria` | `Graph__ZonaHoraria` | IANA, default `America/Bogota` |
| `Notificaciones:CorreoVisitas` | `Notificaciones__CorreoVisitas` | aviso interno de visitas |
| `Notificaciones:CorreoPostulaciones` | `Notificaciones__CorreoPostulaciones` | CV de postulaciones |
| `Correo:Host` | `Correo__Host` | `smtp.office365.com` para M365 |
| `Correo:Puerto` | `Correo__Puerto` | `587` (STARTTLS) |
| `Correo:Usuario` / `Correo:Password` | `Correo__Usuario` / `Correo__Password` | credenciales del buzón |
| `Correo:RemitenteCorreo` | `Correo__RemitenteCorreo` | debe ser un buzón/alias con permiso de envío |

---

## 4. SMTP — validar y decidir

### 4.1 ¿SMTP o Graph para el correo?

| | SMTP (`SmtpCorreoService`, ya implementado) | Graph `sendMail` (falta implementar) |
|---|---|---|
| Credencial | usuario + contraseña del buzón | mismo `ClientId`/`Secret` + permiso `Mail.Send` |
| Requisito en M365 | **SMTP AUTH habilitado** para el buzón; el buzón **sin MFA** (o el basic auth falla) | consentimiento de admin a `Mail.Send` |
| Contraseña almacenada | sí (riesgo) | no |
| Futuro | Microsoft está **retirando** la auth básica de SMTP | camino soportado y estable |
| Esfuerzo | 0 (ya está) | implementar `ICorreoService` sobre Graph |

**Recomendación:** como el registro de Entra ya se crea para el calendario,
enviar también el correo por Graph (agregar `Mail.Send`). Requiere un cambio
pequeño de código (nueva implementación de `ICorreoService`). Mientras tanto,
SMTP sirve para no bloquear.

### 4.2 Habilitar SMTP AUTH en Microsoft 365 (si se usa SMTP)

1. [Centro de administración de Microsoft 365](https://admin.microsoft.com) →
   **Usuarios → Usuarios activos → \<el buzón\> → Correo →
   Administrar aplicaciones de correo electrónico**.
2. Marcar **SMTP autenticado** → **Guardar cambios**.
3. Si a nivel de organización está desactivado, un admin lo habilita con
   Exchange Online PowerShell:
   ```powershell
   Set-TransportConfig -SmtpClientAuthenticationDisabled $false            # organización
   Set-CASMailbox -Identity visitas@tudominio.com -SmtpClientAuthenticationDisabled $false  # por buzón
   ```

### 4.3 Probar las credenciales SMTP antes de configurarlas

```bash
printf 'From: visitas@tudominio.com\nTo: visitas@tudominio.com\nSubject: prueba portal\n\nhola\n' > /tmp/mail.txt

curl -v --url 'smtp://smtp.office365.com:587' --ssl-reqd \
  --mail-from 'visitas@tudominio.com' --mail-rcpt 'visitas@tudominio.com' \
  --user 'visitas@tudominio.com:LA_PASSWORD' -T /tmp/mail.txt
```

- Llega el correo → SMTP AUTH activo, se puede usar la sección `Correo` tal cual.
- `535 5.7.139 ... basic authentication is disabled` → SMTP AUTH deshabilitado o
  el buzón tiene MFA. Habilitarlo (4.2) o irse por Graph.

---

## 5. Verificación end-to-end

1. **Arranque:** revisar el log al iniciar. Con `Graph` real, la primera visita
   pide token a `login.microsoftonline.com`; con stub, el log lo dice explícito.
2. **Reglas de slot** (validadas en `AgendarVisitaCommand`):
   - Lun–Vie 08:00–18:00, Sáb 09:00–13:00, Dom no se atiende.
   - Franjas de 1 hora en punto (`"HH:mm"` = inicio del slot).
   - Antelación mínima **3 horas**; máximo **60 días** adelante.
   - `aceptoTratamientoDatos` debe ser `true` (RNF-061).
   - `sitio` es honeypot: si viene lleno, se descarta como spam.
3. **Petición de prueba** (elegir fecha/hora válidas):
   ```bash
   curl -i -X POST http://localhost:8080/api/visitas \
     -H 'Content-Type: application/json' \
     -d '{
       "inmuebleId": 1,
       "nombre": "Prueba QA",
       "correo": "tucorreo@ejemplo.com",
       "telefono": "3001234567",
       "fecha": "2026-09-15",
       "franja": "10:00",
       "mensaje": "Solicitud de prueba",
       "aceptoTratamientoDatos": true,
       "sitio": null
     }'
   ```
   Espera `200 OK`. `400` → el body dice el motivo (slot inválido, etc.).
4. **Comprobaciones:**
   - El evento aparece en el calendario de `MailboxVisitas` (Outlook web) con el
     cliente como asistente y la dirección exacta en la ubicación.
   - El cliente recibe la confirmación; `Notificaciones:CorreoVisitas` recibe el
     aviso interno (con la dirección y el estado de la agenda).
   - En el CRM queda un lead `formulario_inmueble` como rastro.
5. **Postulaciones** (mismo canal de correo): crear una postulación con CV y
   confirmar que `Notificaciones:CorreoPostulaciones` recibe el PDF adjunto.

---

## 6. Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| Log: "usando AgendaLogService" y no se crea el evento | falta algún `Graph:*` o quedó en `CHANGE_ME` | completar los 4 valores y reiniciar |
| `401` al pedir token / `invalid_client` | `ClientSecret` mal copiado o vencido | regenerar secreto (2.3) y actualizar config |
| `403 ErrorAccessDenied` al crear el evento | falta consentimiento de admin, o la Application Access Policy (2.6) excluye el buzón | conceder consentimiento a `Calendars.ReadWrite`; revisar `Test-ApplicationAccessPolicy` |
| `404` "mailbox not found" / "The specified object was not found" | `MailboxVisitas` no es un UPN válido o el buzón no tiene licencia de Exchange | usar el UPN real de un buzón con Exchange Online |
| Evento creado con hora corrida | `Graph:ZonaHoraria` distinta de la del payload | dejar `America/Bogota` en ambos |
| `AADSTS700016` "application not found in directory" | `TenantId` o `ClientId` cruzados/incorrectos | verificar contra **Información general** del registro |
| Correo: log "CorreoLogService" | `Correo:Host` en `CHANGE_ME`, o falta `Correo__*` en compose | configurar la sección `Correo` (3.1 / 3.2) |
| SMTP `535 5.7.139` | SMTP AUTH deshabilitado o buzón con MFA | habilitar SMTP AUTH (4.2) o migrar a Graph `sendMail` |
| SMTP `550 5.7.60` "not allowed to send as" | `RemitenteCorreo` ≠ buzón autenticado y sin permiso *Send As* | usar el mismo buzón como remitente o dar *Send As* |
| Aviso interno no llega, log `warning` "CorreoVisitas sin configurar" | falta `Notificaciones:CorreoVisitas` | configurarlo |

---

## 7. Estado / pendientes

- [ ] Confirmar que el dominio está en Microsoft 365 (sección 1).
- [ ] Crear el registro de app en Entra ID y llenar `Graph:*` en el entorno.
- [ ] Conceder consentimiento de admin a `Calendars.ReadWrite`.
- [ ] Definir el buzón `MailboxVisitas` (con licencia de Exchange).
- [ ] (Recomendado) Application Access Policy para acotar el acceso al buzón.
- [ ] Decidir SMTP vs Graph para el correo:
  - [ ] SMTP: habilitar SMTP AUTH + agregar variables `Correo__*` al compose.
  - [ ] Graph: agregar permiso `Mail.Send` + implementar `ICorreoService` sobre
        Graph `sendMail`.
- [ ] Llenar `Notificaciones:CorreoVisitas` y `Notificaciones:CorreoPostulaciones`.
- [ ] Prueba end-to-end (sección 5) en staging.
