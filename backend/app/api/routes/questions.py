from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import roles
from app.core.permissions import assigned_question, require_staff
from app.database.session import get_db
from app.models import Profile, Question, QuestionResponse
from app.schemas.inputs import QuestionCreate, QuestionUpdate, ResponseCreate
from app.services.common import audit, dump, notify, page

router = APIRouter(tags=['Confidential questions'])


def question_view(db, record, actor):
    excluded = ('student_id',) if actor.role == 'staff' and record.anonymous else ()
    result = dump(record, excluded)
    result['student_name'] = 'Anonymous student' if record.anonymous else db.get(Profile, record.student_id).full_name
    responses = select(QuestionResponse).where(QuestionResponse.question_id == record.id)
    if actor.role != 'staff':
        responses = responses.where(QuestionResponse.private_note.is_(False))
    result['responses'] = []
    for item in db.scalars(responses.order_by(QuestionResponse.created_at)):
        response = dump(item, ('author_id',) if actor.role == 'staff' and record.anonymous and item.author_id == record.student_id else ())
        response['sender_role'] = 'student' if item.author_id == record.student_id else 'staff'
        result['responses'].append(response)
    return result


@router.post('/student/questions', status_code=201)
def create_question(data: QuestionCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    staff_id = str(data.professional_id) if data.professional_id else None
    if staff_id:
        require_staff(db, staff_id)
    record = Question(student_id=user.id, assigned_staff_id=staff_id, category=data.category, body=data.body, anonymous=data.anonymous, status='assigned' if staff_id else 'new')
    db.add(record)
    db.flush()
    if staff_id:
        notify(db, staff_id, 'question', 'A question has been assigned to you', '/professional/dashboard')
    audit(db, user, 'question.created', 'question', record.id)
    db.commit()
    return question_view(db, record, user)


@router.get('/student/questions')
@router.get('/staff/questions')
def questions(category: str = '', status: str = '', priority: str = '', offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    query = select(Question).where(Question.student_id == user.id) if user.role == 'student' else select(Question).where(Question.assigned_staff_id == user.id)
    for column, value in [(Question.category, category), (Question.status, status), (Question.priority, priority)]:
        if value:
            query = query.where(column == value)
    result = page(db, query.order_by(Question.created_at.desc()), offset, limit)
    result['items'] = [question_view(db, record, user) for record in result['items']]
    return result


@router.get('/student/questions/{question_id}')
@router.get('/staff/questions/{question_id}')
def question(question_id: UUID, user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    record = assigned_question(db, str(question_id), user)
    audit(db, user, 'question.viewed', 'question', record.id)
    db.commit()
    return question_view(db, record, user)


@router.post('/staff/questions/{question_id}/respond', status_code=201)
def respond(question_id: UUID, data: ResponseCreate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = assigned_question(db, str(question_id), user)
    response = QuestionResponse(question_id=record.id, author_id=user.id, body=data.body, private_note=data.private_note)
    db.add(response)
    if not data.private_note:
        record.status = 'awaiting_student'
        notify(db, record.student_id, 'question_response', 'Your question has a new response', '/student/dashboard')
    audit(db, user, 'question.responded', 'question', record.id)
    db.commit()
    return question_view(db, record, user)


@router.post('/student/questions/{question_id}/respond', status_code=201)
def student_follow_up(question_id: UUID, data: ResponseCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    from fastapi import HTTPException
    record = assigned_question(db, str(question_id), user)
    if data.private_note:
        raise HTTPException(422, 'Student replies cannot be professional notes')
    if record.status in ('resolved', 'closed'):
        raise HTTPException(409, 'This question is closed. Start a new support question.')
    db.add(QuestionResponse(question_id=record.id, author_id=user.id, body=data.body, private_note=False))
    record.status = 'in_progress' if record.assigned_staff_id else 'new'
    if record.assigned_staff_id:
        notify(db, record.assigned_staff_id, 'question_response', 'An assigned question has a follow-up', '/professional/dashboard')
    audit(db, user, 'question.followed_up', 'question', record.id)
    db.commit()
    return question_view(db, record, user)


@router.patch('/staff/questions/{question_id}/status')
def question_status(question_id: UUID, data: QuestionUpdate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = assigned_question(db, str(question_id), user)
    record.status, record.priority = data.status, data.priority
    audit(db, user, 'question.status_updated', 'question', record.id)
    db.commit()
    return question_view(db, record, user)
