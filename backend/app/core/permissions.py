from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.models import Conversation, Profile, Question, Staff


def require_staff(db: Session, staff_id: str):
    person = db.get(Profile, staff_id)
    if not person or person.role != 'staff' or not person.active or not db.scalar(select(Staff).where(Staff.user_id == staff_id)):
        raise HTTPException(422, 'Choose an active wellness professional')


def assigned_question(db: Session, question_id: str, actor: Profile):
    record = db.get(Question, question_id)
    if not record or not ((actor.role == 'student' and record.student_id == actor.id) or (actor.role == 'staff' and record.assigned_staff_id == actor.id)):
        raise HTTPException(404, 'Question not found')
    return record


def assigned_conversation(db: Session, conversation_id: str, actor: Profile):
    record = db.get(Conversation, conversation_id)
    if not record or not ((actor.role == 'student' and record.student_id == actor.id) or (actor.role == 'staff' and record.staff_id == actor.id and record.mode == 'professional')):
        raise HTTPException(404, 'Conversation not found')
    return record


def can_support(db: Session, staff_id: str, student_id: str):
    # Anonymous questions must never become a student identity lookup channel.
    question = db.scalar(select(Question.id).where(Question.assigned_staff_id == staff_id, Question.student_id == student_id, Question.anonymous.is_(False)))
    conversation = db.scalar(select(Conversation.id).where(Conversation.staff_id == staff_id, Conversation.student_id == student_id, Conversation.mode == 'professional'))
    if not question and not conversation:
        raise HTTPException(404, 'Assigned student not found')
