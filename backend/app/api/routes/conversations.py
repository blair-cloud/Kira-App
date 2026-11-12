from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import roles
from app.core.permissions import assigned_conversation, require_staff
from app.database.base import utcnow
from app.database.session import get_db
from app.models import Conversation, Message, Participant, Profile
from app.schemas.inputs import ConversationCreate, ConversationUpdate, MessageCreate
from app.services.assistant import knowledge_reply
from app.services.common import audit, dump, notify, page

router = APIRouter(tags=['Conversations'])


@router.post('/conversations', status_code=201)
def create_conversation(data: ConversationCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    staff_id = str(data.professional_id) if data.professional_id else None
    if data.mode == 'professional' and not staff_id:
        raise HTTPException(422, 'Choose a professional before starting a conversation')
    if staff_id:
        require_staff(db, staff_id)
    record = Conversation(student_id=user.id, staff_id=staff_id if data.mode == 'professional' else None, mode=data.mode)
    db.add(record)
    db.flush()
    db.add(Participant(conversation_id=record.id, user_id=user.id))
    if record.staff_id:
        db.add(Participant(conversation_id=record.id, user_id=record.staff_id))
    audit(db, user, 'conversation.created', 'conversation', record.id)
    db.commit()
    return dump(record)


@router.get('/conversations')
@router.get('/staff/conversations')
def conversations(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    query = select(Conversation).where(Conversation.student_id == user.id) if user.role == 'student' else select(Conversation).where(Conversation.staff_id == user.id, Conversation.mode == 'professional')
    result = page(db, query.order_by(Conversation.updated_at.desc()), offset, limit)
    items = []
    for record in result['items']:
        participant = db.scalar(select(Participant).where(Participant.conversation_id == record.id, Participant.user_id == user.id))
        unread_query = select(Message).where(Message.conversation_id == record.id, Message.sender_id != user.id)
        if participant and participant.last_read_at:
            unread_query = unread_query.where(Message.created_at > participant.last_read_at)
        items.append({**dump(record), 'unread': len(list(db.scalars(unread_query)))})
    result['items'] = items
    return result


@router.get('/conversations/{conversation_id}/messages')
def messages(conversation_id: UUID, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100), user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    record = assigned_conversation(db, str(conversation_id), user)
    result = page(db, select(Message).where(Message.conversation_id == record.id).order_by(Message.created_at, Message.id), offset, limit)
    result['items'] = [dump(item) for item in result['items']]
    audit(db, user, 'conversation.viewed', 'conversation', record.id)
    db.commit()
    return result


@router.post('/conversations/{conversation_id}/read')
def mark_read(conversation_id: UUID, user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    record = assigned_conversation(db, str(conversation_id), user)
    participant = db.scalar(select(Participant).where(Participant.conversation_id == record.id, Participant.user_id == user.id))
    if participant:
        participant.last_read_at = utcnow()
    db.commit()
    return {'read': True}


@router.post('/conversations/{conversation_id}/messages', status_code=201)
def send_message(conversation_id: UUID, data: MessageCreate, user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    record = assigned_conversation(db, str(conversation_id), user)
    if record.status != 'active':
        raise HTTPException(409, 'This conversation is resolved')
    message = Message(conversation_id=record.id, sender_id=user.id, body=data.body)
    db.add(message)
    if record.title == 'New conversation':
        record.title = data.body[:100]
    record.updated_at = utcnow()
    if record.mode == 'ai':
        db.add(Message(conversation_id=record.id, sender_id=None, body=knowledge_reply(db, data.body), kind='knowledge'))
    else:
        other_id = record.staff_id if user.role == 'student' else record.student_id
        notify(db, other_id, 'message', 'You have a new message', '/professional/dashboard' if user.role == 'student' else '/chat')
    audit(db, user, 'message.created', 'conversation', record.id)
    db.commit()
    return dump(message)


@router.patch('/conversations/{conversation_id}')
def update_conversation(conversation_id: UUID, data: ConversationUpdate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = assigned_conversation(db, str(conversation_id), user)
    record.status = data.status
    audit(db, user, 'conversation.status_updated', 'conversation', record.id)
    db.commit()
    return dump(record)
