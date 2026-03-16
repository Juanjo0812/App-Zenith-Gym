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
            raise ValueError("Session or User not found")
        
        # Complete session
        session.complete_session()
        
        # Gamification calculation logic (simplified for MVP)
        # Base XP: 50 for completing
        xp_earned = 50
        
        # Volume bonus: 1 XP per 100 kg
        xp_earned += int(session.total_volume // 100)
        
        # PR bonus: 20 XP per PR
        pr_count = sum(1 for s in session.sets if s.is_pr)
        xp_earned += (20 * pr_count)
        
        leveled_up = user.award_xp(xp_earned)
        
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
