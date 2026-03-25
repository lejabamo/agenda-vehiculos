# Plan de Trabajo: Agenda de Vehículos

> Proyecto **independiente** — No se toca `agenda-auditorio`.

---

## Contexto y Objetivo

Digitalizar el proceso actual de solicitud de vehículos institucionales (hoy en Excel).  
Aplicar los mismos patrones de `agenda-auditorio`:  
FastAPI + React + Docker + GitHub Actions CI/CD.

---

## Formato Excel → Campos de la App

> [!IMPORTANT]
> Comparte el Excel antes de iniciar el desarrollo. Con él se definen los campos exactos del formulario, reglas de negocio y flujo de aprobación.

Campos **típicos** que suelen aparecer:

| Campo | Tipo |
|---|---|
| Fecha y hora de salida | DateTimePicker |
| Fecha y hora de regreso | DateTimePicker |
| Destino | Texto |
| Motivo / Comisión | Texto / Select |
| Dependencia solicitante | Select (BD) |
| Responsable / conductor | Texto |
| Cédula responsable | Texto |
| Vehículo asignado | Select (BD) |
| Número de pasajeros | Número |
| Observaciones | Textarea |

---

## Stack Tecnológico

Mismo patrón probado en `agenda-auditorio`:

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12 + FastAPI + SQLAlchemy ORM |
| Base de datos | PostgreSQL (via Docker) |
| Migraciones | Alembic |
| Frontend | React 19 + Vite + TypeScript |
| Estilos | Vanilla CSS (variables CSS, no Tailwind) |
| Autenticación | JWT (HttpOnly cookies) |
| Email | SMTP via `smtplib` (notificaciones) |
| CI/CD | GitHub Actions → VPS vía SSH |
| Contenedores | Docker + docker-compose |

---

## Fases de Desarrollo

### Fase 1 — Configuración del Proyecto (Nuevo Repo)
- [ ] Crear repositorio GitHub `agenda-vehiculos`
- [ ] Estructura de carpetas `/backend` y `/frontend`
- [ ] `docker-compose.yml` (dev) + `docker-compose.prod.yml` (prod)
- [ ] `deploy.yml` GitHub Actions (misma lógica que `agenda-auditorio`)
- [ ] `.env.example` + `.gitignore`

### Fase 2 — Backend Base
- [ ] Modelos de base de datos: `Vehiculo`, `Solicitud`, `Usuario`, `Dependencia`
- [ ] Alembic: migraciones iniciales
- [ ] CRUD de vehículos (admin)
- [ ] Endpoint de solicitudes (crear, aprobar, rechazar, cancelar)
- [ ] Autenticación JWT con roles (`ADMIN`, `USUARIO`)
- [ ] Validaciones de negocio (disponibilidad, solapamiento horario)
- [ ] Notificaciones por email

### Fase 3 — Frontend Base
- [ ] Sistema de diseño (variables CSS, tipografía, colores institucionales)
- [ ] Flujo de login/logout
- [ ] Wizard público de solicitud (paso a paso como en `agenda-auditorio`)
  - Paso 1: Disclaimer / Reglamento
  - Paso 2: Vehículo y fechas de salida/regreso
  - Paso 3: Datos del solicitante y destino
  - Paso 4: Confirmación
- [ ] Panel de Administración
  - Solicitudes (lista, filtros, detalle)
  - Gestión de Vehículos
  - Calendario de disponibilidad

### Fase 4 — UX y Pulido
- [ ] Vista responsive / móvil
- [ ] Validaciones en tiempo real (fechas, solapamiento)
- [ ] Feedback visual de estados (colores amigables, no rojo agresivo)
- [ ] Mensajes de error claros

### Fase 5 — Seguridad y Producción
- [ ] HTTPS / SSL en producción
- [ ] Variables de entorno via GitHub Secrets
- [ ] Rate limiting en API
- [ ] Cors restringido a dominio de producción
- [ ] Pruebas de humo post-deploy automatizadas en CI

---

## Cómo Iniciar

1. **Comparte el Excel** en la nueva ventana de Antigravity — eso define los campos reales.
2. **Abre una nueva ventana/conversación** de Antigravity señalando la carpeta del nuevo proyecto (ej. `c:\Users\jefes\OneDrive\Desktop\agenda-vehiculos`).
3. Pega este plan o dile a Antigravity: *"Vamos a crear una app de agenda de vehículos desde cero siguiendo este plan."*
4. Antigravity iniciará con la **Fase 1** y avanzará fase por fase.

---

## Convenciones de Clean Code (aplicar desde el inicio)

- Nombres en inglés en el código, español en la UI
- Un servicio por entidad (`solicitud_service.py`, `vehiculo_service.py`)
- Componentes React pequeños y con responsabilidad única
- Constantes de estado (no strings hardcodeados): `ESTADO.PENDIENTE`, `ESTADO.APROBADO`, etc.
- Commits semánticos: `feat:`, `fix:`, `chore:`, `ui:`
