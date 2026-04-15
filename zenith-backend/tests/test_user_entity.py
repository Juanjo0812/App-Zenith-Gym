from uuid import uuid4

from src.domain.user.entities import UserEntity


def test_award_xp_uses_current_mobile_formula():
    user = UserEntity(id=uuid4(), name="Zenith", level=1, total_xp=495)

    leveled_up = user.award_xp(10, xp_per_level=500)

    assert leveled_up is True
    assert user.total_xp == 505
    assert user.level == 2
