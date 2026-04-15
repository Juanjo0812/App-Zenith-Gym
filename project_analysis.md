# Zenith â€” Estado tÃ©cnico actual

## Resumen ejecutivo

El proyecto mantiene operativo el flujo principal de entrenamiento:
- autenticaciÃ³n con Supabase JWT,
- CRUD de rutinas,
- inicio y cierre de sesiones,
- registro de sets,
- persistencia en Postgres/Supabase.

En esta fase se saneÃ³ la base tÃ©cnica sin rediseÃ±ar la UI:
- Alembic quedÃ³ nuevamente operativo y alineado con la misma configuraciÃ³n del backend.
- El mÃ³vil dejÃ³ de mezclar lecturas de entrenamiento y perfil con acceso directo a tablas para esos dominios principales.
- Se introdujo una capa de compatibilidad temporal para perfil (`profile_image_url`/`avatar_url`, `phone_number`/`phone`, `username` desde metadata de Auth).
- Se retirÃ³ cÃ³digo versionado de cachÃ© compilada del backend.

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
- NutriciÃ³n y progreso siguen sin dominio backend completo.
- No se migraron aÃºn triggers, policies ni objetos manuales de Supabase Auth a Alembic.

### Frontend mÃ³vil

Listo y operativo:
- Login, registro y sesiÃ³n con Supabase.
- Workouts, Exercise List y Active Workout siguen funcionales.
- Home y Profile ahora consumen perfil y mÃ©tricas desde la API.
- Workouts y Exercises ahora leen desde la API oficial en lugar de consultas directas a tablas.

Congelado con mocks por decisiÃ³n de fase:
- `AICoachScreen`
- `NutritionScreen`
- `ProgressScreen`

Se mantuvieron visualmente estables, pero se corrigieron textos visibles que mezclaban inglÃ©s y espaÃ±ol.

### Base de datos y migraciones

Estado actual:
- Supabase sigue siendo el proveedor oficial de Postgres y Auth.
- Alembic pasa a ser la fuente de verdad del esquema versionado en el repo.
- El contrato real de `users` todavÃ­a depende de compatibilidad temporal entre:
  - columnas persistidas en `public.users`,
  - metadata de Supabase Auth,
  - shape expuesto por la API.

Pendiente:
- decidir y ejecutar la convergencia final del perfil (`username`, alias de avatar/telÃ©fono),
- auditar RLS/triggers/FKs manuales para futura incorporaciÃ³n controlada al flujo de migraciones.

## Deuda tÃ©cnica activa

### Alta prioridad

- Consolidar definitivamente el contrato de perfil en una sola fuente persistente.
- Terminar de llevar mÃ¡s lecturas del mÃ³vil al backend en dominios aÃºn hÃ­bridos.
- AÃ±adir pruebas de integraciÃ³n con base real para rutas de usuario y workouts.

### Prioridad media

- Extraer mÃ¡s lÃ³gica de `workouts.py` hacia repositorios/use cases.
- Reemplazar stubs de IA por gateways reales vÃ­a API externa.
- Revisar dependencias hoy no utilizadas (`redis`, `passlib`, `httpx`) antes de eliminarlas.

### Prioridad baja

- Unificar assets duplicados entre backend y mÃ³vil.
- Normalizar mÃ¡s textos visibles al formato de capitalizaciÃ³n definido por el proyecto.

## Verificaciones recomendadas

Con el entorno del backend activo y una base accesible:

```powershell
cd Zenith-backend
.\venv\Scripts\python.exe -m pytest -q
.\venv\Scripts\alembic.exe current
.\venv\Scripts\alembic.exe check
```

Para el mÃ³vil:

```powershell
cd Zenith-mobile
.\node_modules\.bin\tsc.cmd --noEmit
```

## Siguiente paso recomendado

La siguiente fase segura es cerrar la convergencia del perfil y seguir moviendo contratos del mÃ³vil hacia la API oficial, empezando por las Ã¡reas aÃºn mixtas o dependientes de metadata temporal.

