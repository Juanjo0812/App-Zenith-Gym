from uuid import UUID
from typing import Optional
from src.domain.workout.entities import WorkoutSessionEntity
from src.domain.user.entities import UserEntity

class LogSessionUseCase:
    """
    Use Case: Completes a workout session and calculates the gamification XP based on the volume and PRs.
    """
    def __init__(self, workout_repo, user_repo):
        self.workout_repo = workout_repo
        self.user_repo = user_repo

    async def execute(self, session_id: UUID, user_id: UUID) -> dict:
        # Load entities via repositories
        session: Optional[WorkoutSessionEntity] = await self.workout_repo.get_by_id(session_id)
        user: Optional[UserEntity] = await self.user_repo.get_by_id(user_id)
        
        if not session or not user:
            raise ValueError("La sesión o el usuario no existen")
        if session.user_id != user_id:
            raise PermissionError("No tienes permisos para completar esta sesión")
        if session.ended_at is not None:
            raise ValueError("La sesión ya fue completada")
        
        # Complete session
        session.complete_session()
        
        # Keep the current visible mobile formula during the migration.
        xp_earned = len(session.sets) * 5
        
        leveled_up = user.award_xp(xp_earned, xp_per_level=500)
        
        # Persist changes
        await self.workout_repo.save(session)
        await self.user_repo.save(user)
        
        return {
            "session_id": session.id,
            "xp_earned": xp_earned,
            "new_total_xp": user.total_xp,
            "new_level": user.level,
            "leveled_up": leveled_up
        }
