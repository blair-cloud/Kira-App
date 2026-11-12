from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.dependencies import current_user
from app.core.security import verified_identity
from app.database.session import get_db
from app.models import Profile, Student
from app.schemas.inputs import ProfileSync, ProfileUpdate
from app.services.common import audit, dump

router = APIRouter(tags=['Authentication and profiles'])


@router.post('/auth/sync-profile')
def sync_profile(data: ProfileSync, identity: dict = Depends(verified_identity), db: Session = Depends(get_db)):
    profile = db.get(Profile, identity['id'])
    if profile and not profile.active:
        raise HTTPException(403, 'This account is inactive')
    if not profile:
        # Supabase user_metadata is user-editable and is NEVER a source of roles.
        profile = Profile(id=identity['id'], email=identity['email'].lower(), role='student', full_name=data.full_name or 'Kepler student')
        db.add(profile)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            existing = db.get(Profile, identity['id'])
            if existing and existing.active:
                return dump(existing)
            raise HTTPException(409, 'Profile setup could not be completed. Try signing in again.')
        db.add(Student(user_id=profile.id))
        audit(db, profile, 'profile.created', 'profile', profile.id)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        profile = db.get(Profile, identity['id'])
        if not profile or not profile.active:
            raise HTTPException(409, 'Profile setup could not be completed. Try signing in again.')
    return dump(profile)


@router.get('/auth/me')
@router.get('/users/me')
def me(user: Profile = Depends(current_user)):
    return dump(user)


@router.patch('/users/me')
def update_profile(data: ProfileUpdate, user: Profile = Depends(current_user), db: Session = Depends(get_db)):
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(user, key, value)
    audit(db, user, 'profile.updated', 'profile', user.id)
    db.commit()
    return dump(user)
