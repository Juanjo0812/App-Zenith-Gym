from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import List, Optional

from src.infrastructure.database.models import ExerciseModel
from src.domain.workout.entities import ExerciseEntity


class SQLAlchemyExerciseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_all(
        self,
        muscle: Optional[str] = None,
        equipment: Optional[str] = None,
    ) -> List[ExerciseEntity]:
        query = select(ExerciseModel)

        if muscle:
            query = query.where(ExerciseModel.primary_muscle.ilike(f"%{muscle}%"))
        if equipment:
            query = query.where(ExerciseModel.equipment.ilike(f"%{equipment}%"))

        query = query.order_by(ExerciseModel.primary_muscle, ExerciseModel.name)
        result = await self.session.execute(query)
        rows = result.scalars().all()

        return [
            ExerciseEntity(
                id=row.id,
                name=row.name,
                primary_muscle=row.primary_muscle,
                secondary_muscles=row.secondary_muscles or [],
                equipment=row.equipment,
                difficulty=row.difficulty,
                instructions=row.instructions,
                video_url=row.video_url,
            )
            for row in rows
        ]

    async def get_by_id(self, exercise_id: UUID) -> Optional[ExerciseEntity]:
        result = await self.session.execute(
            select(ExerciseModel).where(ExerciseModel.id == exercise_id)
        )
        row = result.scalars().first()
        if not row:
            return None

        return ExerciseEntity(
            id=row.id,
            name=row.name,
            primary_muscle=row.primary_muscle,
            secondary_muscles=row.secondary_muscles or [],
            equipment=row.equipment,
            difficulty=row.difficulty,
            instructions=row.instructions,
            video_url=row.video_url,
        )
