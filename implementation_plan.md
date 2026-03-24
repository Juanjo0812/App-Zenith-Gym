# ⚡ Volt-Gym — Product & Architecture Plan (MVP Focus)

> **A modern, AI-powered fitness ecosystem for real gym environments, starting as a scalable Minimum Viable Product (MVP).**

---

## 1. Product Vision & Strategy

The Volt-Gym platform is designed to connect members, trainers, and gym operators through highly engaging, personalized experiences. This initial MVP is engineered to launch quickly and cost-effectively utilizing free-tier managed databases and established LLM APIs, while maintaining a robust, scalable architecture for future growth.

### 1.1 Core Objectives

- **Cost-Effective MVP**: Leverage managed free tiers (e.g., Supabase/Neon for Postgres, Upstash for Redis) and pay-as-you-go LLM APIs (OpenRouter, Groq).
- **Scalable Foundation**: Build on Python FastAPI and React Native.
- **Data-Driven Intelligence**: Centralize workout logs, nutrition, and recovery data to fuel the AI Fitness Coach and Smart Recommendations.

---

## 2. Core Features (MVP + Future Scope)

### 2.1 Workout Management

- Create custom workout routines.
- Log workouts in real-time.
- Track sets, reps, weights, and rest times.
- View granular workout history and personal records (PRs).

### 2.2 Exercise Library

- Structured database: `Name`, `Primary Muscle`, `Secondary Muscles`, `Equipment`, `Difficulty`, `Instructions`, `Video URL`.
- Used by human users for reference and by the AI for routine generation constraints.

### 2.3 Automatic Workout Generation

- AI generation parameters: Fitness goal (hypertrophy, endurance, fat loss), training frequency, equipment constraints, experience level, injury limitations.

### 2.4 Nutrition Planning

- Create and log daily meal plans.
- Granular tracking for calories, protein, carbs, and fats.
- AI Generation: Meal plans tailored to weight, caloric needs, fitness goals, and dietary restrictions (e.g., vegan, keto).

### 2.5 AI Fitness Coach (Conversational)

- LLM API integration acting as a personal trainer via **OpenRouter** and **Groq**.
- Answers training questions, generates customized workout and diet plans, and explains exercise mechanics organically.
- **Chat mode**: Uses Groq for ultra-low-latency conversational responses (Llama 3.3 70B).
- **Generation mode**: Uses OpenRouter for high-quality routine and meal plan generation (Llama 4 Maverick).
- Conversation history support for contextual responses.

### 2.6 Progress Tracking

- Dashboard visualizations for: Weight progression, strength gains (1RM charts), workout frequency calendars, and body measurements.
- *Status: Implemented (Backend + Frontend, replaced mock data).*

### 2.7 Smart Training Recommendations

- Modulates daily training intensity based on recovery signals (Sleep hours, perceived fatigue, previous session intensity).
- **Integrations**: Apple HealthKit, Android Health Connect (reads sleep, activity, HR).

### 2.8 Gamification System

- **Mechanics**: Experience points (XP) and level-ups, unlocking achievements and badges.
- **Social/Competitive**: Gym challenges (e.g., 30-day consistency), strength leaderboards, weekly competitions, and streak tracking.
- **Rewards**: Support for physical rewards (discounts, merch, recognition).
- *Status: Core mechanics implemented (Backend + Frontend, replaced mock data).*

### 2.9 Community and Gym Interaction

- Gym events calendar, local gym challenge participation, and localized rankings to build community allegiance.

### 2.10 Group Classes System

- **Class Types**: Configurable types (Funcional, Step, Cardio box, etc.) with colors and icons.
- **Schedule Management**: Weekly calendar with scheduled classes including instructor, capacity, location, and time.
- **Enrollment System**: Users can enroll/unenroll, view available capacity, and see their upcoming classes.
- **Role-Based Access**:
  - `user`: View schedule, enroll/unenroll from classes.
  - `coach`: All user actions + view enrollment lists for their assigned classes.
  - `admin`: All actions + create/edit/delete class types and scheduled classes.
- **Home Integration**: Upcoming classes preview card on the HomeScreen with direct navigation to the full schedule.

### 2.11 Future Feature: Computer Vision Analysis (Phase 2)

- Architecture will support an async pipeline for video processing.
- Goal: Posture detection, automated rep counting, and technique feedback.

---

## 3. High-Level System Architecture

We employ **Domain-Driven Design (DDD)** combined with **Clean Architecture/Hexagonal Architecture** principles to ensure the system is decoupleable and highly testable.

### 3.1 Bounded Contexts

1. **Identity & Community Context**: Auth, Profiles, Gym Interactions.
2. **Fitness Context**: Workouts, Exercise Library, Nutrition, Progress.
3. **Intelligence Context**: AI Coach, Smart Recommendations, Future CV.
4. **Gamification Context**: XP, Badges, Streaks, Leaderboards.
5. **Classes Context**: Class Types, Scheduled Classes, Enrollments.

### 3.2 Technology Stack Justification

| Layer              | Technology                | Why it's appropriate for a Modern Startup                                                                                                       |
| ------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile App**     | React Native + TypeScript | Universal code base (iOS/Android), fast iteration, OTA updates via Expo, rich ecosystem.                                                        |
| **Backend API**    | Python FastAPI            | Incredible performance, native async support, auto-generating interactive Swagger docs, and Python's unequaled AI/Data Science ecosystem.       |
| **Database**       | PostgreSQL                | robust relational integrity mapping perfectly to complex workout and nutrition hierarchies. Easily hosted on free tiers (Neon/Supabase/Render). |
| **Caching/KV**     | Redis                     | Essential for fast read operations, XP leaderboards (Sorted Sets), and rate limiting. Free tier viable on Upstash.                              |
| **AI Integration** | OpenRouter / Groq         | Abstracts underlying LLMs (Llama 3, GPT-4, Claude). Groq offers ultra-low latency ideal for a conversational coach.                             |
| **Infra/Deploy**   | Docker, Render/Vercel/AWS | Docker guarantees environment parity. Render or AWS App Runner provides zero-ops scalable container hosting for the MVP.                        |

---

## 4. Backend Service Architecture (Clean Architecture)

```
volt-gym-backend/
├── src/
│   ├── main.py                     # FastAPI application factory
│   ├── config/                     # Environment variables, DB connection settings
│   │   ├── settings.py
│   │   ├── alembic.py              # Alembic URL configuration
│   │   └── dependencies.py         # Dependency Injection
│   │
│   ├── domain/                     # 🔵 CORE BUSINESS LOGIC (Entities & Interfaces)
│   │   ├── user/                   # Identity bounded context
│   │   ├── workout/                # Fitness bounded context
│   │   ├── nutrition/              # Diet bounded context
│   │   ├── classes/                # Group classes bounded context
│   │   ├── gamification/           # Badges, XP bounded context
│   │   └── ai/                     # Intelligence bounded context
│   │
│   ├── use_cases/                  # 🟢 APPLICATION LOGIC (Interactors)
│   │   ├── generate_workout.py
│   │   ├── log_session_apply_xp.py # Cross-domain orchestration
│   │   └── update_recovery_state.py
│   │
│   ├── adapters/                   # 🟡 INTERFACE ADAPTERS
│   │   ├── api/                    # FastAPI Routes (Controllers)
│   │   │   ├── v1/
│   │   │   │   ├── workouts.py
│   │   │   │   ├── exercises.py
│   │   │   │   ├── users.py
│   │   │   │   ├── classes.py
│   │   │   │   └── ai_coach.py
│   │   ├── repositories/           # SQLAlchemy / asyncpg Repositories
│   │   │   ├── sqlalchemy_workout_repo.py
│   │   │   ├── sqlalchemy_user_repo.py
│   │   │   └── sqlalchemy_exercise_repo.py
│   │   └── gateways/               # External APIs
│   │       ├── llm_gateway.py      # OpenRouter / Groq LLM adapter
│   │       └── health_gateway.py   # HealthKit data normalization
│   │
│   └── infrastructure/             # 🔴 FRAMEWORKS & DRIVERS
│       ├── database/               # SQLAlchemy Base, Migrations (Alembic)
│       ├── redis/                  # Redis client
│       └── auth/                   # Supabase JWT validation
│
├── tests/
├── Dockerfile
├── requirements.txt
└── alembic/                        # Migration scripts
```

---

## 5. Database Schema (PostgreSQL)

### 5.1 Entities Mapping

```sql
-- Identity & Auth (Supabase Auth integration)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    profile_image_url TEXT,
    avatar_url TEXT,
    phone_number VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    level INT DEFAULT 1,
    total_xp INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Roles System
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);
-- Default roles to insert: 'user', 'coach', 'admin'

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Coaching Relationship
CREATE TABLE coach_clients (
    coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (coach_id, client_id)
);

-- Fitness Context: Library
CREATE TABLE exercises (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    primary_muscle VARCHAR(100),
    secondary_muscles TEXT[],
    equipment VARCHAR(100),
    difficulty VARCHAR(50),
    instructions TEXT,
    video_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true
);

-- Fitness Context: Workouts
CREATE TABLE workout_routines (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    is_ai_generated BOOLEAN
);

CREATE TABLE routine_exercises (
    id UUID PRIMARY KEY,
    routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    order_index INT DEFAULT 0,
    target_sets INT DEFAULT 3,
    target_reps INT DEFAULT 10,
    target_weight_kg DECIMAL DEFAULT 0.0
);

CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    routine_id UUID REFERENCES workout_routines(id),
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE set_logs (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES workout_sessions(id),
    exercise_id UUID REFERENCES exercises(id),
    reps INT,
    weight_kg DECIMAL,
    rest_seconds INT,
    is_pr BOOLEAN
);

-- Nutrition Context
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    target_calories INT,
    target_protein INT,
    target_carbs INT,
    target_fats INT,
    date DATE
);

CREATE TABLE meals_logged (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    food_name VARCHAR(255),
    calories INT,
    protein INT,
    carbs INT,
    fats INT,
    logged_at TIMESTAMP
);

-- Intelligence Context: Recovery
CREATE TABLE recovery_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    date DATE,
    sleep_hours DECIMAL,
    fatigue_score INT,  -- 1-10
    source VARCHAR(50)  -- 'manual', 'healthkit', 'health_connect'
);

-- Group Classes Context
CREATE TABLE class_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#FF4500',
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scheduled_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    max_capacity INT DEFAULT 20,
    location VARCHAR(255) DEFAULT 'Sala principal',
    notes TEXT,
    is_cancelled BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_class_id UUID REFERENCES scheduled_classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'enrolled',
    UNIQUE(scheduled_class_id, user_id)
);
```

---

## 6. API Endpoint Structure

### 6.1 Workouts & Exercises

- `GET /api/v1/exercises` — Filterable by muscle, equipment.
- `GET /api/v1/workouts/routines` — List user's custom routines with their exercises.
- `POST /api/v1/workouts/routines` — Create a new routine with included exercises.
- `PUT /api/v1/workouts/routines/{routine_id}` — Update routine name and embedded exercises.
- `DELETE /api/v1/workouts/routines/{routine_id}` — Remove a custom routine.
- `POST /api/v1/workouts/sessions` — Start a session.
- `POST /api/v1/workouts/sessions/{session_id}/sets` — Log sets sequentially.

### 6.2 Nutrition

- `GET /api/v1/nutrition/targets` — Get current daily macros.
- `POST /api/v1/nutrition/meals` — Log a meal.

### 6.3 Intelligence & Recommendations

- `POST /api/v1/ai/workout-plans` — AI-generated workout plan via OpenRouter/Groq.
- `POST /api/v1/ai/chat-messages` — Conversational fitness coach with history support.
- `POST /api/v1/recovery/sync` — Endpoint for mobile app to post HealthKit batches.
- `GET /api/v1/recommendations/daily` — Get the modulated daily smart recommendation.

### 6.4 Gamification

- `GET /api/v1/gamification/leaderboard?type=strength|attendance`
- `GET /api/v1/gamification/badges`
- `GET /api/v1/community/challenges`

### 6.5 Group Classes

- `GET /api/v1/classes/types` — List all class types.
- `POST /api/v1/classes/types` — Create class type (admin only).
- `GET /api/v1/classes/schedule` — View weekly schedule (filterable by date range).
- `POST /api/v1/classes/schedule` — Create scheduled class (admin/coach).
- `PUT /api/v1/classes/schedule/{id}` — Update scheduled class (admin/coach).
- `DELETE /api/v1/classes/schedule/{id}` — Delete scheduled class (admin only).
- `POST /api/v1/classes/{class_id}/enroll` — Enroll in a class.
- `DELETE /api/v1/classes/{class_id}/enroll` — Unenroll from a class.
- `GET /api/v1/classes/{class_id}/enrollments` — List enrolled users (coach/admin).

---

## 7. AI Integration Architecture

### 7.1 The AI Translation Layer

The `LLMGateway` adapter in `src/adapters/gateways/llm_gateway.py` connects to external LLM APIs:

- **Coach Chat (Groq)**: Fast, conversational model (Llama 3.3 70B) for sub-second responses.
- **Routine Generation (OpenRouter)**: Instruction-following model (Llama 4 Maverick) for structured JSON output.
- **Fallback**: If one provider is unavailable, the gateway falls back to the other automatically.
- **Routing Layer**: Provider/model resolution is now designed per use case, so future features can choose provider and model independently for chat, generation, summaries, recommendations, or agentic actions.
- **Prompt Engineering**: System prompts inject app persona and conversation context today, while leaving room for structured user/profile/training/class context in future iterations.

### 7.2 Environment Configuration

All AI API keys are loaded from the backend `.env` file:

```env
# --- AI / LLM Providers ---
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=meta-llama/llama-4-maverick        # Optional, has default
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile                  # Optional, has default

# --- Optional use-case routing overrides ---
AI_CHAT_PROVIDER=groq                               # Optional
AI_CHAT_MODEL=llama-3.3-70b-versatile              # Optional
AI_GENERATION_PROVIDER=openrouter                  # Optional
AI_GENERATION_MODEL=meta-llama/llama-4-maverick   # Optional
AI_FALLBACK_ENABLED=true                           # Optional, default true

# --- Future AI capabilities (disabled by default) ---
AI_AGENTIC_ACTIONS_ENABLED=false
AI_CONTEXT_PROFILE_ENABLED=false
AI_CONTEXT_WORKOUT_ENABLED=false
AI_CONTEXT_CLASSES_ENABLED=false
```

If the optional `AI_*` routing variables are not set, the current MVP defaults remain unchanged:

- Chat: Groq first, OpenRouter fallback
- Generation: OpenRouter first, Groq fallback

### 7.3 Future Provider Orchestration Roadmap

The current failover strategy is intentionally simple for the MVP. Future routing improvements may include:

1. **Per-task routing**: Different providers/models for chat, workout generation, meal generation, summaries, or recovery recommendations.
2. **Health-aware failover**: Temporary provider cooldown after repeated `401`, `429`, timeout, or `5xx` responses.
3. **Interleaving / round-robin**: Alternate providers when both are healthy to distribute load or compare latency/cost.
4. **Cost-aware routing**: Prefer lower-cost models for lightweight queries and reserve premium models for structured or high-value generations.
5. **Capability-aware routing**: Use models optimized for tool use, JSON generation, reasoning depth, or fast conversational chat depending on the task.

### 7.4 Future Agentic App Actions

The AI coach is currently conversational and advisory. A future agentic layer can allow the assistant to operate inside Volt-Gym through explicit backend actions, such as:

- Create or update a workout routine
- Enroll the user into a scheduled class
- Log a completed workout session
- Suggest and confirm nutrition targets
- Trigger recovery sync or daily recommendation refresh

To support this safely, the architecture should evolve toward:

1. **Structured app context injection**: Summaries of profile, goals, recent workouts, recovery signals, and upcoming classes included in prompts only when enabled.
2. **Action catalog / tool registry**: A bounded set of explicit backend actions exposed to the assistant instead of free-form side effects.
3. **Confirmation gates**: Mutating actions require explicit user confirmation before execution.
4. **Auditability**: Persist action intents, confirmations, and outcomes for traceability.
5. **Role-aware permissions**: Actions must respect the user's role (`user`, `coach`, `admin`) and ownership rules.

---

## 8. Smart Recommendation System

The Smart Recommendation engine uses a **Rules + AI Hybrid** approach:

1. **Data Ingestion**: React Native app pulls from Apple HealthKit / Android Health Connect periodically.
2. **Normalization**: Health data (Sleep, Resting HR) is sent to `/api/v1/recovery/sync`.
3. **Modulation Script (Domain Logic)**:
   - If Sleep < 5 hours && Fatigue > 8: Reduce volume by 30%, suggest restorative movements.
   - If Sleep > 7 hours && prior intensity was Low: Suggest High-intensity session or PR attempts.
4. **AI Processing**: The rule constraints are mapped into the LLM prompt to generate the _exact_ recommended variation of the user's primary routine.

---

## 9. Gamification System Architecture

A robust gamification engine using Event-Driven principles within the monolith:

- When a `SetLog` is saved, the Use Case fires a `WorkoutLoggedEvent`.
- The Gamification Service listens to this event asynchronously.
- Evaluates Rules:
  - Did standard set? -> +5 XP
  - Was it a PR? -> +50 XP, trigger `BadgeUnlockedEvent('strength_pr')`.
- Redis Sorted Sets maintain the leaderboards efficiently: `ZINCRBY leaderboard:strength:week42 50 user_uuid`.

---

## 10. Future Extensibility: Computer Vision (Phase 2)

**Architectural Preparation**:

- FastAPI is highly complementary to ML workloads.
- We will isolate CV into a separate worker service to prevent CPU-blocking the web requests.
- **Workflow**:
  1. Frontend React Native records video clips.
  2. Video uploaded to S3/Cloudflare R2 via presigned URL.
  3. Message pushed to a queue (e.g., Redis Celery/RQ or AWS SQS).
  4. Python CV Worker (utilizing MediaPipe Pose / YOLO) processes the video.
  5. Worker issues a Webhook back to the main API with `reps_counted` and `form_score`.
  6. Results pushed to client via WebSockets.

---
