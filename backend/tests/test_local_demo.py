from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from app.core.config import Settings
from app.core.security import verified_identity
from app.main import app
from app.models import Profile
from app.services import local_demo


@pytest.fixture
def local(context, monkeypatch):
    client, factory, people = context
    settings = SimpleNamespace(app_env='development', enable_local_demo=True, database_url='sqlite:///mock.db', supabase_url='')
    monkeypatch.setattr(local_demo, 'get_settings', lambda: settings)
    local_demo._sessions.clear()
    with factory() as db:
        profiles = local_demo.seed_local_profiles(db)
    app.dependency_overrides.pop(verified_identity, None)
    yield client, factory, profiles, settings
    local_demo._sessions.clear()


@pytest.mark.parametrize('role,password,path', [
    ('student', 'Student@123', '/student/dashboard'),
    ('staff', 'Staff@123', '/staff/dashboard'),
    ('admin', 'Admin@123', '/admin/dashboard'),
])
def test_local_roles_sign_in_without_supabase(local, role, password, path):
    client, _, _, _ = local
    response = client.post('/api/v1/auth/local-demo/login', json={'email': role + '@wellness.test', 'password': password})
    assert response.status_code == 200
    result = response.json()
    assert result['profile']['role'] == role
    assert result['access_token'].startswith('kira_demo_')
    headers = {'Authorization': 'Bearer ' + result['access_token']}
    dashboard = client.get('/api/v1' + path, headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()['profile']['role'] == role
    assert client.get('/api/v1/auth/me', headers=headers).status_code == 200


def test_mock_student_cannot_access_staff_or_admin_and_logout_revokes_token(local):
    client, _, _, _ = local
    token = client.post('/api/v1/auth/local-demo/login', json={'email': 'student@wellness.test', 'password': 'Student@123'}).json()['access_token']
    headers = {'Authorization': 'Bearer ' + token}
    assert client.get('/api/v1/admin/dashboard', headers=headers).status_code == 403
    assert client.get('/api/v1/staff/dashboard', headers=headers).status_code == 403
    assert client.post('/api/v1/auth/local-demo/logout', headers=headers).status_code == 200
    assert client.get('/api/v1/auth/me', headers=headers).status_code == 401


def test_local_demo_rejects_wrong_password_forged_token_and_inactive_account(local):
    client, factory, profiles, _ = local
    assert client.post('/api/v1/auth/local-demo/login', json={'email': 'admin@wellness.test', 'password': 'wrong'}).status_code == 401
    assert client.get('/api/v1/admin/dashboard', headers={'Authorization': 'Bearer kira_demo_forged'}).status_code == 401
    with factory() as db:
        db.get(Profile, profiles['student'].id).active = False
        db.commit()
    assert client.post('/api/v1/auth/local-demo/login', json={'email': 'student@wellness.test', 'password': 'Student@123'}).status_code == 403


def test_local_demo_disabled_mode_rejects_existing_sessions(local):
    client, _, _, settings = local
    token = client.post('/api/v1/auth/local-demo/login', json={'email': 'student@wellness.test', 'password': 'Student@123'}).json()['access_token']
    settings.enable_local_demo = False
    assert client.post('/api/v1/auth/local-demo/login', json={'email': 'student@wellness.test', 'password': 'Student@123'}).status_code == 404
    assert client.get('/api/v1/auth/me', headers={'Authorization': 'Bearer ' + token}).status_code == 404


def test_local_demo_configuration_cannot_target_production_or_supabase():
    for data in [
        {'app_env': 'production'},
        {'app_env': 'test'},
        {'app_env': 'development', 'database_url': 'postgresql+psycopg://user:example@localhost/postgres'},
        {'app_env': 'development', 'supabase_url': 'https://project.supabase.co'},
    ]:
        with pytest.raises(ValueError):
            Settings(enable_local_demo=True, database_url=data.get('database_url', 'sqlite:///mock.db'), supabase_url=data.get('supabase_url', ''), **{key: value for key, value in data.items() if key not in ('database_url', 'supabase_url')})
