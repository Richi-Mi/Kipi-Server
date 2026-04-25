# Endpoints accesibles desde móvil (PWA / App) — Kipi Safe

Esta guía documenta **los endpoints HTTP que consume el cliente móvil** (PWA o app) y cómo usarlos.

## Estado actual del repositorio (importante)

- **Misma API para móvil y PWA**: el flujo de emparejamiento falla si ambos clientes no apuntan a la **misma** URL de API y por tanto a la **misma** instancia de Supabase. Resumen y checklist: **`docs/vinculacion.md`**.
- **PWA y variables `VITE_*`**: Vite está configurado con `envDir` en la **raíz del monorepo**, de modo que el mismo `.env` que usa la API puede definir `VITE_API_BASE_URL` para builds de la PWA.
- **JWT Supabase en la API**: en el código actual de `apps/api` **no** se valida `Authorization: Bearer` en las rutas parentales listadas abajo; el prototipo usa `parent_id` o `minor_id` en query/body. La autenticación que **sí** se exige hoy es **`Authorization: Device <api_key>`** en `/api/device/*` (salvo `RELAX_DEVICE_AUTH=1`).
- **Emparejamiento (`confirm-code`)**: si el `parent_id` aún no existe en `auth.users`, la API intenta crearlo con **Admin API** y luego hace `upsert` en `parents` (email sintético `parent-{uuid}@kipi-pairing.local`, racha y misiones en cero). Así el flujo demo/PWA no requiere SQL manual en Supabase.

## Cómo usar cada endpoint (resumen)

Usa siempre la misma **`{BASE_URL}`** en PWA, Android y pruebas (ver `docs/vinculacion.md`).

| Orden | Método | Ruta | Cliente típico | Auth en este prototipo | Qué enviar (mínimo) |
|------|--------|------|----------------|--------------------------|---------------------|
| — | `GET` | `/health` | Cualquiera | No | Opcional: `?check_db=1` |
| — | `GET` | `/api/dashboard` | PWA | No | Query `parent_id` (UUID) |
| — | `GET` | `/api/screen-time` | PWA | No | Query `minor_id` |
| — | `GET` | `/api/apps/recent` | PWA | No | Query `minor_id` |
| — | `GET` | `/api/devices` | PWA | No | Query `minor_id` |
| — | `GET` | `/api/ai/stats` | PWA | No | Query `parent_id` |
| — | `POST` | `/api/alerts/manual` | PWA | No | JSON: `minor_id`; opcionales `app_source`, `risk_level`, `description`, `is_manual_help` |
| — | `PATCH` | `/api/minors/agreement` | PWA | No | JSON: `minor_id`, `shared_alert_levels` |
| 1 | `POST` | `/api/pairing/generate-code` | Android / Postman | No | JSON opcional: `device_model`, `fcm_push_token` |
| 2 | `POST` | `/api/pairing/confirm-code` | PWA / Postman | No | JSON: `parent_id`, `otp` (6 chars) |
| 3 | `POST` | `/api/pairing/claim` | Android / Postman | No | JSON: `session_id`, `otp` |
| — | `POST` | `/api/notifications/analyze` | PWA (o servidor) | No | JSON: `minor_id`, `text_preview` (+ campos opcionales de riesgo/nube) |
| — | `GET` | `/api/gamification/streak` | PWA | No | Query `parent_id` |
| — | `GET` | `/api/gamification/missions` | PWA | No | Query `parent_id` |
| — | `POST` | `/api/gamification/missions/complete` | PWA | No | JSON: `parent_id`, `mission_id` |
| — | `POST` | `/api/assistant/chat` | PWA | No | JSON: `parent_id`, `message` (≥3 chars); opcional `ui_context` |
| — | `GET` | `/api/device/me` | Android | **Device** | Query `minor_id`, `device_id` |
| — | `POST` | `/api/device/heartbeat` | Android | **Device** | JSON opcional: `battery`, `status`, `protection_active` |
| — | `POST` | `/api/device/alerts` | Android | **Device** | JSON: `risk_level`; opcionales `app_source`, `description`, etc. |
| — | `POST` | `/api/device/screen-time/batch` | Android | **Device** | JSON: `rows[]` |
| — | `POST` | `/api/device/app-events/batch` | Android | **Device** | JSON: `events[]` |

Los ejemplos con `Authorization: Bearer` más abajo son **opcionales** (compatibilidad futura); hoy la API **no** rechaza si falta el Bearer en esas rutas.

## Base URL

- **API local (dev típico)**: `http://localhost:8788` o `http://127.0.0.1:8788` (según `PORT`)
- **Prefijo API**: `GET/POST/PATCH {BASE_URL}/api/...`

Además existe un endpoint de estado:

- `GET {BASE_URL}/health` (opcional: `GET {BASE_URL}/health?check_db=1` para probar consulta a Supabase)

## Autenticación

### Rutas parentales (PWA / dashboard)

Hoy son **públicas a nivel HTTP**: basta con UUIDs válidos en query o body. **No confíes en esto en producción**; conviene validar JWT de Supabase (o sesión propia) y comprobar que el token corresponde al `parent_id` y que cada `minor_id` es hijo de ese padre.

### Rutas de dispositivo (`/api/device/*`)

La app del menor **no** usa Bearer de Supabase. Tras `POST /api/pairing/claim` guarda el secreto y envía:

- `Authorization: Device <api_key>`

El servidor solo almacena **hash** (`devices.api_key_hash`). En depuración local puedes definir `RELAX_DEVICE_AUTH=1` para omitir el header (**nunca** en producción).

## Formato de errores

Cuando algo falla, la API usa un formato estable tipo **Problem Details** (via `writeProblem(...)`).

En general, valida:

- UUIDs en query/body (`parent_id`, `minor_id`, `session_id`, `device_id`)
- En producción endurecida: permisos entre padre, menores y dispositivos (hoy no se exige Bearer).

## Headers recomendados (cliente móvil)

- **JSON**:
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Auth**:
  - Dispositivo: `Authorization: Device <api_key>`
  - PWA (opcional hoy): `Authorization: Bearer <access_token>` si ya integras Supabase Auth en el cliente.

---

## Checklist antes de subir a Railway (para pruebas móviles)

### Supabase (BD)

- **Esquema**: alinea tablas y columnas con `docs/supabase_schema.md` (incluye `pairing_sessions`, `devices.api_key_hash`, `alerts.description`, etc.). Aplica migraciones o SQL en el proyecto Supabase que use la API.

### Railway (backend)

- **Build (recomendado)**: `pnpm run build:api` (compila dominio + API antes del arranque; arranque más rápido).
- **Start**: `pnpm start` (raíz, incluye PWA+API) o solo API: `pnpm --filter @kipi/api start`. Si falta `dist/server.js`, `apps/api/scripts/start.mjs` puede intentar compilar al arrancar.
- **Variables de entorno mínimas**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca en la PWA)
  - `NODE_ENV=production`
  - `PORT` (Railway lo suele inyectar)
  - Opcional: `GEMINI_API_KEY`, `GEMINI_MODEL` (notificaciones/asistente con nube)
- **Validación rápida post-deploy**:
  - `GET https://<tu-host>/health?check_db=1` → `ok: true`, `database.ok: true` si Supabase responde.

### CORS / URLs

- **Android**: no usa CORS; en producción usa **HTTPS** y la misma base URL que la PWA (`docs/vinculacion.md`).
- **PWA**: si el front está en otro dominio que el de la API, configura CORS en Hono para ese `Origin`, o sirve la PWA detrás del mismo dominio con proxy.

---

## Producción: qué subir y en qué orden

No puedo desplegar por ti desde este entorno; sigue estos pasos en tu cuenta (Railway / Supabase ya enlazados).

1. **Supabase**  
   - Confirma que el esquema coincide con `docs/supabase_schema.md`.  
   - La clave **service role** solo vive en variables de Railway (backend).

2. **API en Railway**  
   - Conecta el repo o publica imagen; directorio raíz del monorepo.  
   - Comando de build: `pnpm run build:api` (o el que uses en CI).  
   - Comando de arranque: `pnpm --filter @kipi/api start` (tras build).  
   - Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`, `GEMINI_*` si aplica.  
   - **No** definas `RELAX_DEVICE_AUTH` en producción.

3. **PWA (build estático)**  
   - En la raíz del monorepo, antes de `pnpm run build:pwa`, define en `.env` (o en el proveedor de CI):  
     `VITE_API_BASE_URL=https://<tu-servicio-api>.up.railway.app`  
     (sin barra final; las rutas del cliente deben seguir siendo `/api/...` como en `apps/pwa/src/lib/api.ts`).  
   - Sube el contenido de `apps/pwa/dist` a **Netlify**, **Vercel**, **Cloudflare Pages**, o el hosting que uses; o sirve la PWA desde el mismo host si montas estáticos.

4. **Comprobación final**  
   - Desde el móvil o Postman: misma URL base que la PWA.  
   - `GET /health?check_db=1` → OK.  
   - Flujo pairing 1→2→3 (colección en `docs/postman/kipi-pairing.postman_collection.json`).  
   - Abre la PWA, confirma que la etiqueta de API base coincide con Railway (`apiBaseLabel()` en vinculación).

5. **Git**  
   - `git add`, `commit`, `push` a la rama que Railway despliega; espera el deploy verde y repite el paso 4.

## Endpoints

### Healthcheck

#### `GET /health`

- **Auth**: no
- **Uso**: verificar que la API está arriba y si Supabase está configurado.

**Ejemplo**

```bash
curl "http://localhost:8788/health"
```

---

### Dashboard (menores + alertas recientes)

#### `GET /api/dashboard?parent_id={PARENT_UUID}`

- **Auth**: no en el prototipo actual (solo valida UUID de `parent_id`)
- **Query**
  - `parent_id` (UUID, requerido): en producción debería coincidir con el usuario autenticado
- **Respuesta (200)**
  - `{ ok: true, minors: [...] }`
  - Cada menor incluye:
    - `minor_id`, `name`, `age_mode`, `shared_alert_levels`
    - `stats`: conteo de alertas nivel 2 y 3
    - `alertas_recientes`: lista de alertas escaladas al padre

**Ejemplo (curl)**

```bash
curl "http://localhost:8788/api/dashboard?parent_id=UUID_DEL_PADRE"
```

**Ejemplo (`fetch`)**

```js
const res = await fetch(`${BASE_URL}/api/dashboard?parent_id=${parentId}`);
const data = await res.json();
```

*(Más adelante podrás añadir `Authorization: Bearer` cuando la API valide JWT.)*

---

### Tiempo de pantalla (hoy + semana)

#### `GET /api/screen-time?minor_id={MINOR_UUID}`

- **Auth**: no en el prototipo actual (solo valida UUID de `minor_id`)
- **Query**
  - `minor_id` (UUID, requerido)
- **Respuesta (200)**
  - `{ ok: true, today: { total_minutes, by_category }, weekly }`
  - `by_category` contiene `name`, `hours`, `key` (por ejemplo: `games`, `social`, `videos`, `education`, `communication`, `other`)

**Ejemplo**

```bash
curl "http://localhost:8788/api/screen-time?minor_id=UUID_DEL_MENOR"
```

---

### Apps recientes (eventos)

#### `GET /api/apps/recent?minor_id={MINOR_UUID}`

- **Auth**: no en el prototipo actual
- **Query**
  - `minor_id` (UUID, requerido)
- **Respuesta (200)**
  - `{ ok: true, apps: [...] }`
  - Cada item incluye `name`, `event_type`, `category`, `risk_level`, `created_at`

**Ejemplo**

```bash
curl "http://localhost:8788/api/apps/recent?minor_id=UUID_DEL_MENOR"
```

---

### Dispositivos vinculados

#### `GET /api/devices?minor_id={MINOR_UUID}`

- **Auth**: no en el prototipo actual
- **Query**
  - `minor_id` (UUID, requerido)
- **Respuesta (200)**
  - `{ ok: true, devices: [...] }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/devices?minor_id=UUID_DEL_MENOR"
```

---

### Estadísticas de “IA” (conteos agregados)

#### `GET /api/ai/stats?parent_id={PARENT_UUID}`

- **Auth**: no en el prototipo actual
- **Query**
  - `parent_id` (UUID, requerido)
- **Respuesta (200)**
  - `{ ok: true, stats: { messages_analyzed, threats_detected, privacy_breaches, last_audit, data_retention_days, processing_local } }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/ai/stats?parent_id=UUID_DEL_PADRE"
```

---

### Crear alerta manual (ayuda)

#### `POST /api/alerts/manual`

- **Auth**: no en el prototipo actual
- **Body (JSON)**:
  - `minor_id` (UUID, requerido)
  - `app_source` (string, opcional; default `"Manual"`)
  - `risk_level` (number 1|2|3, opcional; default `2`)
- **Respuesta (200)**
  - `{ ok: true, alert_id, message }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/alerts/manual" ^
  -H "Content-Type: application/json" ^
  -d "{\"minor_id\":\"UUID_DEL_MENOR\",\"app_source\":\"WhatsApp\",\"risk_level\":3}"
```

---

### Actualizar acuerdos (niveles compartidos) del menor

#### `PATCH /api/minors/agreement`

- **Auth**: no en el prototipo actual
- **Body (JSON)**:
  - `minor_id` (UUID, requerido)
  - `shared_alert_levels` (array de int, opcional; si viene vacío se normaliza a `[1,2,3]`)
- **Respuesta (200)**
  - `{ ok: true, message }`

**Ejemplo**

```bash
curl -X PATCH "http://localhost:8788/api/minors/agreement" ^
  -H "Content-Type: application/json" ^
  -d "{\"minor_id\":\"UUID_DEL_MENOR\",\"shared_alert_levels\":[2,3]}"
```

---

## Pairing (emparejamiento de dispositivo)

### Generar código OTP

#### `POST /api/pairing/generate-code`

- **Auth**: no (pensado para el dispositivo/flujo de emparejamiento)
- **Body (JSON)**:
  - `device_model` (string, opcional)
  - `fcm_push_token` (string, opcional)
- **Respuesta (200)**
  - `{ ok: true, session_id, otp, expires_at }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/pairing/generate-code" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_model\":\"Pixel 8\",\"fcm_push_token\":\"TOKEN\"}"
```

### Confirmar código OTP (crea un menor)

#### `POST /api/pairing/confirm-code`

- **Auth**: no. El cuerpo incluye `parent_id` (UUID) y `otp`. Si ese padre no existía en `auth.users`, la API lo crea con Admin API y hace `upsert` en `parents` antes de crear `minors` / `devices` (ver tabla arriba).
- **Body (JSON)**:
  - `parent_id` (UUID, requerido)
  - `otp` (string, requerido): 6 caracteres (`A-Z` y `2-9`, sin `I`, `O`, `0`, `1`)
- **Respuesta (200)**
  - `{ ok: true, minor_id, device_id, message }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/pairing/confirm-code" ^
  -H "Content-Type: application/json" ^
  -d "{\"parent_id\":\"00000000-0000-4000-8000-000000000001\",\"otp\":\"ABC234\"}"
```

---

### Reclamar emparejamiento (dispositivo obtiene su `api_key`)

#### `POST /api/pairing/claim`

- **Auth**: no (pero requiere **`session_id` + `otp`**)
- **Body (JSON)**:
  - `session_id` (UUID, requerido): el que regresó `generate-code` (solo lo conoce el dispositivo)
  - `otp` (string, requerido): el código que ve el padre
- **Respuesta (200)**
  - `{ ok: true, device_id, minor_id, api_key }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/pairing/claim" ^
  -H "Content-Type: application/json" ^
  -d "{\"session_id\":\"UUID_DE_SESSION\",\"otp\":\"ABC234\"}"
```

> Guarda `api_key` en el Keystore/EncryptedSharedPreferences. Es el secreto con el que el dispositivo se autentica en `/api/device/*`.

### Analizar “notificación” (guarda alerta)

#### `POST /api/notifications/analyze`

- **Auth**: no en el prototipo actual (valida que exista `minor_id` en BD)
- **Body (JSON)**:
  - `minor_id` (UUID, requerido)
  - `text_preview` (string, requerido; mínimo 3 chars)
  - `app_source` (string, opcional; default `"Sistema"`)
  - `risk_level` (number 1|2|3, opcional): **resultado on-device** (SLM/heurística). Si no viene, usa `mock_risk_level`.
  - `mock_risk_level` (number 1|2|3, opcional): solo para pruebas.
  - `confidence_score` (number, opcional): **confianza on-device** (\(0..1\)).
  - `sensitive_data_flag` (boolean, opcional): si se detectó exposición de datos sensibles (teléfono, dirección, ubicación, etc).
  - `kipi_response` (string, opcional): mensaje on-device para el menor (si el escudo local ya lo generó).
  - `force_cloud` (boolean, opcional): fuerza reclasificación en servidor.
  - `cloud_confidence_threshold` (number, opcional): umbral \(0..1\) para decidir escalamiento a nube (default `0.78`).
  - `shared_alert_levels` (array de int, opcional; default `[1,2,3]`): fallback; si el menor tiene `minors.shared_alert_levels` en BD, ese valor tiene prioridad.
- **Respuesta (200)**
  - `{ ok: true, analysis: {...}, system_action: {...}, cloud: {...}, alert_id, procesado_en_ms }`

**Regla de “IA potente” (escalamiento a nube)**

El backend replica el patrón: **clasificación local primero**, y solo si hay **incertidumbre** se envía a un modelo más potente (Gemini) en servidor.

- Se usa nube si:
  - `force_cloud=true`, o
  - `risk_level >= 2` **y** `confidence_score < cloud_confidence_threshold`, o
  - faltan campos on-device (fallback a nube).
- Si la nube falla, el backend **no bloquea** el flujo: devuelve el análisis on-device y añade `cloud.error`.

**Ejemplo**

```bash
curl "http://localhost:8788/api/notifications/analyze" ^
  -H "Content-Type: application/json" ^
  -d "{\"minor_id\":\"UUID_DEL_MENOR\",\"text_preview\":\"Me puedes pasar tu dirección?\",\"app_source\":\"WhatsApp\",\"risk_level\":2,\"confidence_score\":0.55,\"sensitive_data_flag\":true}"
```

---

## Gamificación

### Racha de días seguros

#### `GET /api/gamification/streak?parent_id={PARENT_UUID}`

- **Auth**: no en el prototipo actual
- **Respuesta (200)**
  - `{ ok: true, parent_id, safe_days_streak }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/gamification/streak?parent_id=UUID_DEL_PADRE"
```

### Catálogo de misiones + progreso

#### `GET /api/gamification/missions?parent_id={PARENT_UUID}`

- **Auth**: no en el prototipo actual
- **Respuesta (200)**
  - `{ ok: true, parent_id, missions, missions_completed_count }`
  - Cada misión incluye `id`, `title`, `description`, `estimated_minutes`, `category`, `is_completed`

**Ejemplo**

```bash
curl "http://localhost:8788/api/gamification/missions?parent_id=UUID_DEL_PADRE"
```

### Completar una misión

#### `POST /api/gamification/missions/complete`

- **Auth**: no en el prototipo actual
- **Body (JSON)**:
  - `parent_id` (UUID, requerido)
  - `mission_id` (string, requerido; debe existir en el catálogo)
- **Respuesta (200)**
  - `{ ok: true, mission_id, missions_completed_count, already_completed }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/gamification/missions/complete" ^
  -H "Content-Type: application/json" ^
  -d "{\"parent_id\":\"UUID_DEL_PADRE\",\"mission_id\":\"dif-grooming-guia-2024\"}"
```

---

## Asistente (chat demo)

#### `POST /api/assistant/chat`

- **Auth**: no en el prototipo actual
- **Body (JSON)**:
  - `parent_id` (UUID, requerido)
  - `message` (string, requerido; mínimo 3 caracteres)
  - `ui_context` (objeto, opcional)
- **Respuesta (200)**
  - `{ ok: true, reply }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/assistant/chat" ^
  -H "Content-Type: application/json" ^
  -d "{\"parent_id\":\"00000000-0000-4000-8000-000000000001\",\"message\":\"¿Qué puedo hacer si mi hijo recibe mensajes raros?\"}"
```

---

## Endpoints para App Android (ingesta de datos)

Estos endpoints son para que el **dispositivo** envíe datos al backend. Se autentican con:

- `Authorization: Device <api_key>`

### Identidad del dispositivo (debug)

#### `GET /api/device/me`

- **Auth**: sí (Device)
- **Query**: `minor_id`, `device_id` (UUID, requeridos)
- **Respuesta**: `{ ok: true, device_id, minor_id }`

### Heartbeat (estado / batería / protección)

#### `POST /api/device/heartbeat`

- **Auth**: sí (Device)
- **Body (JSON)** (opcionales):
  - `battery` (number 0–100)
  - `status` (`"online"` | `"offline"`)
  - `protection_active` (boolean)
- **Respuesta**: `{ ok: true }`

### Enviar alerta (IA del dispositivo → dashboard)

#### `POST /api/device/alerts`

- **Auth**: sí (Device)
- **Body (JSON)**:
  - `app_source` (string, opcional; default `"Android"`)
  - `risk_level` (1|2|3, requerido)
  - `confidence_score` (0–1, opcional; default `0.8`)
  - `sensitive_data_flag` (boolean, opcional)
  - `description` (string, opcional; recomendado)
- **Respuesta (200)**:
  - `{ ok: true, alert_id, system_action: { escalated_to_parent, reason } }`

**Ejemplo**

```bash
curl "http://localhost:8788/api/device/alerts" ^
  -H "Authorization: Device API_KEY" ^
  -H "Content-Type: application/json" ^
  -d "{\"app_source\":\"WhatsApp\",\"risk_level\":3,\"confidence_score\":0.91,\"sensitive_data_flag\":true,\"description\":\"Solicita dirección y foto\"}"
```

### Enviar tiempo de pantalla (batch diario)

#### `POST /api/device/screen-time/batch`

- **Auth**: sí (Device)
- **Body (JSON)**:
  - `rows` (array, requerido):
    - `app_name` (string)
    - `category` (string)
    - `minutes` (number)
    - `log_date` (YYYY-MM-DD)
- **Respuesta**: `{ ok: true, inserted }`

### Enviar eventos de apps (batch)

#### `POST /api/device/app-events/batch`

- **Auth**: sí (Device)
- **Body (JSON)**:
  - `events` (array, requerido):
    - `app_name` (string)
    - `event_type` (`installed`|`updated`|`uninstalled`)
    - `category` (string)
    - `risk_level` (`low`|`medium`|`high`)
    - `created_at` (ISO8601, opcional)
- **Respuesta**: `{ ok: true, inserted }`

---

## Flujo recomendado (Android ↔ Backend ↔ PWA)

1) **Android** llama `POST /api/pairing/generate-code` → recibe `session_id` + `otp`  
2) **Padre (PWA)** confirma con `POST /api/pairing/confirm-code` (`parent_id` + `otp`; sin JWT en el prototipo) → se asegura usuario/padre en BD, se crean `minor` + `device`  
3) **Android** reclama con `POST /api/pairing/claim` (`session_id` + `otp`) → recibe `api_key`  
4) **Android** usa `Authorization: Device <api_key>` para alertas, métricas y heartbeat (`/api/device/*`)  
5) **PWA** lee datos vía backend (`GET /api/dashboard`, etc.) con la misma `BASE_URL` que el móvil

