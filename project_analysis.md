# Proyecto: Volt Gym - Evolución Inteligente

## Estado Actual
Estamos en la fase de **Integración de Servicios y Gamificación (MVP)**.

### ✅ Completado
- **Navegación Core:** Implementado BottomTabNavigator y Stack dinámico.
- **Autenticación:** Integración total con Supabase Auth (Sign In / Sign Up).
- **Perfiles:** Creación de usuarios con metadatos extendidos (nombre, usuario, móvil).
- **Gestión de Perfil:** Subida de avatar a Supabase Storage y edición de datos personales.
- **Entrenamiento Activo:** Lógica para iniciar sesión, registrar series en tiempo real y completar sesión.
- **Biblioteca de Ejercicios:** Listado filtrado por grupos musculares con búsqueda.
- **UX/UI:** Identidad visual premium (naranja/negro/neón) y capitalización correcta en español.

### 🚧 En Progreso / Siguientes Pasos
1. **Schema DB completo:** Implementar tablas de nutrición y coach_assignments en Supabase.
2. **Coach AI Chat:** Integrar interfaz de chat con el backend de FastAPI.
3. **Módulo de Progreso:** Visualizar gráficas reales de volumen por músculo.
4. **Gamificación:** Pulir el sistema de XP y logros (Badges).

## Notas Técnicas
- **Frontend:** React Native + Expo + Supabase JS Client.
- **Backend:** FastAPI + Alembic (Postgres).
- **Regla Oro:** Todo texto visible para el usuario es **Español**.
