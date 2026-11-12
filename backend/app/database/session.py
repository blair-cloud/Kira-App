from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings


def make_engine(url: str):
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql+psycopg://', 1)
    elif url.startswith('postgresql://'):
        url = url.replace('postgresql://', 'postgresql+psycopg://', 1)
    kwargs = {'pool_pre_ping': True}
    if url.startswith('sqlite'):
        kwargs.update(connect_args={'check_same_thread': False}, execution_options={'schema_translate_map': {'kira': None}})
    engine = create_engine(url, **kwargs)
    if url.startswith('sqlite'):
        @event.listens_for(engine, 'connect')
        def sqlite_fk(connection, _):
            connection.execute('PRAGMA foreign_keys=ON')
    return engine


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
