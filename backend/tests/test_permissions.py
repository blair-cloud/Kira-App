from datetime import timedelta
from uuid import uuid4
from sqlalchemy import select
from app.database.base import utcnow
from app.models import Appointment, AuditLog, Availability, Checkin, Conversation, Message, Profile, Question, QuestionResponse
from conftest import headers


def test_student_cannot_access_admin_or_staff_dashboard(context):
    client, _, _ = context
    assert client.get('/api/v1/admin/dashboard', headers=headers('student')).status_code == 403
    assert client.get('/api/v1/staff/dashboard', headers=headers('student')).status_code == 403
    assert client.get('/api/v1/student/dashboard').status_code == 401


def test_admin_cannot_read_private_student_endpoints(context):
    client, _, _ = context
    for path in ['/student/questions', '/conversations', '/student/checkins', '/staff/wellbeing', '/referrals']:
        assert client.get('/api/v1' + path, headers=headers('admin')).status_code == 403


def test_roles_come_from_database_not_user_metadata(context):
    client, _, _ = context
    assert client.get('/api/v1/auth/me', headers=headers('student')).json()['role'] == 'student'
    assert client.patch('/api/v1/users/me', headers=headers('student'), json={'role': 'admin'}).status_code == 422


def test_inactive_user_loses_access(context):
    client, factory, people = context
    with factory() as db:
        db.get(Profile, people['student'].id).active = False
        db.commit()
    assert client.get('/api/v1/student/dashboard', headers=headers('student')).status_code == 403


def test_anonymous_question_redaction_and_private_notes(context):
    client, _, people = context
    response = client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'I need help planning my studies', 'category': 'Academic balance', 'anonymous': True, 'professional_id': people['staff'].id})
    assert response.status_code == 201
    identifier = response.json()['id']
    staff_view = client.get(f'/api/v1/staff/questions/{identifier}', headers=headers('staff')).json()
    assert 'student_id' not in staff_view
    assert people['student'].id not in str(staff_view)
    assert staff_view['student_name'] == 'Anonymous student'
    assert client.get(f'/api/v1/staff/questions/{identifier}', headers=headers('staff2')).status_code == 404
    assert client.get(f'/api/v1/student/questions/{identifier}', headers=headers('student2')).status_code == 404
    client.post(f'/api/v1/staff/questions/{identifier}/respond', headers=headers('staff'), json={'body': 'Private clinical observation', 'private_note': True})
    student_view = client.get(f'/api/v1/student/questions/{identifier}', headers=headers('student')).json()
    assert student_view['responses'] == []
    assignment = client.get('/api/v1/admin/question-assignments', headers=headers('admin')).json()['items'][0]
    assert 'body' not in assignment and 'student_id' not in assignment
    # Anonymous assignment cannot be used to disclose identity via referrals.
    assert client.post('/api/v1/staff/referrals', headers=headers('staff'), json={'student_id': people['student'].id, 'category': 'Medical', 'reason': 'Referral test'}).status_code == 404


def test_checkins_are_private_unless_explicitly_shared(context):
    client, _, people = context
    private = client.post('/api/v1/student/checkins', headers=headers('student'), json={'mood': 'Okay', 'reflection': 'Private reflection'}).json()
    shared = client.post('/api/v1/student/checkins', headers=headers('student'), json={'mood': 'Low', 'shared_with_id': people['staff'].id}).json()
    assert client.get('/api/v1/staff/wellbeing', headers=headers('staff')).json()['total'] == 1
    assert client.get('/api/v1/staff/wellbeing', headers=headers('staff2')).json()['total'] == 0
    assert client.delete(f'/api/v1/student/checkins/{private["id"]}', headers=headers('student2')).status_code == 404
    assert client.patch(f'/api/v1/student/checkins/{shared["id"]}/unshare', headers=headers('student'), json={}).status_code == 200
    assert client.get('/api/v1/staff/wellbeing', headers=headers('staff')).json()['total'] == 0


def test_conversation_access_and_knowledge_assistant(context):
    client, _, people = context
    response = client.post('/api/v1/conversations', headers=headers('student'), json={'mode': 'professional', 'professional_id': people['staff'].id})
    identifier = response.json()['id']
    client.post(f'/api/v1/conversations/{identifier}/messages', headers=headers('student'), json={'body': 'Private student message'})
    for role in ['student2', 'staff2', 'admin']:
        assert client.get(f'/api/v1/conversations/{identifier}/messages', headers=headers(role)).status_code in (403, 404)
    assert client.get(f'/api/v1/conversations/{identifier}/messages', headers=headers('staff')).json()['total'] == 1
    ai = client.post('/api/v1/conversations', headers=headers('student'), json={'mode': 'ai'}).json()['id']
    assert client.post(f'/api/v1/conversations/{ai}/messages', headers=headers('student'), json={'body': 'Can you prescribe medication?'}).status_code == 201
    messages = client.get(f'/api/v1/conversations/{ai}/messages', headers=headers('student')).json()['items']
    assert len(messages) == 2 and 'cannot diagnose' in messages[1]['body']
    assert client.get(f'/api/v1/conversations/{ai}/messages', headers=headers('staff')).status_code == 404


def test_booking_prevents_duplicate_and_hides_notes_from_admin(context):
    client, factory, people = context
    start = utcnow() + timedelta(days=4)
    slot = client.post('/api/v1/staff/availability', headers=headers('staff'), json={'starts_at': start.isoformat(), 'ends_at': (start + timedelta(minutes=45)).isoformat()}).json()
    booking = client.post('/api/v1/student/appointments', headers=headers('student'), json={'slot_id': slot['id'], 'appointment_type': 'Counselling session'})
    assert booking.status_code == 201
    duplicate = client.post('/api/v1/student/appointments', headers=headers('student2'), json={'slot_id': slot['id'], 'appointment_type': 'Counselling session'})
    assert duplicate.status_code == 409
    identifier = booking.json()['id']
    assert client.patch(f'/api/v1/staff/appointments/{identifier}', headers=headers('staff2'), json={'status': 'confirmed'}).status_code == 404
    assert client.patch(f'/api/v1/staff/appointments/{identifier}', headers=headers('staff'), json={'status': 'confirmed', 'follow_up': 'Private counselling note'}).status_code == 200
    admin = client.get('/api/v1/admin/appointments', headers=headers('admin')).json()['items'][0]
    assert 'follow_up' not in admin and 'Private counselling note' not in str(admin)
    assert client.patch(f'/api/v1/student/appointments/{identifier}', headers=headers('student'), json={'status': 'cancelled'}).status_code == 200
    assert client.post('/api/v1/student/appointments', headers=headers('student2'), json={'slot_id': slot['id'], 'appointment_type': 'Medical appointment'}).status_code == 201


def test_overlapping_slots_and_student_bookings_rejected(context):
    client, _, _ = context
    start = utcnow() + timedelta(days=5)
    data = {'starts_at': start.isoformat(), 'ends_at': (start + timedelta(minutes=45)).isoformat()}
    slot = client.post('/api/v1/staff/availability', headers=headers('staff'), json=data).json()
    assert client.post('/api/v1/staff/availability', headers=headers('staff'), json=data).status_code == 409
    slot2 = client.post('/api/v1/staff/availability', headers=headers('staff2'), json=data).json()
    assert client.post('/api/v1/student/appointments', headers=headers('student'), json={'slot_id': slot['id'], 'appointment_type': 'Medical appointment'}).status_code == 201
    assert client.post('/api/v1/student/appointments', headers=headers('student'), json={'slot_id': slot2['id'], 'appointment_type': 'Medical appointment'}).status_code == 409


def test_validation_never_echoes_submitted_input(context):
    client, _, _ = context
    response = client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'private secret', 'category': 'a', 'student_id': 'sensitive-value'})
    assert response.status_code == 422
    assert 'private secret' not in response.text and 'sensitive-value' not in response.text


def test_notifications_and_audit_do_not_leak_message_body(context):
    client, factory, people = context
    client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Sensitive support question', 'category': 'General', 'professional_id': people['staff'].id})
    notification = client.get('/api/v1/notifications', headers=headers('staff')).json()['items'][0]
    assert client.patch(f'/api/v1/notifications/{notification["id"]}/read', headers=headers('student'), json={}).status_code == 404
    logs = client.get('/api/v1/admin/audit-logs', headers=headers('admin')).text
    assert 'Sensitive support question' not in logs


def test_admin_reports_suppress_small_groups(context):
    client, _, people = context
    client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Sample question for reporting', 'category': 'Academic', 'professional_id': people['staff'].id})
    report = client.get('/api/v1/admin/reports', headers=headers('admin')).json()
    assert report['question_categories']['suppressed'] is True
    assert report['question_categories']['items'] == []
    assert people['student'].email not in str(report)


def test_admin_cannot_demote_or_deactivate_self(context):
    client, _, people = context
    for data in [{'role': 'student'}, {'active': False}]:
        assert client.patch('/api/v1/admin/users/' + people['admin'].id, headers=headers('admin'), json=data).status_code == 409
