from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Zenith API",
    description="API backend de la aplicacion Zenith de fitness",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.adapters.api.v1 import ai_coach, classes, exercises, nutrition, progress, users, workouts

# Include API routers
app.include_router(workouts.router, prefix="/api/v1")
app.include_router(ai_coach.router, prefix="/api/v1")
app.include_router(exercises.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(classes.router, prefix="/api/v1")
app.include_router(nutrition.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Zenith API en funcionamiento"}
