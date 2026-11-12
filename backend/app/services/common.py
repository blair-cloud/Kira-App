from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import AuditLog, Notification, Profile


def dump(record, exclude=()):
    return {column.name: getattr(record, column.name) for column in record.__table__.columns if column.name not in exclude}


def page(db: Session, query, offset=0, limit=25):
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery()))
    return {'items': list(db.scalars(query.offset(offset).limit(limit))), 'total': total, 'offset': offset, 'limit': limit}


def audit(db, actor, action, entity, entity_id=''):
    # Do not log message text, reflections, names, email, tokens, or notes.
    db.add(AuditLog(actor_id=actor.id if actor else None, action=action, entity_type=entity, entity_id=str(entity_id)))


def notify(db, user_id, kind, title, link):
    profile = db.get(Profile, user_id)
    preference = 'appointment' if kind.startswith('appointment') else kind.split(':')[0]
    if profile and profile.notification_preferences.get(preference, True):
        db.add(Notification(user_id=user_id, kind=kind, title=title, link=link))


def aware(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def required(db, model, identifier):
    record = db.get(model, str(identifier))
    if not record:
        raise HTTPException(404, 'Record not found')
    return record
