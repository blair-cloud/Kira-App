from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import verified_identity
from app.database.session import get_db
from app.models import Profile


def current_user(identity: dict = Depends(verified_identity), db: Session = Depends(get_db)) -> Profile:
    profile = db.get(Profile, identity['id'])
    if not profile:
        raise HTTPException(403, 'Complete profile synchronization before continuing')
    if not profile.active:
        raise HTTPException(403, 'This account is inactive')
    return profile


def roles(*allowed: str):
    def check(user: Profile = Depends(current_user)):
        if user.role not in allowed:
            raise HTTPException(403, 'Your role cannot perform this action')
        return user
    return check
