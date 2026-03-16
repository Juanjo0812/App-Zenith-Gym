from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4

class UserLevel(BaseModel):
    level: int = 1
    total_xp: int = 0

class UserEntity(BaseModel):
    """Core domain entity for a User"""
    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    name: str
    level: UserLevel = Field(default_factory=UserLevel)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def award_xp(self, xp: int) -> bool:
        """Business rule: Add XP. Returns True if leveled up."""
        self.level.total_xp += xp
        new_level = int((self.level.total_xp / 100) ** 0.5) + 1
        has_leveled_up = new_level > self.level.level
        self.level.level = new_level
        return has_leveled_up
