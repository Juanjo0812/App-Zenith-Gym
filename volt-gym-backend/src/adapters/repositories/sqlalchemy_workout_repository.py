from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional
from src.infrastructure.database.models import WorkoutSessionModel, SetLogModel, WorkoutRoutineModel
from src.domain.workout.entities import WorkoutSessionEntity, SetLog

class SQLAlchemyWorkoutRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, session_id: UUID) -> Optional[WorkoutSessionEntity]:
        result = await self.session.execute(
            select(WorkoutSessionModel)
            .options(selectinload(WorkoutSessionModel.sets))
            .where(WorkoutSessionModel.id == session_id)
        )
        db_session = result.scalars().first()
        if not db_session:
            return None
        
        return WorkoutSessionEntity(
            id=db_session.id,
            user_id=db_session.user_id,
            routine_id=db_session.routine_id,
            started_at=db_session.started_at,
            ended_at=db_session.ended_at,
            sets=[
                SetLog(
                    id=s.id,
                    exercise_id=s.exercise_id,
                    reps=s.reps,
                    weight_kg=float(s.weight_kg),
                    rest_seconds=s.rest_seconds,
                    is_pr=s.is_pr
                ) for s in db_session.sets
            ]
        )

    async def save(self, entity: WorkoutSessionEntity) -> None:
        result = await self.session.execute(
            select(WorkoutSessionModel).where(WorkoutSessionModel.id == entity.id)
        )
        db_session = result.scalars().first()
        
        if not db_session:
            db_session = WorkoutSessionModel(id=entity.id)
            self.session.add(db_session)
        
        db_session.user_id = entity.user_id
        db_session.routine_id = entity.routine_id
        db_session.started_at = entity.started_at
        db_session.ended_at = entity.ended_at
        
        # Simple set sync for MVP
        # In a real app we would check for new/updated/deleted sets
        for set_entity in entity.sets:
            # Check if set exists
            res = await self.session.execute(
                select(SetLogModel).where(SetLogModel.id == set_entity.id)
            )
            db_set = res.scalars().first()
            if not db_set:
                db_set = SetLogModel(id=set_entity.id, session_id=entity.id)
                self.session.add(db_set)
            
            db_set.exercise_id = set_entity.exercise_id
            db_set.reps = set_entity.reps
            db_set.weight_kg = set_entity.weight_kg
            db_set.rest_seconds = set_entity.rest_seconds
            db_set.is_pr = set_entity.is_pr

        await self.session.commit()
