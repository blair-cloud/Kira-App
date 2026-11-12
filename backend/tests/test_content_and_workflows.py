from datetime import date, timedelta
from sqlalchemy import select
from app.models import DailyCard, Resource
from app.database.base import utcnow
from app.api.routes.resources import daily_cards
from conftest import headers

ARTICLE = {'title': 'Study balance', 'slug': 'study-balance', 'category': 'Academic Wellbeing', 'body': 'A published development article about study balance.', 'description': 'Small steps and rest.', 'status': 'draft', 'featured': False, 'minutes': 4, 'tone': 'blue'}
CARD = {'title': 'One small step', 'category': 'Self Care', 'message': 'Make room for a pause.', 'icon': 'heart', 'tone': 'teal', 'status': 'published'}


def test_content_publication_search_bookmark_and_archive(context):
    client, _, _ = context
    created = client.post('/api/v1/admin/resources', headers=headers('admin'), json=ARTICLE)
    assert created.status_code == 201
    identifier = created.json()['id']
    assert client.get('/api/v1/resources/study-balance').status_code == 404
    assert client.post('/api/v1/student/bookmarks/' + identifier, headers=headers('student'), json={}).status_code == 404
    assert client.patch('/api/v1/admin/resources/' + identifier, headers=headers('admin'), json={**ARTICLE, 'status': 'published'}).status_code == 200
    assert client.get('/api/v1/resources?q=Study').json()['total'] == 1
    assert client.get('/api/v1/resources?category=Other').json()['total'] == 0
    assert client.post('/api/v1/student/bookmarks/' + identifier, headers=headers('student'), json={}).status_code == 201
    assert len(client.get('/api/v1/student/bookmarks', headers=headers('student')).json()) == 1
    assert client.get('/api/v1/student/bookmarks', headers=headers('student2')).json() == []
    assert client.delete('/api/v1/admin/resources/' + identifier, headers=headers('staff')).status_code == 403
    assert client.delete('/api/v1/admin/resources/' + identifier, headers=headers('admin')).status_code == 200
    assert client.get('/api/v1/resources').json()['total'] == 0


def test_staff_cannot_publish_or_edit_another_staff_draft(context):
    client, _, _ = context
    response = client.post('/api/v1/staff/resources', headers=headers('staff'), json={**ARTICLE, 'status': 'published', 'featured': True})
    assert response.status_code == 201
    record = response.json()
    assert record['status'] == 'draft' and record['featured'] is False
    assert client.patch('/api/v1/staff/resources/' + record['id'], headers=headers('staff2'), json=ARTICLE).status_code == 403


def test_daily_schedule_uses_kigali_and_rejects_invalid_ranges(context):
    client, _, _ = context
    today = date.fromisoformat(client.get('/api/v1/daily-cards').json()['date'])
    assert client.post('/api/v1/admin/daily-cards', headers=headers('admin'), json={**CARD, 'starts_on': str(today + timedelta(days=1))}).status_code == 201
    assert client.get('/api/v1/daily-cards').json()['items'] == []
    created = client.post('/api/v1/admin/daily-cards', headers=headers('admin'), json={**CARD, 'starts_on': str(today), 'ends_on': str(today)}).json()
    moment = client.get('/api/v1/daily-cards').json()
    assert moment['timezone'] == 'Africa/Kigali'
    assert moment['featured_id'] == created['id']
    assert len(moment['items']) == 1
    assert client.post('/api/v1/admin/daily-cards', headers=headers('admin'), json={**CARD, 'starts_on': str(today), 'ends_on': str(today - timedelta(days=1))}).status_code == 422
    assert client.post('/api/v1/admin/daily-cards', headers=headers('admin'), json={**CARD, 'illustration_url': 'javascript:alert(1)'}).status_code == 422


def test_student_followup_does_not_reveal_anonymous_author(context):
    client, _, people = context
    identifier = client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Private question', 'category': 'Wellbeing', 'professional_id': people['staff'].id}).json()['id']
    assert client.post(f'/api/v1/student/questions/{identifier}/respond', headers=headers('student2'), json={'body': 'Unauthorized'}).status_code == 404
    assert client.post(f'/api/v1/student/questions/{identifier}/respond', headers=headers('student'), json={'body': 'Private follow up'}).status_code == 201
    record = client.get(f'/api/v1/staff/questions/{identifier}', headers=headers('staff')).json()
    assert people['student'].id not in str(record)
    assert record['responses'][0]['sender_role'] == 'student'


def test_referral_requires_identified_assignment(context):
    client, _, people = context
    client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Identified question', 'category': 'Wellbeing', 'anonymous': False, 'professional_id': people['staff'].id})
    response = client.post('/api/v1/staff/referrals', headers=headers('staff'), json={'student_id': people['student'].id, 'category': 'Medical', 'reason': 'Discuss options with nurse'})
    assert response.status_code == 201
    identifier = response.json()['id']
    assert client.patch(f'/api/v1/staff/referrals/{identifier}', headers=headers('staff2'), json={'status': 'completed'}).status_code == 404
    assert client.patch(f'/api/v1/staff/referrals/{identifier}', headers=headers('staff'), json={'status': 'referred'}).status_code == 200
    assert len(client.get('/api/v1/referrals', headers=headers('student')).json()) == 1
    assert client.get('/api/v1/referrals', headers=headers('student2')).json() == []


def test_reschedule_and_late_student_cancellation(context):
    client, _, _ = context
    times = []
    for hours in (12, 72):
        start = utcnow() + timedelta(hours=hours)
        response = client.post('/api/v1/staff/availability', headers=headers('staff'), json={'starts_at': start.isoformat(), 'ends_at': (start + timedelta(minutes=45)).isoformat()})
        assert response.status_code == 201
        times.append(response.json())
    appointment = client.post('/api/v1/student/appointments', headers=headers('student'), json={'slot_id': times[0]['id'], 'appointment_type': 'Medical appointment'}).json()
    assert client.patch('/api/v1/student/appointments/' + appointment['id'], headers=headers('student'), json={'status': 'cancelled'}).status_code == 409
    moved = client.patch('/api/v1/staff/appointments/' + appointment['id'], headers=headers('staff'), json={'status': 'rescheduled', 'slot_id': times[1]['id']})
    assert moved.status_code == 200 and moved.json()['slot_id'] == times[1]['id']
    assert client.patch('/api/v1/student/appointments/' + appointment['id'], headers=headers('student'), json={'status': 'cancelled'}).status_code == 200


def test_knowledge_upload_and_assistant_source(context):
    client, _, _ = context
    uploaded = client.post('/api/v1/admin/knowledge/upload', headers=headers('admin'), files={'file': ('Study.txt', b'Study support content', 'text/plain')})
    assert uploaded.status_code == 201 and uploaded.json()['status'] == 'draft'
    assert client.post('/api/v1/admin/knowledge/upload', headers=headers('student'), files={'file': ('x.txt', b'Secret', 'text/plain')}).status_code == 403
    assert client.post('/api/v1/admin/knowledge/upload', headers=headers('admin'), files={'file': ('x.html', b'<script>x</script>', 'text/html')}).status_code == 422


def test_goals_profile_notifications_and_no_role_escalation(context):
    client, _, _ = context
    goal = client.post('/api/v1/student/goals', headers=headers('student'), json={'title': 'Make room for rest'}).json()
    assert client.patch('/api/v1/student/goals/' + goal['id'], headers=headers('student2'), json={'completed': True}).status_code == 404
    assert client.patch('/api/v1/student/goals/' + goal['id'], headers=headers('student'), json={'completed': True}).json()['completed'] is True
    update = client.patch('/api/v1/users/me', headers=headers('student'), json={'notification_preferences': {'appointment': False}, 'privacy_settings': {'reviewed_privacy': True}})
    assert update.status_code == 200
    assert client.get('/api/v1/users/me', headers=headers('student')).json()['role'] == 'student'


def test_admin_manages_staff_availability_but_staff_cannot_manage_others(context):
    client, _, people = context
    start = utcnow() + timedelta(days=8)
    data = {'starts_at': start.isoformat(), 'ends_at': (start + timedelta(minutes=40)).isoformat()}
    path = '/api/v1/admin/staff/' + people['staff'].id + '/availability'
    assert client.post(path, headers=headers('student'), json=data).status_code == 403
    assert client.post(path, headers=headers('staff2'), json=data).status_code == 403
    response = client.post(path, headers=headers('admin'), json=data)
    assert response.status_code == 201
    assert client.get(path, headers=headers('admin')).json()[0]['staff_id'] == people['staff'].id
    assert client.delete(path + '/' + response.json()['id'], headers=headers('admin')).status_code == 200


def test_resource_recommendations_require_assignment_and_published_content(context):
    client, _, people = context
    resource = client.post('/api/v1/admin/resources', headers=headers('admin'), json={**ARTICLE, 'status': 'published'}).json()
    data = {'student_id': people['student'].id, 'resource_id': resource['id']}
    assert client.post('/api/v1/staff/recommendations', headers=headers('staff'), json=data).status_code == 404
    client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Identified question', 'category': 'Academic', 'anonymous': False, 'professional_id': people['staff'].id})
    assert client.post('/api/v1/staff/recommendations', headers=headers('staff'), json=data).status_code == 201
    notice = client.get('/api/v1/notifications', headers=headers('student')).json()['items'][0]
    assert notice['link'] == '/resources/study-balance'
    assert client.get('/api/v1/staff/students', headers=headers('staff')).json()[0]['id'] == people['student'].id
    assert client.get('/api/v1/staff/students', headers=headers('staff2')).json() == []


def test_timezone_offsets_are_normalized(context):
    from app.schemas.inputs import SlotCreate
    record = SlotCreate(starts_at='2030-01-01T10:00:00+02:00', ends_at='2030-01-01T10:45:00+02:00')
    assert record.starts_at.hour == 8 and record.starts_at.utcoffset().total_seconds() == 0


def test_repeated_records_from_one_student_do_not_bypass_report_privacy(context):
    client, _, _ = context
    for _ in range(6):
        client.post('/api/v1/student/questions', headers=headers('student'), json={'body': 'Repeated sample question', 'category': 'Wellbeing'})
    report = client.get('/api/v1/admin/reports', headers=headers('admin')).json()
    assert report['question_categories']['suppressed'] is True
    assert report['question_categories']['items'] == []


def test_reminders_idempotent_and_retention_deletes_only_expired_records(context):
    from app.models import Appointment, Availability, Checkin, Notification
    from app.maintenance import purge_expired, send_reminders
    client, factory, people = context
    with factory() as db:
        start = utcnow() + timedelta(hours=12)
        slot = Availability(staff_id=people['staff'].id, starts_at=start, ends_at=start + timedelta(minutes=40))
        db.add(slot); db.flush()
        db.add(Appointment(student_id=people['student'].id, staff_id=people['staff'].id, slot_id=slot.id, appointment_type='Medical appointment', status='confirmed'))
        db.add(Checkin(student_id=people['student'].id, mood='Okay', score=4, created_at=utcnow() - timedelta(days=400)))
        db.add(Checkin(student_id=people['student'].id, mood='Great', score=5))
        db.commit()
        assert send_reminders(db) == 1
        assert send_reminders(db) == 0
        assert purge_expired(db)['checkins'] == 1
        assert len(list(db.scalars(select(Checkin)))) == 2
        purge_expired(db, apply=True)
        assert len(list(db.scalars(select(Checkin)))) == 1
