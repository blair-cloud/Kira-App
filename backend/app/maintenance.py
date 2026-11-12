"""Scheduled maintenance. Run with a scheduler; no public maintenance endpoint."""
import argparse
from datetime import timedelta
from sqlalchemy import delete, select
from app.core.config import get_settings
from app.database.base import utcnow
from app.database.session import SessionLocal
from app.models import Appointment, Availability, Checkin, Conversation, Message, Notification, Participant, Question, QuestionResponse
from app.services.common import audit, notify


def send_reminders(db):
    now = utcnow()
    due = db.scalars(select(Appointment).join(Availability, Availability.id == Appointment.slot_id).where(Appointment.status.in_(('confirmed', 'rescheduled')), Availability.starts_at > now, Availability.starts_at <= now + timedelta(hours=24)))
    sent = 0
    for appointment in due:
        key = 'appointment_reminder:' + appointment.id
        if not db.scalar(select(Notification.id).where(Notification.user_id == appointment.student_id, Notification.kind == key)):
            notify(db, appointment.student_id, key, 'Your appointment is within the next 24 hours', '/student/dashboard')
            sent += 1
    db.commit()
    return sent


def purge_expired(db, apply=False):
    cutoff = utcnow() - timedelta(days=get_settings().retention_days)
    checkins = list(db.scalars(select(Checkin.id).where(Checkin.created_at < cutoff)))
    questions = list(db.scalars(select(Question.id).where(Question.updated_at < cutoff, Question.status.in_(('resolved', 'closed')))))
    conversations = list(db.scalars(select(Conversation.id).where(Conversation.updated_at < cutoff, Conversation.status == 'resolved')))
    summary = {'checkins': len(checkins), 'closed_questions': len(questions), 'resolved_conversations': len(conversations)}
    if apply:
        db.execute(delete(Checkin).where(Checkin.id.in_(checkins)))
        db.execute(delete(QuestionResponse).where(QuestionResponse.question_id.in_(questions)))
        db.execute(delete(Question).where(Question.id.in_(questions)))
        db.execute(delete(Message).where(Message.conversation_id.in_(conversations)))
        db.execute(delete(Participant).where(Participant.conversation_id.in_(conversations)))
        db.execute(delete(Conversation).where(Conversation.id.in_(conversations)))
        audit(db, None, 'retention.purged', 'closed_care_records')
        db.commit()
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['reminders', 'retention'])
    parser.add_argument('--apply-approved-policy', action='store_true', help='Apply deletion only after approving retention requirements')
    args = parser.parse_args()
    with SessionLocal() as db:
        result = send_reminders(db) if args.action == 'reminders' else purge_expired(db, args.apply_approved_policy)
        print(result)


if __name__ == '__main__':
    main()
