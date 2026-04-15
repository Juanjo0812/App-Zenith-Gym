# Guía de migración de marca: Volt-Gym → Zenith

**Objetivo:** Reemplazar toda la identidad visual y textual de "Volt-Gym / VOLT" por la nueva marca **Zenith**, sin modificar funcionalidades, estructura de pantallas ni lógica de negocio.

---

## 1. Identidad de marca

### Nombre
| Contexto | Antes | Después |
|---|---|---|
| Nombre completo | Volt-Gym | Zenith |
| Nombre corto (UI) | VOLT | ZENITH |
| Subtítulo | GYM CLUB | RENDIMIENTO |
| Entrenador IA | VOLT Coach / Entrenador VOLT | Zenith Coach / Entrenador Zenith |
| Placeholder email | atleta@volt.com | atleta@zenith.app |
| Bienvenida registro | Bienvenido a VOLT | Bienvenido a Zenith |
| URL referencia | https://volt-gym.app | https://zenith-app.com |
| Header OpenRouter | Volt-Gym AI Coach | Zenith AI Coach |

### Logo
El logo central del splash pasa de una **"V"** a una **"Z"** geométrica estilizada.

**Referencia visual:**
![Logo Zenith](C:\Users\jjmor\.gemini\antigravity\brain\6b9e290f-09cb-452e-b746-e674868ea1a9\zenith_logo_mockup_1776124554809.png)

---

## 2. Paleta de colores

### Colores principales

| Token | Valor anterior | Nuevo valor | Descripción |
|---|---|---|---|
| `background` | `#000000` | `#040D1A` | Azul-negro profundo (base) |
| `chrome` | `#0A0A0A` | `#071222` | Fondo de barras y paneles sistémicos |
| `surface` | `#111111` | `#0C1B2E` | Tarjetas y contenedores primarios |
| `surfaceAlt` | `#181818` | `#112340` | Inputs, tarjetas secundarias |
| `surfaceRaised` | `#1F1F1F` | `#163058` | Elementos elevados / hover |
| `border` | `#1C1C1C` | `#1A3050` | Bordes sutiles |
| `borderStrong` | `#2B2B2B` | `#264060` | Bordes visibles (inputs, divisores) |
| `textPrimary` | `#FFFFFF` | `#F8F9FA` | Blanco escarchado (texto principal) |
| `textSecondary` | `#A0A0B8` | `#8BA3C0` | Texto secundario azulado |
| `textMuted` | `#666666` | `#4A6580` | Texto apagado |
| **`accent`** | **`#FF4500`** | **`#00E5FF`** | **Cian neón (acento principal)** |
| `accentSoft` | `rgba(255,69,0,0.12)` | `rgba(0,229,255,0.12)` | Fondo tenue de acento |
| `accentSoftStrong` | `rgba(255,69,0,0.18)` | `rgba(0,229,255,0.18)` | Fondo medio de acento |
| `accentBorder` | `rgba(255,69,0,0.30)` | `rgba(0,229,255,0.30)` | Borde de acento |
| `onAccent` | `#111111` | `#040D1A` | Texto sobre acento (oscuro) |
| `success` | `#00E676` | `#00E676` | *(sin cambio)* |
| `successSoft` | `rgba(0,230,118,0.14)` | `rgba(0,230,118,0.14)` | *(sin cambio)* |
| `warning` | `#FFB300` | `#FFB300` | *(sin cambio)* |
| `warningSoft` | `rgba(255,179,0,0.14)` | `rgba(255,179,0,0.14)` | *(sin cambio)* |
| `error` | `#FF6B57` | `#FF6B57` | *(sin cambio)* |
| `errorSoft` | `rgba(255,107,87,0.14)` | `rgba(255,107,87,0.14)` | *(sin cambio)* |

### Color secundario de acento (para glows y trails del splash)

| Uso | Antes | Después |
|---|---|---|
| Glow principal | `#FF6A2A` | `#33EEFF` |
| Destacado sutil / white-hot | `#EAEAEA` | `#EAEAEA` *(sin cambio)* |

### Elevación / sombras

| Token | Antes | Después |
|---|---|---|
| `elevation.accentGlow.shadowColor` | `colors.accent` (`#FF4500`) | `colors.accent` (`#00E5FF`) |

> [!NOTE]
> Los tokens `success`, `warning` y `error` no cambian. Solo se modifica el acento y las superficies.

---

## 3. Tipografía

La tipografía del sistema no cambia de familia (se usan las fuentes nativas del sistema). Sin embargo, si en el futuro se quiere usar una fuente personalizada, la recomendada es:

- **Títulos:** *Inter* (pesos 700–900)
- **Cuerpo:** *Inter* (pesos 400–600)

> [!TIP]
> Para integrar Inter en Expo, se puede usar `@expo-google-fonts/inter` o `expo-font`.

---

## 4. Inventario de archivos a modificar

### 4.1 Archivo central del tema
> Este es el cambio con mayor impacto. Al modificar este archivo, **todos los componentes y pantallas** que leen de `colors` se actualizan automáticamente.

| Archivo | Cambio |
|---|---|
| [theme.ts](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/theme/theme.ts) | Reemplazar toda la paleta `colors` con los nuevos valores de la tabla §2 |

---

### 4.2 Splash screen (colores hardcoded + textos)
> El splash tiene entre 15 y 20 colores **escritos directamente** como literales hexadecimales (`#FF4500`, `#FF6A2A`), además de los textos "VOLT" y "GYM CLUB" y la letra "V" central.

| Archivo | Cambios |
|---|---|
| [SplashScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/SplashScreen.tsx) | • Reemplazar **todos** los `#FF4500` → `#00E5FF` |
| | • Reemplazar **todos** los `#FF6A2A` → `#33EEFF` |
| | • Línea 391: `"V"` → `"Z"` |
| | • Línea 399: `"VOLT"` → `"ZENITH"` |
| | • Línea 400: `"GYM CLUB"` → `"RENDIMIENTO"` |
| | • Línea 431: `rgba(255, 69, 0, 0.07)` → `rgba(0, 229, 255, 0.07)` |
| | • Línea 432: `shadowColor: '#FF4500'` → `'#00E5FF'` |
| | • Línea 448: `textShadowColor: rgba(255, 106, 42, 0.9)` → `rgba(0, 229, 255, 0.9)` |
| | • Línea 470: `textShadowColor: rgba(255, 69, 0, 0.3)` → `rgba(0, 229, 255, 0.3)` |

---

### 4.3 Pantallas con texto de marca

| Archivo | Línea | Antes | Después |
|---|---|---|---|
| [LoginScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/LoginScreen.tsx) | 85 | `"VOLT"` | `"ZENITH"` |
| [LoginScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/LoginScreen.tsx) | 86 | `"Gym club"` | `"Rendimiento"` |
| [LoginScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/LoginScreen.tsx) | 101 | `"atleta@volt.com"` | `"atleta@zenith.app"` |
| [RegisterScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/RegisterScreen.tsx) | 127 | `"Bienvenido a VOLT"` | `"Bienvenido a Zenith"` |
| [RegisterScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/RegisterScreen.tsx) | 202 | `"atleta@volt.com"` | `"atleta@zenith.app"` |
| [HomeScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/HomeScreen.tsx) | 241 | `"Entrenador VOLT"` | `"Entrenador Zenith"` |
| [AICoachScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/AICoachScreen.tsx) | 33 | `"Soy VOLT Coach"` | `"Soy Zenith Coach"` |
| [AICoachScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/AICoachScreen.tsx) | 102 | `"Entrenador VOLT"` | `"Entrenador Zenith"` |

---

### 4.4 Pantallas con colores hardcoded `#FF4500`

| Archivo | Líneas | Cambio |
|---|---|---|
| [ClassesScreen.tsx](file:///j:/App%20Volt-Gym/volt-gym-mobile/src/screens/ClassesScreen.tsx) | 206, 212, 340 | `#FF4500` → `colors.accent` (usar la referencia del tema, no otro hex) |

> [!IMPORTANT]
> En ClassesScreen los hardcoded deberían reemplazarse por `colors.accent` para evitar futuros desajustes en caso de otro cambio de branding.

---

### 4.5 Configuración de la app (Expo)

| Archivo | Cambio |
|---|---|
| [app.json](file:///j:/App%20Volt-Gym/volt-gym-mobile/app.json) | `"name"` → `"zenith"` |
| | `"slug"` → `"zenith"` |
| | `splash.backgroundColor` → `"#040D1A"` |
| | `android.adaptiveIcon.backgroundColor` → `"#040D1A"` |

| Archivo | Cambio |
|---|---|
| [package.json](file:///j:/App%20Volt-Gym/volt-gym-mobile/package.json) | `"name"` → `"zenith"` |

---

### 4.6 Backend — Textos de marca

| Archivo | Línea | Antes | Después |
|---|---|---|---|
| [main.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/main.py) | 5 | `"Volt-Gym API"` | `"Zenith API"` |
| [main.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/main.py) | 6 | `"Backend API for the Volt-Gym..."` | `"Backend API for the Zenith fitness application"` |
| [main.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/main.py) | 33 | `"Volt-Gym API is running"` | `"Zenith API is running"` |
| [ai_coach.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/adapters/api/v1/ai_coach.py) | 26 | `"entrenador personal con IA de Volt-Gym. Tu nombre es VOLT Coach"` | `"entrenador personal con IA de Zenith. Tu nombre es Zenith Coach"` |
| [ai_coach.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/adapters/api/v1/ai_coach.py) | 42 | `"generador de rutinas de entrenamiento de Volt-Gym"` | `"generador de rutinas de entrenamiento de Zenith"` |
| [llm_gateway.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/adapters/gateways/llm_gateway.py) | 209 | `"https://volt-gym.app"` | `"https://zenith-app.com"` |
| [llm_gateway.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/adapters/gateways/llm_gateway.py) | 210 | `"Volt-Gym AI Coach"` | `"Zenith AI Coach"` |

---

### 4.7 Backend — Infraestructura (opcionales, bajo riesgo)

> [!WARNING]
> Estos cambios son cosméticos y no afectan funcionalidad. Sin embargo, **renombrar la base de datos** requiere migrar los datos existentes. Se recomienda dejarlo como está o hacerlo cuando se despliegue en un entorno limpio.

| Archivo | Dato | Antes | Después | Nota |
|---|---|---|---|---|
| [settings.py](file:///j:/App%20Volt-Gym/volt-gym-backend/src/config/settings.py) | Default DB | `voltgym` | `zenith` | Solo el default; el `.env` configura la URL real |
| [docker-compose.yml](file:///j:/App%20Volt-Gym/volt-gym-backend/docker-compose.yml) | `POSTGRES_DB` | `voltgym` | `zenith` | Solo para entornos Docker nuevos |
| [docker-compose.yml](file:///j:/App%20Volt-Gym/volt-gym-backend/docker-compose.yml) | `DB_URL` | `...voltgym` | `...zenith` | Solo para entornos Docker nuevos |

---

### 4.8 Tests (referencias cosméticas)

| Archivo | Cambio |
|---|---|
| [test_user_entity.py](file:///j:/App%20Volt-Gym/volt-gym-backend/tests/test_user_entity.py) | `name="Volt"` → `name="Zenith"` |
| [test_log_session_use_case.py](file:///j:/App%20Volt-Gym/volt-gym-backend/tests/test_log_session_use_case.py) | `name="Volt"` (2 ocurrencias) → `name="Zenith"` |
| [test_ai_coach.py](file:///j:/App%20Volt-Gym/volt-gym-backend/tests/test_ai_coach.py) | `"VOLT Coach"` → `"Zenith Coach"` |

---

### 4.9 Assets gráficos

| Archivo | Acción |
|---|---|
| `assets/icon.png` | Regenerar con el logotipo "Z" de Zenith sobre fondo `#040D1A` |
| `assets/splash-icon.png` | Regenerar con el logotipo "Z" de Zenith |
| `assets/favicon.png` | Regenerar como "Z" mínima |
| `assets/android-icon-foreground.png` | Regenerar con el logotipo "Z" |
| `assets/android-icon-background.png` | Regenerar con fondo `#040D1A` |
| `assets/android-icon-monochrome.png` | Regenerar con la silueta "Z" |

---

## 5. Resumen de alcance

```
Total de archivos a modificar: ~18
├── Mobile (tema + pantallas)
│   ├── theme.ts                    → Paleta completa
│   ├── SplashScreen.tsx            → Colores hardcoded + textos + logo
│   ├── LoginScreen.tsx             → Textos de marca
│   ├── RegisterScreen.tsx          → Textos de marca
│   ├── HomeScreen.tsx              → Texto de marca
│   ├── AICoachScreen.tsx           → Textos de marca
│   ├── ClassesScreen.tsx           → Colores hardcoded
│   ├── app.json                    → Nombre, slug, colores de fondo
│   └── package.json                → Nombre del paquete
├── Backend
│   ├── main.py                     → Título y descripción de la API
│   ├── ai_coach.py                 → Prompts del sistema (nombre del coach)
│   ├── llm_gateway.py              → Headers HTTP de referencia
│   ├── settings.py                 → Default de base de datos (opcional)
│   ├── docker-compose.yml          → Nombre de DB (opcional)
│   └── tests/ (3 archivos)         → Nombres de prueba
└── Assets
    └── 6 archivos de iconos         → Regenerar con nueva identidad
```

> [!IMPORTANT]
> **Lo que NO cambia:** Rutas de navegación, nombres de componentes internos, lógica de negocio, endpoints de API, estructura de base de datos, ni el layout de ninguna pantalla. El cambio es exclusivamente visual y textual.
