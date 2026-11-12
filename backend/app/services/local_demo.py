"""Explicitly enabled, local-only mock identities. Not a production auth provider."""
from hashlib import sha256
from hmac import compare_digest
from secrets import token_urlsafe
from time import monotonic
from fastapi import HTTPException
from sqlalchemy import select
from app.core.config import get_settings
from app.models import Profile, Staff, Student
from app.seed import DEMO_ACCOUNTS, identifier, sample_records

PREFIX = 'kira_demo_'
SESSION_SECONDS = 7200
_sessions: dict[str, tuple[str, str, float]] = {}


def enabled():
    settings = get_settings()
    return settings.app_env == 'development' and settings.enable_local_demo and settings.database_url.startswith('sqlite:') and not settings.supabase_url


def require_enabled():
    if not enabled():
        raise HTTPException(404, 'Local demo access is disabled')


def seed_local_profiles(db):
    require_enabled()
    profiles = {}
    for role, email, _password, full_name in DEMO_ACCOUNTS:
        demo_id = identifier('local-demo-' + role)
        existing = db.scalar(select(Profile).where(Profile.email == email))
        if existing and existing.id != demo_id:
            raise RuntimeError('Demo email already belongs to another profile; use a fresh local demo database')
        person = db.get(Profile, demo_id)
        if not person:
            person = Profile(id=demo_id, email=email, full_name=full_name, role=role)
            db.add(person)
            db.flush()
            if role == 'student':
                db.add(Student(user_id=person.id, student_number='LOCAL-DEMO-001'))
            elif role == 'staff':
                db.add(Staff(user_id=person.id, title='Demo wellness professional', contact_email=email, areas=['Academic balance', 'General wellbeing']))
        profiles[role] = person
    db.commit()
    sample_records(db, profiles['student'], profiles['staff'])
    return profiles


def login(db, email, password):
    require_enabled()
    account = next((item for item in DEMO_ACCOUNTS if compare_digest(item[1].encode(), email.lower().strip().encode())), None)
    if not account or not compare_digest(account[2].encode(), password.encode()):
        raise HTTPException(401, 'Incorrect demo email or password')
    person = db.get(Profile, identifier('local-demo-' + account[0]))
    if not person:
        raise HTTPException(503, 'Run python -m app.seed --local-demo to prepare the mock accounts')
    if not person.active:
        raise HTTPException(403, 'This demo account is inactive')
    now = monotonic()
    for key, (_, _, expiry) in list(_sessions.items()):
        if expiry <= now:
            del _sessions[key]
    if len(_sessions) >= 256:
        raise HTTPException(429, 'Too many demo sessions. Restart the local backend to clear them.')
    token = PREFIX + token_urlsafe(32)
    _sessions[sha256(token.encode()).hexdigest()] = (person.id, person.email, now + SESSION_SECONDS)
    return person, token


def identity(token):
    require_enabled()
    key = sha256(token.encode()).hexdigest()
    session = _sessions.get(key)
    if not session or session[2] <= monotonic():
        _sessions.pop(key, None)
        raise HTTPException(401, 'Demo session expired. Please sign in again.')
    return {'id': session[0], 'email': session[1], 'user_metadata': {}}


def logout(token):
    require_enabled()
    _sessions.pop(sha256(token.encode()).hexdigest(), None)
