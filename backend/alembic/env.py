from alembic import context
from sqlalchemy import text
from app.database.base import Base
from app.database.session import engine
from app.models import entities

target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(url=str(engine.url), target_metadata=target_metadata, literal_binds=True, include_schemas=True, version_table_schema='kira' if engine.dialect.name == 'postgresql' else None)
    if engine.dialect.name == 'postgresql':
        context.execute('CREATE SCHEMA IF NOT EXISTS kira')
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine.connect() as connection:
        if engine.dialect.name == 'postgresql':
            connection.execute(text('CREATE SCHEMA IF NOT EXISTS kira'))
            connection.commit()
        context.configure(connection=connection, target_metadata=target_metadata, include_schemas=True, compare_type=True, version_table_schema='kira' if engine.dialect.name == 'postgresql' else None)
        with context.begin_transaction():
            context.run_migrations()
