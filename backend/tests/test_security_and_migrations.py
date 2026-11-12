from datetime import timedelta
from types import SimpleNamespace
from uuid import uuid4
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from alembic import command
from alembic.config import Config
from app.core.config import Settings, get_settings
from app.core.security import verified_identity
from app.database.base import utcnow
from app.database.session import make_engine
from app.seed import demo_users


def test_jwt_checks_signature_expiry_issuer_and_audience(monkeypatch):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    client = SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=key.public_key()))
    monkeypatch.setattr('app.core.security.jwks_client', lambda url: client)
    claims = {'sub': str(uuid4()), 'email': 'test@example.test', 'iss': get_settings().supabase_url + '/auth/v1', 'aud': 'authenticated', 'exp': utcnow() + timedelta(minutes=5)}
    def validate(payload, signing_key=key):
        return verified_identity(HTTPAuthorizationCredentials(scheme='Bearer', credentials=jwt.encode(payload, signing_key, algorithm='RS256')))
    assert validate(claims)['id'] == claims['sub']
    for changes in [{'exp': utcnow() - timedelta(seconds=1)}, {'iss': 'https://untrusted.invalid/auth/v1'}, {'aud': 'service_role'}, {'sub': 'not-a-uuid'}]:
        with pytest.raises(HTTPException) as error: validate({**claims, **changes})
        assert error.value.status_code == 401
    with pytest.raises(HTTPException): validate(claims, other_key)
    with pytest.raises(HTTPException): verified_identity(None)


def test_unsafe_production_configuration_is_rejected():
    with pytest.raises(ValueError): Settings(app_env='production', database_url='sqlite:///test.db')
    with pytest.raises(ValueError): Settings(app_env='production', database_url='postgresql+psycopg://x:x@localhost/db', enable_demo_accounts=True)
    with pytest.raises(ValueError): Settings(report_min_group_size=1)


def test_demo_seeding_cannot_run_in_test_or_production(context):
    _, factory, _ = context
    with factory() as db, pytest.raises(RuntimeError): demo_users(db)


def test_migration_upgrade_downgrade_and_reupgrade(tmp_path, monkeypatch):
    engine = make_engine('sqlite:///' + str(tmp_path / 'migrations.db'))
    monkeypatch.setattr('app.database.session.engine', engine)
    config = Config('alembic.ini')
    command.upgrade(config, 'head')
    from sqlalchemy import inspect
    assert 'wellness_questions' in inspect(engine).get_table_names()
    command.downgrade(config, 'base')
    assert 'profiles' not in inspect(engine).get_table_names()
    command.upgrade(config, 'head')
    assert 'profiles' in inspect(engine).get_table_names()
    engine.dispose()
