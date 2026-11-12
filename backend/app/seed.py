"""Development-only fixtures. Credentials are provisioned through Supabase Auth."""
import argparse
import json
from datetime import timedelta
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5
import httpx
from sqlalchemy import select
from app.core.config import get_settings
from app.database.base import utcnow
from app.database.session import SessionLocal
from app.models import Appointment, Availability, Category, Checkin, Conversation, DailyCard, Department, EmergencyContact, Goal, Message, Notification, Participant, Profile, Question, QuestionResponse, Referral, Resource, Staff, Student
from app.services.supabase_admin import provision_user

DEMO_ACCOUNTS = [
    ('student', 'student@wellness.test', 'Student@123', 'Aline Demo'),
    ('staff', 'staff@wellness.test', 'Staff@123', 'Dr. Morgan Demo'),
    ('admin', 'admin@wellness.test', 'Admin@123', 'Alex Admin Demo'),
]


def identifier(value):
    return str(uuid5(NAMESPACE_URL, 'kira-development:' + value))


def content(db):
    data = json.loads(Path(__file__).with_name('seed_content.json').read_text(encoding='utf-8'))
    for item in data['wellnessCards']:
        record = db.get(DailyCard, identifier(item['id']))
        if not record:
            db.add(DailyCard(id=identifier(item['id']), status='published', **{key: value for key, value in item.items() if key != 'id'}))
    for item in data['resources']:
        if not db.scalar(select(Resource).where(Resource.slug == item['slug'])):
            db.add(Resource(id=identifier(item['slug']), status='published', featured=True, body=item['description'] + '\n\nThis is sample educational content for local development. Full articles need professional review before publication.', **item))
    for name in ['Mental Wellbeing', 'Academic Wellbeing', 'Emotional Wellbeing', 'Physical Health', 'Self Care', 'Healthy Relationships', 'Personal Development']:
        if not db.scalar(select(Category).where(Category.name == name)):
            db.add(Category(name=name))
    if not db.scalar(select(Department.id)):
        db.add(Department(name='Student Wellness'))
    for title, number in [('Rwanda emergency services', '112'), ('Ambulance', '912')]:
        if not db.scalar(select(EmergencyContact).where(EmergencyContact.phone == number)):
            db.add(EmergencyContact(title=title, phone=number, source_url='https://www.gov.rw/emergency'))
    db.commit()


def demo_users(db):
    settings = get_settings()
    if settings.app_env != 'development' or not settings.enable_demo_accounts:
        raise RuntimeError('Demo seeding requires APP_ENV=development and ENABLE_DEMO_ACCOUNTS=true')
    if not settings.supabase_url or settings.demo_project_url.rstrip('/') != settings.supabase_url:
        raise RuntimeError('DEMO_PROJECT_URL must explicitly match your development Supabase URL')
    if not settings.supabase_service_role_key:
        raise RuntimeError('Configure the server-only Supabase service role key')
    profiles = {}
    for role, email, password, full_name in DEMO_ACCOUNTS:
        profile = db.scalar(select(Profile).where(Profile.email == email))
        if not profile:
            auth_user = provision_user(email, full_name, password=password)
            profile = Profile(id=auth_user['id'], email=email, full_name=full_name, role=role)
            db.add(profile)
            db.flush()
            if role == 'staff':
                db.add(Staff(user_id=profile.id, title='Demo wellness professional', contact_email=email, areas=['Academic balance', 'General wellbeing']))
            elif role == 'student':
                db.add(Student(user_id=profile.id, student_number='DEMO-001'))
        elif profile.role != role:
            raise RuntimeError('Existing demo profile has an unexpected role; review it manually')
        profiles[role] = profile
    db.commit()
    sample_records(db, profiles['student'], profiles['staff'])


def sample_records(db, student, staff):
    if db.get(Question, identifier('demo-question')):
        return
    question = Question(id=identifier('demo-question'), student_id=student.id, assigned_staff_id=staff.id, category='Academic balance', body='How can I plan a manageable study week?', anonymous=True, status='awaiting_student')
    db.add(question)
    db.flush()
    db.add(QuestionResponse(question_id=question.id, author_id=staff.id, body='Start with one small, realistic study block and leave room for breaks. We can discuss options together.'))
    conversation = Conversation(student_id=student.id, staff_id=staff.id, title='Planning a first conversation')
    db.add(conversation)
    db.flush()
    for person in (student, staff):
        db.add(Participant(conversation_id=conversation.id, user_id=person.id))
    db.add(Message(conversation_id=conversation.id, sender_id=student.id, body='What should I bring to a first session?'))
    db.add(Message(conversation_id=conversation.id, sender_id=staff.id, body='You can begin with whatever you feel comfortable sharing.'))
    start = (utcnow() + timedelta(days=3)).replace(hour=8, minute=0, second=0, microsecond=0)
    slots = []
    for days in range(6):
        slot = Availability(staff_id=staff.id, starts_at=start + timedelta(days=days), ends_at=start + timedelta(days=days, minutes=45))
        db.add(slot)
        slots.append(slot)
    db.flush()
    db.add(Appointment(student_id=student.id, staff_id=staff.id, slot_id=slots[0].id, appointment_type='Counselling session', status='pending'))
    for day, mood, score in [(4, 'Okay', 4), (2, 'Not sure', 3), (0, 'Great', 5)]:
        db.add(Checkin(student_id=student.id, mood=mood, score=score, reflection='Development sample reflection.', shared_with_id=staff.id if day == 2 else None, created_at=utcnow() - timedelta(days=day)))
    db.add(Goal(student_id=student.id, title='Take a short break between study sessions'))
    db.add(Referral(student_id=student.id, staff_id=staff.id, category='Academic support', reason='Development example: explore study planning support.'))
    db.add(Notification(user_id=student.id, kind='welcome', title='Welcome to Kira. Explore your next small step.', link='/student/dashboard'))
    db.add(Notification(user_id=staff.id, kind='question', title='A sample question awaits your review', link='/professional/dashboard'))
    db.commit()


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--demo', action='store_true', help='Provision Supabase demo accounts and private sample records')
    mode.add_argument('--local-demo', action='store_true', help='Seed local mock roles without Supabase')
    args = parser.parse_args()
    if get_settings().app_env != 'development':
        raise RuntimeError('Sample seeding is development-only')
    with SessionLocal() as db:
        content(db)
        if args.demo:
            demo_users(db)
        elif args.local_demo:
            from app.services.local_demo import seed_local_profiles
            seed_local_profiles(db)
    print('Local mock roles are ready.' if args.local_demo else 'Development fixtures seeded. Supabase demo accounts require --demo.')


if __name__ == '__main__':
    main()
