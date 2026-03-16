from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import Optional
from src.infrastructure.database.models import UserModel
from src.domain.user.entities import UserEntity

class SQLAlchemyUserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: UUID) -> Optional[UserEntity]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        db_user = result.scalars().first()
        if not db_user:
            return None
            
        return UserEntity(
            id=db_user.id,
            email=db_user.email,
            name=db_user.name,
            level=db_user.level,
            total_xp=db_user.total_xp
        )

    async def save(self, entity: UserEntity) -> None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == entity.id)
        )
        db_user = result.scalars().first()
        
        if not db_user:
            db_user = UserModel(id=entity.id)
            self.session.add(db_user)
            
        db_user.email = entity.email
        db_user.name = entity.name
        db_user.level = entity.level
        db_user.total_xp = entity.total_xp
        
        await self.session.commit()
