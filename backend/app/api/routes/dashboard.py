from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, String
from sqlalchemy.orm import Session
from app.core.dependencies import roles
from app.core.config import get_settings
from app.database.session import get_db
from app.models import Appointment, Bookmark, Checkin, Conversation, DailyCard, Goal, Notification, Profile, Question, Referral, Resource
from app.services.common import dump
from app.api.routes.appointments import appointment_view, ACTIVE
from app.api.routes.questions import question_view
from app.api.routes.resources import daily_cards

router = APIRouter(tags=['Role-based dashboards and aggregate reports'])


def count(db, model, *where):
    return db.scalar(select(func.count()).select_from(model).where(*where)) or 0


def reports(db):
    threshold = get_settings().report_min_group_size
    def groups(column, model, *where):
        # Suppress the whole breakdown if any group is too small, so totals and
        # complementary groups cannot reveal a suppressed small cell.
        subject = getattr(model, 'student_id', Profile.id if model is Profile else None)
        query = select(column, func.count(), func.count(func.distinct(subject)) if subject is not None else func.count()).where(*where).group_by(column)
        rows = db.execute(query).all()
        if any(total < threshold or subjects < threshold for _, total, subjects in rows):
            return {'suppressed': True, 'items': [], 'minimum_group_size': threshold}
        return {'suppressed': False, 'items': [{'label': str(label), 'count': total} for label, total, _ in rows], 'minimum_group_size': threshold}
    registration_month = func.substr(func.cast(Profile.created_at, String), 1, 7)
    appointment_month = func.substr(func.cast(Appointment.created_at, String), 1, 7)
    bookmark_report = groups(Bookmark.resource_id, Bookmark)
    for item in bookmark_report['items']:
        resource = db.get(Resource, item['label'])
        item['label'] = resource.title if resource else 'Archived resource'
    return {
        'registrations': groups(registration_month, Profile, Profile.role == 'student'),
        'question_categories': groups(Question.category, Question),
        'question_statuses': groups(Question.status, Question),
        'anonymous_questions': groups(Question.anonymous, Question),
        'appointments_by_status': groups(Appointment.status, Appointment),
        'monthly_appointments': groups(appointment_month, Appointment),
        'service_utilization': groups(Appointment.appointment_type, Appointment),
        'resource_bookmarks': bookmark_report,
        'resource_publication': groups(Resource.status, Resource),
        'privacy_note': 'Small-group breakdowns are suppressed. Private messages, reflections, identities, and clinical notes are excluded.',
    }


@router.get('/student/dashboard')
def student_dashboard(user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    checkins = list(db.scalars(select(Checkin).where(Checkin.student_id == user.id).order_by(Checkin.created_at.desc()).limit(14)))
    appointments = list(db.scalars(select(Appointment).where(Appointment.student_id == user.id).order_by(Appointment.created_at.desc()).limit(10)))
    return {
        'profile': dump(user),
        'stats': {'questions': count(db, Question, Question.student_id == user.id), 'upcoming_appointments': count(db, Appointment, Appointment.student_id == user.id, Appointment.status.in_(ACTIVE)), 'checkins': count(db, Checkin, Checkin.student_id == user.id), 'unread_notifications': count(db, Notification, Notification.user_id == user.id, Notification.read.is_(False))},
        'daily_cards': daily_cards(db),
        'appointments': [appointment_view(db, item, user) for item in appointments],
        'questions': [question_view(db, item, user) for item in db.scalars(select(Question).where(Question.student_id == user.id).order_by(Question.created_at.desc()).limit(10))],
        'checkins': [dump(item) for item in checkins],
        'goals': [dump(item) for item in db.scalars(select(Goal).where(Goal.student_id == user.id))],
        'notifications': [dump(item) for item in db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(10))],
        'resources': [dump(item, ('author_id',)) for item in db.scalars(select(Resource).where(Resource.status == 'published').order_by(Resource.featured.desc()).limit(4))],
        'conversations': [dump(item) for item in db.scalars(select(Conversation).where(Conversation.student_id == user.id).order_by(Conversation.updated_at.desc()).limit(6))],
    }


@router.get('/staff/dashboard')
def staff_dashboard(user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    questions = list(db.scalars(select(Question).where(Question.assigned_staff_id == user.id).order_by(Question.created_at.desc()).limit(25)))
    return {'profile': dump(user), 'stats': {
        'assigned_open_cases': count(db, Question, Question.assigned_staff_id == user.id, Question.status.not_in(('resolved', 'closed'))),
        'questions_awaiting_response': count(db, Question, Question.assigned_staff_id == user.id, Question.status.in_(('new', 'assigned', 'in_progress'))),
        'upcoming_appointments': count(db, Appointment, Appointment.staff_id == user.id, Appointment.status.in_(ACTIVE)),
        'active_conversations': count(db, Conversation, Conversation.staff_id == user.id, Conversation.status == 'active'),
        'pending_referrals': count(db, Referral, Referral.staff_id == user.id, Referral.status.in_(('pending', 'referred'))),
        'follow_up_cases': count(db, Question, Question.assigned_staff_id == user.id, Question.priority == 'follow_up'),
    }, 'questions': [question_view(db, item, user) for item in questions],
        'appointments': [appointment_view(db, item, user) for item in db.scalars(select(Appointment).where(Appointment.staff_id == user.id).order_by(Appointment.created_at.desc()).limit(25))],
        'conversations': [dump(item) for item in db.scalars(select(Conversation).where(Conversation.staff_id == user.id, Conversation.mode == 'professional').limit(25))],
        'referrals': [dump(item) for item in db.scalars(select(Referral).where(Referral.staff_id == user.id).limit(25))],
        'shared_checkins': [dump(item) for item in db.scalars(select(Checkin).where(Checkin.shared_with_id == user.id).order_by(Checkin.created_at.desc()).limit(25))]}


@router.get('/admin/dashboard')
def admin_dashboard(user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    return {'profile': dump(user), 'stats': {
        'registered_students': count(db, Profile, Profile.role == 'student'),
        'active_professionals': count(db, Profile, Profile.role == 'staff', Profile.active.is_(True)),
        'administrators': count(db, Profile, Profile.role == 'admin'),
        'appointments': count(db, Appointment),
        'pending_appointments': count(db, Appointment, Appointment.status == 'pending'),
        'questions': count(db, Question),
        'open_cases': count(db, Question, Question.status.not_in(('closed', 'resolved'))),
        'published_resources': count(db, Resource, Resource.status == 'published'),
        'active_referrals': count(db, Referral, Referral.status.in_(('pending', 'referred', 'accepted'))),
        'published_daily_cards': count(db, DailyCard, DailyCard.status == 'published'),
    }, 'reports': reports(db)}


@router.get('/admin/reports')
def report_endpoint(user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    return reports(db)
