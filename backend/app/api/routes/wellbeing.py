from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import current_user, roles
from app.core.permissions import can_support, require_staff
from app.database.session import get_db
from app.models import Checkin, Goal, Notification, Profile, Referral
from app.schemas.inputs import CheckinCreate, GoalCreate, GoalUpdate, ReferralCreate, ReferralUpdate
from app.services.common import audit, dump, notify, page, required

router = APIRouter(tags=['Wellbeing, referrals, and notifications'])


@router.post('/student/checkins', status_code=201)
def checkin(data: CheckinCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    shared_id = str(data.shared_with_id) if data.shared_with_id else None
    if shared_id:
        require_staff(db, shared_id)
    score = {'Great': 5, 'Okay': 4, 'Not sure': 3, 'Anxious': 2, 'Low': 1}[data.mood]
    record = Checkin(student_id=user.id, mood=data.mood, score=score, reflection=data.reflection, shared_with_id=shared_id)
    db.add(record)
    audit(db, user, 'checkin.created', 'checkin')
    db.commit()
    return dump(record)


@router.get('/student/checkins')
@router.get('/staff/wellbeing')
def checkins(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    query = select(Checkin).where(Checkin.student_id == user.id) if user.role == 'student' else select(Checkin).where(Checkin.shared_with_id == user.id)
    result = page(db, query.order_by(Checkin.created_at.desc()), offset, limit)
    result['items'] = [{**dump(record), **({'student_name': db.get(Profile, record.student_id).full_name} if user.role == 'staff' else {})} for record in result['items']]
    if user.role == 'staff':
        audit(db, user, 'shared_wellbeing.viewed', 'checkin')
        db.commit()
    return result


@router.patch('/student/checkins/{checkin_id}/unshare')
def unshare(checkin_id: UUID, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    record = required(db, Checkin, checkin_id)
    if record.student_id != user.id:
        raise HTTPException(404, 'Check-in not found')
    record.shared_with_id = None
    audit(db, user, 'checkin.unshared', 'checkin', record.id)
    db.commit()
    return dump(record)


@router.delete('/student/checkins/{checkin_id}')
def delete_checkin(checkin_id: UUID, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    record = required(db, Checkin, checkin_id)
    if record.student_id != user.id:
        raise HTTPException(404, 'Check-in not found')
    db.delete(record)
    audit(db, user, 'checkin.deleted', 'checkin', checkin_id)
    db.commit()
    return {'deleted': True}


@router.get('/student/goals')
def goals(user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    return [dump(item) for item in db.scalars(select(Goal).where(Goal.student_id == user.id).order_by(Goal.created_at.desc()))]


@router.post('/student/goals', status_code=201)
def create_goal(data: GoalCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    record = Goal(student_id=user.id, title=data.title)
    db.add(record)
    db.commit()
    return dump(record)


@router.patch('/student/goals/{goal_id}')
def update_goal(goal_id: UUID, data: GoalUpdate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    record = required(db, Goal, goal_id)
    if record.student_id != user.id:
        raise HTTPException(404, 'Goal not found')
    record.completed = data.completed
    db.commit()
    return dump(record)


@router.get('/student/notifications')
@router.get('/notifications')
def notifications(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(current_user), db: Session = Depends(get_db)):
    result = page(db, select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()), offset, limit)
    result['items'] = [dump(record) for record in result['items']]
    return result


@router.patch('/notifications/{notification_id}/read')
def read_notification(notification_id: UUID, user: Profile = Depends(current_user), db: Session = Depends(get_db)):
    record = required(db, Notification, notification_id)
    if record.user_id != user.id:
        raise HTTPException(404, 'Notification not found')
    record.read = True
    db.commit()
    return dump(record)


@router.get('/referrals')
def referrals(user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    column = Referral.student_id if user.role == 'student' else Referral.staff_id
    return [dump(item) for item in db.scalars(select(Referral).where(column == user.id).order_by(Referral.created_at.desc()).limit(100))]


@router.post('/staff/referrals', status_code=201)
def refer(data: ReferralCreate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    can_support(db, user.id, str(data.student_id))
    record = Referral(student_id=str(data.student_id), staff_id=user.id, category=data.category, reason=data.reason)
    db.add(record)
    notify(db, record.student_id, 'referral', 'You have a new referral update', '/student/dashboard')
    audit(db, user, 'referral.created', 'referral')
    db.commit()
    return dump(record)


@router.patch('/staff/referrals/{referral_id}')
def update_referral(referral_id: UUID, data: ReferralUpdate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = required(db, Referral, referral_id)
    if record.staff_id != user.id:
        raise HTTPException(404, 'Referral not found')
    record.status = data.status
    notify(db, record.student_id, 'referral', 'Your referral status has changed', '/student/dashboard')
    audit(db, user, 'referral.updated', 'referral', record.id)
    db.commit()
    return dump(record)
