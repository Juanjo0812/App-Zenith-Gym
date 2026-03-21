from alembic.config import Config

from src.config.settings import get_settings


def get_alembic_database_url() -> str:
    return get_settings().db_url


def configure_alembic_url(config: Config) -> None:
    database_url = get_alembic_database_url().replace("%", "%%")
    config.set_main_option("sqlalchemy.url", database_url)
