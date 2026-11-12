import os
from uuid import uuid4
os.environ['APP_ENV'] = 'test'
os.environ['ENABLE_LOCAL_DEMO'] = 'false'
os.environ['SUPABASE_URL'] = 'https://test-project.supabase.invalid'
os.environ['SUPABASE_PUBLISHABLE_KEY'] = 'test-public-key'

import pytest
from fastapi import Header, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.base import Base
from app.database.session import get_db, make_engine
from app.core.security import verified_identity
from app.models import Profile, Staff, Student


@pytest.fixture
def context(tmp_path):
    engine = make_engine('sqlite:///' + str(tmp_path / 'test.db'))
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    people = {}
    with factory() as db:
        for role in ['student', 'student2', 'staff', 'staff2', 'admin']:
            actual_role = role.rstrip('2')
            record = Profile(id=str(uuid4()), email=role + '@example.test', full_name=role.title(), role=actual_role)
            db.add(record)
            db.flush()
            if actual_role == 'staff': db.add(Staff(user_id=record.id))
            if actual_role == 'student': db.add(Student(user_id=record.id))
            people[role] = record
        db.commit()
    def database():
        with factory() as db:
            try: yield db
            finally: db.rollback()
    def identity(authorization: str = Header('')):
        role = authorization.removeprefix('Bearer ')
        if role not in people: raise HTTPException(401, 'Invalid test identity')
        record = people[role]
        return {'id': record.id, 'email': record.email, 'user_metadata': {'role': 'admin'}}
    app.dependency_overrides[get_db] = database
    app.dependency_overrides[verified_identity] = identity
    with TestClient(app) as client:
        yield client, factory, people
    app.dependency_overrides.clear()
    engine.dispose()


def headers(role):
    return {'Authorization': 'Bearer ' + role}
