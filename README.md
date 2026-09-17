# MedApp

Sistema de gestión de turnos médicos para consultorios ambulatorios pequeños: panel administrativo,
turnero público, API con reglas de negocio, recordatorios y asistente conversacional por WhatsApp.
Proyecto Integrador Final · Tecnicatura Universitaria en Programación · UTN FRM.

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` | API (Hono + Drizzle), pruebas (`src/__tests__`), esquema y migraciones SQL (`sql/`), tarea de respaldo (`respaldo/`) |
| `ParteAdmin/Frontend/` | Panel administrativo (React + Vite) |
| `PartePaciente/paciente-app/` | Turnero público (React + Vite) |
| `n8n/` | Workflows: calendario y correo, recordatorios, asistente conversacional, tablero de agenda |
| `evaluacion/` | Simulación paramétrica del Capítulo 5 |
| `docs/DESPLIEGUE.md` | Guía de despliegue (Dokploy + Vercel + Supabase) |

## Requisitos

- Node.js 22 y pnpm 9
- Una base PostgreSQL (Supabase) con `backend/sql/esquema.sql` o con las migraciones de `backend/sql/`
- Para las integraciones: instancia de n8n, Chatwoot con WhatsApp Cloud API, cuentas de Google y OpenAI

## Instalación local

```bash
pnpm install

# API
cp backend/.env.example backend/.env      # completar DATABASE_URL, SUPABASE_*, N8N_API_KEY (openssl rand -hex 32)
cd backend && pnpm dev                    # http://localhost:3000/health

# Panel y turnero (en otras terminales)
cd ParteAdmin/Frontend && pnpm dev        # requiere VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
cd PartePaciente/paciente-app && pnpm dev # requiere VITE_API_URL, VITE_CLINICA_ID
```

Aplicar una migración: `cd backend && node scripts/aplicar_sql.mjs sql/<archivo>.sql`.
No usar `drizzle-kit push` contra producción.

## Pruebas

```bash
cd backend
pnpm test                                             # unitarias
INTEGRACION=1 DATABASE_URL=postgresql://.../medapp_test pnpm test   # integración (base de prueba)
```

La integración continua (`.github/workflows/ci.yml`) ejecuta ambas contra PostgreSQL 16 y compila los tres componentes.

## Simulación

```bash
cd evaluacion/simulacion
pip install -r requirements.txt
python simulacion_medapp.py --escenarios 10000 --semilla 20260916
```
