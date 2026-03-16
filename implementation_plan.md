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
- LLM API integration acting as a personal trainer.
- Answers training questions, generates customized workout and diet plans, and explains exercise mechanics organically.

### 2.6 Progress Tracking
- Dashboard visualizations for: Weight progression, strength gains (1RM charts), workout frequency calendars, and body measurements.

### 2.7 Smart Training Recommendations
- Modulates daily training intensity based on recovery signals (Sleep hours, perceived fatigue, previous session intensity).
- **Integrations**: Apple HealthKit, Android Health Connect (reads sleep, activity, HR).

### 2.8 Gamification System
- **Mechanics**: Experience points (XP) and level-ups, unlocking achievements and badges.
- **Social/Competitive**: Gym challenges (e.g., 30-day consistency), strength leaderboards, weekly competitions, and streak tracking.
- **Rewards**: Support for physical rewards (discounts, merch, recognition).

### 2.9 Community and Gym Interaction
- Gym events calendar, local gym challenge participation, and localized rankings to build community allegiance.

### 2.10 Future Feature: Computer Vision Analysis (Phase 2)
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

### 3.2 Technology Stack Justification

| Layer | Technology | Why it's appropriate for a Modern Startup |
|-------|-----------|------------------------------------------|
| **Mobile App** | React Native + TypeScript | Universal code base (iOS/Android), fast iteration, OTA updates via Expo, rich ecosystem. |
| **Backend API** | Python FastAPI | Incredible performance, native async support, auto-generating interactive Swagger docs, and Python's unequaled AI/Data Science ecosystem. |
| **Database** | PostgreSQL | robust relational integrity mapping perfectly to complex workout and nutrition hierarchies. Easily hosted on free tiers (Neon/Supabase/Render). |
| **Caching/KV** | Redis | Essential for fast read operations, XP leaderboards (Sorted Sets), and rate limiting. Free tier viable on Upstash. |
| **AI Integration**| OpenRouter / Groq | Abstracts underlying LLMs (Llama 3, GPT-4, Claude). Groq offers ultra-low latency ideal for a conversational coach. |
| **Infra/Deploy**| Docker, Render/Vercel/AWS | Docker guarantees environment parity. Render or AWS App Runner provides zero-ops scalable container hosting for the MVP. |

---

## 4. Backend Service Architecture (Clean Architecture)

```
volt-gym-backend/
├── src/
│   ├── main.py                     # FastAPI application factory
│   ├── config/                     # Environment variables, DB connection settings
│   │   ├── settings.py
│   │   └── dependencies.py         # Dependency Injection
│   │
│   ├── domain/                     # 🔵 CORE BUSINESS LOGIC (Entities & Interfaces)
│   │   ├── user/                   # Identity bounded context
│   │   ├── workout/                # Fitness bounded context
│   │   ├── nutrition/              # Diet bounded context
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
│   │   │   │   └── ai_coach.py
│   │   ├── repositories/           # SQLAlchemy / asyncpg Repositories
│   │   │   └── postgres_workout_repo.py
│   │   └── gateways/               # External APIs
│   │       ├── llm_gateway.py      # Groq / OpenRouter calls
│   │       └── health_gateway.py   # HealthKit data normalization
│   │
│   └── infrastructure/             # 🔴 FRAMEWORKS & DRIVERS
│       ├── database/               # SQLAlchemy Base, Migrations (Alembic)
│       ├── redis/                  # Redis client
│       └── auth/                   # JWT validation, Hashing
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
-- Identity
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    level INT DEFAULT 1,
    total_xp INT DEFAULT 0,
    created_at TIMESTAMP
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
    video_url TEXT
);

-- Fitness Context: Workouts
CREATE TABLE workout_routines (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    is_ai_generated BOOLEAN
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
```

---

## 6. API Endpoint Structure

### 6.1 Workouts & Exercises
- `GET /api/v1/exercises` — Filterable by muscle, equipment.
- `POST /api/v1/workouts/routines` — Create a custom routine.
- `POST /api/v1/workouts/sessions` — Start a session.
- `POST /api/v1/workouts/sessions/{session_id}/sets` — Log sets sequentially.

### 6.2 Nutrition
- `GET /api/v1/nutrition/targets` — Get current daily macros.
- `POST /api/v1/nutrition/meals` — Log a meal.

### 6.3 Intelligence & Recommendations
- `POST /api/v1/ai/workout/generate` — Async payload requesting an AI tailored plan.
- `POST /api/v1/ai/nutrition/generate` — Request an AI dietary plan.
- `POST /api/v1/ai/chat` — Streaming conversational socket for the fitness coach.
- `POST /api/v1/recovery/sync` — Endpoint for mobile app to post HealthKit batches.
- `GET /api/v1/recommendations/daily` — Get the modulated daily smart recommendation.

### 6.4 Gamification
- `GET /api/v1/gamification/leaderboard?type=strength|attendance`
- `GET /api/v1/gamification/badges`
- `GET /api/v1/community/challenges`

---

## 7. AI Integration Architecture

### 7.1 The AI Translation Layer
Instead of coupling directly to OpenAI, the `LLMGateway` (Adapter) connects to an aggregator like **OpenRouter**.
- **Coach Chat**: Fast, conversational models (e.g. Llama 3 on Groq for sub-second TTFT).
- **Routine Generation**: Instruction-following models (e.g. GPT-4o or Claude 3.5 Sonnet). 
- **Prompt Engineering**: System prompts inject the user's `recovery_log` aggregate, current 1RMs, and `exercise` database schema so routines map exactly to known database UUIDs.

---

## 8. Smart Recommendation System

The Smart Recommendation engine uses a **Rules + AI Hybrid** approach:
1. **Data Ingestion**: React Native app pulls from Apple HealthKit / Android Health Connect periodically.
2. **Normalization**: Health data (Sleep, Resting HR) is sent to `/api/v1/recovery/sync`.
3. **Modulation Script (Domain Logic)**:
   - If Sleep < 5 hours && Fatigue > 8: Reduce volume by 30%, suggest restorative movements.
   - If Sleep > 7 hours && prior intensity was Low: Suggest High-intensity session or PR attempts.
4. **AI Processing**: The rule constraints are mapped into the LLM prompt to generate the *exact* recommended variation of the user's primary routine.

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

## User Review Required

> [!TIP]
> **Actionable Next Steps**  
> With this architecture finalized for the MVP:
> 1. Next step is scaffolding the React Native + Expo App.
> 2. Then, creating the foundational FastAPI project with SQLAlchemy.
> 3. Spinning up Docker containers for local dev (Postgres, Redis).
> 
> Are you conceptually aligned with this FastAPI + Postgres MVP stack? If yes, I will begin implementing the initial frontend and backend structures.
