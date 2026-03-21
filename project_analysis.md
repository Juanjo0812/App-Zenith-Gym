# Volt-Gym — Estado técnico actual

## Resumen ejecutivo

El proyecto mantiene operativo el flujo principal de entrenamiento:
- autenticación con Supabase JWT,
- CRUD de rutinas,
- inicio y cierre de sesiones,
- registro de sets,
- persistencia en Postgres/Supabase.

En esta fase se saneó la base técnica sin rediseñar la UI:
- Alembic quedó nuevamente operativo y alineado con la misma configuración del backend.
- El móvil dejó de mezclar lecturas de entrenamiento y perfil con acceso directo a tablas para esos dominios principales.
- Se introdujo una capa de compatibilidad temporal para perfil (`profile_image_url`/`avatar_url`, `phone_number`/`phone`, `username` desde metadata de Auth).
- Se retiró código versionado de caché compilada del backend.

## Estado por capa

### Backend

Listo y operativo:
- FastAPI con JWT real de Supabase.
- Endpoints de entrenamientos para rutinas, sesiones y sets.
- Endpoint de ejercicios.
- Nuevo bloque de endpoints de perfil:
  - `GET /api/v1/users/me`
  - `GET /api/v1/users/me/dashboard`
  - `GET /api/v1/users/me/stats`
  - `PATCH /api/v1/users/me`
- Alembic alineado con `src.config.settings`.

Pendiente o parcial:
- `ai_coach.py` sigue siendo stub controlado.
- Nutrición y progreso siguen sin dominio backend completo.
- No se migraron aún triggers, policies ni objetos manuales de Supabase Auth a Alembic.

### Frontend móvil

Listo y operativo:
- Login, registro y sesión con Supabase.
- Workouts, Exercise List y Active Workout siguen funcionales.
- Home y Profile ahora consumen perfil y métricas desde la API.
- Workouts y Exercises ahora leen desde la API oficial en lugar de consultas directas a tablas.

Congelado con mocks por decisión de fase:
- `AICoachScreen`
- `NutritionScreen`
- `ProgressScreen`

Se mantuvieron visualmente estables, pero se corrigieron textos visibles que mezclaban inglés y español.

### Base de datos y migraciones

Estado actual:
- Supabase sigue siendo el proveedor oficial de Postgres y Auth.
- Alembic pasa a ser la fuente de verdad del esquema versionado en el repo.
- El contrato real de `users` todavía depende de compatibilidad temporal entre:
  - columnas persistidas en `public.users`,
  - metadata de Supabase Auth,
  - shape expuesto por la API.

Pendiente:
- decidir y ejecutar la convergencia final del perfil (`username`, alias de avatar/teléfono),
- auditar RLS/triggers/FKs manuales para futura incorporación controlada al flujo de migraciones.

## Deuda técnica activa

### Alta prioridad

- Consolidar definitivamente el contrato de perfil en una sola fuente persistente.
- Terminar de llevar más lecturas del móvil al backend en dominios aún híbridos.
- Añadir pruebas de integración con base real para rutas de usuario y workouts.

### Prioridad media

- Extraer más lógica de `workouts.py` hacia repositorios/use cases.
- Reemplazar stubs de IA por gateways reales vía API externa.
- Revisar dependencias hoy no utilizadas (`redis`, `passlib`, `httpx`) antes de eliminarlas.

### Prioridad baja

- Unificar assets duplicados entre backend y móvil.
- Normalizar más textos visibles al formato de capitalización definido por el proyecto.

## Verificaciones recomendadas

Con el entorno del backend activo y una base accesible:

```powershell
cd volt-gym-backend
.\venv\Scripts\python.exe -m pytest -q
.\venv\Scripts\alembic.exe current
.\venv\Scripts\alembic.exe check
```

Para el móvil:

```powershell
cd volt-gym-mobile
.\node_modules\.bin\tsc.cmd --noEmit
```

## Siguiente paso recomendado

La siguiente fase segura es cerrar la convergencia del perfil y seguir moviendo contratos del móvil hacia la API oficial, empezando por las áreas aún mixtas o dependientes de metadata temporal.
