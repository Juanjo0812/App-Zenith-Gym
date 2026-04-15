from alembic.config import Config

from src.config.alembic import configure_alembic_url, get_alembic_database_url
from src.config.settings import get_settings


def test_alembic_uses_the_same_database_url_as_runtime_settings():
    config = Config()

    configure_alembic_url(config)

    assert get_alembic_database_url() == get_settings().db_url
    assert config.get_main_option("sqlalchemy.url") == get_settings().db_url
