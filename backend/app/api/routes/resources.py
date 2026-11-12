from datetime import date, datetime
from zoneinfo import ZoneInfo
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.core.dependencies import roles
from app.core.permissions import can_support
from app.database.session import get_db
from app.models import Bookmark, Conversation, DailyCard, EmergencyContact, Profile, Question, Resource, Staff
from app.services.common import audit, dump, notify, page, required
from app.schemas.inputs import RecommendResource

router = APIRouter(tags=['Resources and public directory'])


@router.get('/staff/students')
def assigned_students(user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    identified = select(Question.student_id).where(Question.assigned_staff_id == user.id, Question.anonymous.is_(False))
    conversations = select(Conversation.student_id).where(Conversation.staff_id == user.id, Conversation.mode == 'professional')
    records = db.scalars(select(Profile).where(or_(Profile.id.in_(identified), Profile.id.in_(conversations))).order_by(Profile.full_name).limit(100))
    return [{'id': person.id, 'full_name': person.full_name} for person in records]


@router.post('/staff/recommendations', status_code=201)
def recommend_resource(data: RecommendResource, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    can_support(db, user.id, str(data.student_id))
    resource = required(db, Resource, data.resource_id)
    if resource.status != 'published':
        raise HTTPException(404, 'Resource not found')
    notify(db, str(data.student_id), 'recommendation', 'Your professional recommended a wellness resource', '/resources/' + resource.slug)
    audit(db, user, 'resource.recommended', 'resource', resource.id)
    db.commit()
    return {'recommended': True}


@router.get('/resources')
@router.get('/student/resources')
def resources(q: str = Query('', max_length=200), category: str = '', offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), db: Session = Depends(get_db)):
    query = select(Resource).where(Resource.status == 'published')
    if q:
        query = query.where(or_(Resource.title.ilike(f'%{q}%'), Resource.description.ilike(f'%{q}%')))
    if category:
        query = query.where(Resource.category == category)
    result = page(db, query.order_by(Resource.featured.desc(), Resource.created_at.desc()), offset, limit)
    result['items'] = [dump(item, ('author_id',)) for item in result['items']]
    return result


@router.get('/resources/{slug}')
def resource(slug: str, db: Session = Depends(get_db)):
    record = db.scalar(select(Resource).where(Resource.slug == slug, Resource.status == 'published'))
    if not record:
        raise HTTPException(404, 'Resource not found')
    return dump(record, ('author_id',))


@router.get('/daily-cards')
def daily_cards(db: Session = Depends(get_db)):
    today = datetime.now(ZoneInfo('Africa/Kigali')).date()
    items = list(db.scalars(select(DailyCard).where(DailyCard.status == 'published', or_(DailyCard.starts_on.is_(None), DailyCard.starts_on <= today), or_(DailyCard.ends_on.is_(None), DailyCard.ends_on >= today)).order_by(DailyCard.created_at, DailyCard.id)))
    featured = items[(today - date(1970, 1, 1)).days % len(items)].id if items else None
    return {'items': [dump(item) for item in items], 'date': today.isoformat(), 'timezone': 'Africa/Kigali', 'featured_id': featured}


@router.get('/professionals')
def professionals(db: Session = Depends(get_db)):
    return [{'id': profile.id, 'full_name': profile.full_name, **dump(staff, ('id', 'user_id', 'created_at', 'updated_at'))} for staff, profile in db.execute(select(Staff, Profile).join(Profile, Profile.id == Staff.user_id).where(Profile.active.is_(True), Profile.role == 'staff'))]


@router.get('/emergency-contacts')
def emergency_contacts(db: Session = Depends(get_db)):
    return [dump(item) for item in db.scalars(select(EmergencyContact).where(EmergencyContact.active.is_(True)))]


@router.get('/student/bookmarks')
def bookmarks(user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    return [dump(resource, ('author_id',)) for resource in db.scalars(select(Resource).join(Bookmark, Bookmark.resource_id == Resource.id).where(Bookmark.student_id == user.id, Resource.status == 'published'))]


@router.post('/student/bookmarks/{resource_id}', status_code=201)
def bookmark(resource_id: UUID, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    resource = required(db, Resource, resource_id)
    if resource.status != 'published':
        raise HTTPException(404, 'Resource not found')
    existing = db.scalar(select(Bookmark).where(Bookmark.resource_id == str(resource_id), Bookmark.student_id == user.id))
    if not existing:
        db.add(Bookmark(resource_id=str(resource_id), student_id=user.id))
        db.commit()
    return {'saved': True}


@router.delete('/student/bookmarks/{resource_id}')
def unbookmark(resource_id: UUID, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    record = db.scalar(select(Bookmark).where(Bookmark.resource_id == str(resource_id), Bookmark.student_id == user.id))
    if record:
        db.delete(record)
        db.commit()
    return {'saved': False}
