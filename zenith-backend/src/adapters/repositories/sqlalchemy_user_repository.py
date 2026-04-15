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
            name=db_user.name,
            level=db_user.level or 1,
            total_xp=db_user.total_xp or 0
        )

    async def ensure_exists(
        self,
        user_id: UUID,
        name: Optional[str] = None,
    ) -> UserEntity:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        db_user = result.scalars().first()
        should_commit = False

        if not db_user:
            db_user = UserModel(
                id=user_id,
                name=name,
                level=1,
                total_xp=0,
            )
            self.session.add(db_user)
            should_commit = True
        else:
            if not db_user.name and name:
                db_user.name = name
                should_commit = True
            if db_user.level is None:
                db_user.level = 1
                should_commit = True
            if db_user.total_xp is None:
                db_user.total_xp = 0
                should_commit = True

        if should_commit:
            await self.session.commit()
            await self.session.refresh(db_user)

        return UserEntity(
            id=db_user.id,
            name=db_user.name,
            level=db_user.level or 1,
            total_xp=db_user.total_xp or 0,
        )

    async def save(self, entity: UserEntity) -> None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == entity.id)
        )
        db_user = result.scalars().first()
        
        if not db_user:
            db_user = UserModel(id=entity.id)
            self.session.add(db_user)
            
        db_user.name = entity.name
        db_user.level = entity.level
        db_user.total_xp = entity.total_xp
        
        await self.session.commit()
