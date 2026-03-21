from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class UserEntity(BaseModel):
    """Minimal user aggregate used by the training core."""
    id: UUID
    name: Optional[str] = None
    level: int = Field(default=1, ge=1)
    total_xp: int = Field(default=0, ge=0)

    def award_xp(self, xp: int, xp_per_level: int = 500) -> bool:
        """Business rule: Add XP. Returns True if leveled up."""
        self.total_xp += xp
        new_level = max(1, (self.total_xp // xp_per_level) + 1)
        has_leveled_up = new_level > self.level
        self.level = new_level
        return has_leveled_up
