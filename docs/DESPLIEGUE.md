# Despliegue de MedApp

## Topología

| Componente | Dónde | Dominio |
|---|---|---|
| Panel administrativo (React) | Vercel | `panel.verticedev.online` |
| Turnero público (React) | Vercel | `turnos.verticedev.online` |
| API (Hono + Drizzle) | VPS Hostinger (Brasil) · Dokploy | `api.verticedev.online` |
| Tarea de respaldo (pg_dump) | VPS Hostinger · Dokploy | — (sin exposición) |
| n8n + Chatwoot | VPS Hostinger · Dokploy | los existentes |
| PostgreSQL + Auth | Supabase (São Paulo) | — |
| WhatsApp | Meta WhatsApp Cloud API → Chatwoot | — |

La API corre en el mismo VPS que n8n y en la misma región que la base de datos
(Brasil), lo que minimiza la latencia API↔BD y API↔n8n.

## 1. API en Dokploy

1. **Create Application** → Provider GitHub → repo `MedApp`, rama `main` (o `dev-giuliano`).
2. **Build type:** Dockerfile · **Docker File:** `backend/Dockerfile` · **Docker Context Path:** `.` (raíz).
3. **Environment:**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres.<ref>:<pass>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role>
   N8N_WEBHOOK_URL=https://<n8n>/webhook/<id-calendar>
   N8N_API_KEY=<openssl rand -hex 32>
   CORS_ORIGINS=https://panel.verticedev.online,https://turnos.verticedev.online
   RESERVAS_POR_HORA=20
   RESERVAS_POR_TELEFONO_HORA=3
   TRUSTED_PROXY_HOPS=1          # Traefik de Dokploy agrega la IP real al final de X-Forwarded-For
   ```
4. **Domains:** `api.verticedev.online` → puerto 3000 → HTTPS (Let's Encrypt).
5. DNS (Hostinger): registro `A` de `api` → IP del VPS.
6. Verificar: `curl https://api.verticedev.online/health`.

## 2. Tarea de respaldo en Dokploy

1. **Create Application** → mismo repo · Dockerfile `backend/respaldo/Dockerfile` · Context `backend/respaldo`.
2. **Environment:**
   ```
   DATABASE_URL=postgresql://postgres.<ref>:<pass>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   MEDAPP_API_URL=https://api.verticedev.online
   N8N_API_KEY=<la misma de la API>
   RETENCION_DIAS=14
   ```
   > Puerto **5432** (modo sesión). `pg_dump` no funciona con el pooler en modo transacción (6543).
3. **Advanced → Volumes:** bind mount `/root/medapp-respaldos` → `/respaldos`.
4. Sin dominio. El contenedor ejecuta `crond`: todos los días a las 03:00 (Mendoza).
5. Prueba manual: consola del contenedor → `TIPO_EJECUCION=manual respaldo.sh`.
   Debe aparecer en el panel (Configuración → Backups).
6. **Prueba de restauración** (hacerla al menos una vez y documentarla):
   ```
   DESTINO_URL=postgresql://postgres:<pass>@<base-de-prueba>/postgres \
     /usr/local/bin/restaurar.sh /respaldos/medapp_<fecha>.dump
   ```
   Copiar `restaurar.sh` al contenedor o ejecutarlo desde una máquina con `psql`.

Opcional: sincronizar `/root/medapp-respaldos` a un almacenamiento externo
(Cloudflare R2, Backblaze B2) con `rclone`, para no depender de un único proveedor.

## 3. Frontends en Vercel

Dos proyectos, mismo repositorio:

| Proyecto | Root Directory | Variables |
|---|---|---|
| medapp-panel | `ParteAdmin/Frontend` | `VITE_API_URL=https://api.verticedev.online/api/v1`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| medapp-turnos | `PartePaciente/paciente-app` | `VITE_API_URL=https://api.verticedev.online/api/v1`, `VITE_CLINICA_ID` |

Framework preset: Vite. `vercel.json` ya incluye el rewrite para rutas SPA.
Dominios: `CNAME` de `panel` y `turnos` → `cname.vercel-dns.com`.

En Supabase → Authentication → URL Configuration, agregar `https://panel.verticedev.online`.

## 4. n8n

1. Crear credencial **Header Auth** "MedApp API (x-api-key)": header `x-api-key`, valor = `N8N_API_KEY`.
2. Importar los workflows de `n8n/` y reconectar credenciales (Google, Chatwoot, OpenAI). n8n ya no
   necesita credencial de PostgreSQL: el tablero se obtiene de la API.
   - `asistenteConversacional.json` (WF-03): verifica cada mensaje entrante consultando la API de
     Chatwoot antes de actuar. En Chatwoot, el webhook debe suscribirse a `message_created` y
     `message_updated` (este último informa el estado de entrega de los recordatorios).
   - `notificacionDeTurnos.json` (WF-02): envía la plantilla `recordatorio_turno`. Ajustar en
     "Variables Chatwoot" el idioma y el orden de los parámetros según la plantilla aprobada.
3. Los workflows apuntan a `https://api.verticedev.online`. Si n8n y la API comparten la red
   `dokploy-network`, puede usarse la URL interna del servicio.
4. En el workflow de correo, usar el campo **`cuando`** del payload (hora de Mendoza) y no
   `record.fecha_hora_inicio` (UTC). Asunto: "Turno registrado", no "confirmado".

## 5. Base de datos

En orden, desde el SQL Editor de Supabase (con backup previo):
1. `backend/sql/2026-09-16_ronda1_integridad.sql` (primero solo la sección 0).
2. `backend/sql/2026-09-17_ronda2_respaldos.sql`.
3. `backend/sql/2026-09-18_ronda3_endurecimiento.sql` (elimina el webhook heredado a ngrok,
   el acceso anónimo y las escrituras directas con JWT; limpia claves foráneas duplicadas).
4. `backend/sql/2026-09-24_ronda4_entrega.sql` (estado de entrega de recordatorios; vuelve a
   asegurar la eliminación del disparador heredado).
5. Verificar: `SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.turnos'::regclass AND NOT tgisinternal;`
   debe devolver solo `trg_validar_transicion_turno`.
6. Regenerar `backend/sql/esquema.sql` con `pg_dump --schema-only` y comprobar que no esté vacío.
   La integración continua crea su base de prueba a partir de ese archivo.

> No ejecutar `drizzle-kit push` contra producción: recrea claves foráneas duplicadas.
> Los cambios de esquema se aplican con scripts SQL versionados en `backend/sql/`.

## 6. Antes de abrir a pacientes

- [ ] Rotar las credenciales que estuvieron en el historial de git (`.env` del commit `fee5d81`).
- [ ] `N8N_API_KEY` nueva y distinta de la de desarrollo.
- [ ] Número de WhatsApp Business verificado y plantilla del recordatorio aprobada.
- [ ] Reemplazar los datos ficticios de `/privacidad` por los del consultorio real.
- [ ] Prueba de restauración del respaldo documentada.
