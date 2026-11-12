from pathlib import Path
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.dependencies import roles
from app.core.permissions import require_staff
from app.database.session import get_db
from app.models import Appointment, AuditLog, Category, DailyCard, Department, EmergencyContact, KnowledgeSource, PlatformSetting, Profile, Question, Resource, Staff, Student
from app.schemas.inputs import Assign, DailyCardInput, EmergencyInput, KnowledgeInput, NamedInput, ResourceInput, SettingInput, StaffUpdate, UserCreate, UserUpdate
from app.services.common import audit, dump, notify, page, required
from app.services.supabase_admin import provision_user
from app.api.routes.appointments import appointment_view

router = APIRouter(tags=['Platform administration'])


@router.get('/admin/users')
def users(q: str = Query('', max_length=100), role: str = '', offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    query = select(Profile)
    if q:
        query = query.where(Profile.full_name.ilike(f'%{q}%') | Profile.email.ilike(f'%{q}%'))
    if role:
        query = query.where(Profile.role == role)
    result = page(db, query.order_by(Profile.created_at.desc()), offset, limit)
    result['items'] = [dump(item, ('privacy_settings', 'notification_preferences')) for item in result['items']]
    return result


@router.post('/admin/users', status_code=201)
@router.post('/admin/staff', status_code=201)
def create_user(data: UserCreate, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    if db.scalar(select(Profile.id).where(Profile.email == data.email.lower())):
        raise HTTPException(409, 'This account already has a profile')
    auth_user = provision_user(data.email.lower(), data.full_name)
    record = Profile(id=auth_user['id'], email=data.email.lower(), full_name=data.full_name, role=data.role)
    db.add(record)
    db.flush()
    if data.role == 'staff':
        db.add(Staff(user_id=record.id, contact_email=data.email.lower()))
    elif data.role == 'student':
        db.add(Student(user_id=record.id))
    audit(db, user, 'user.invited', 'profile', record.id)
    db.commit()
    return dump(record, ('privacy_settings', 'notification_preferences'))


@router.patch('/admin/users/{user_id}')
def edit_user(user_id: UUID, data: UserUpdate, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    record = required(db, Profile, user_id)
    if record.id == user.id and (data.active is False or (data.role and data.role != 'admin')):
        raise HTTPException(409, 'You cannot disable or demote your own administrator account')
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(record, key, value)
    if record.role == 'staff' and not db.scalar(select(Staff).where(Staff.user_id == record.id)):
        db.add(Staff(user_id=record.id, contact_email=record.email))
    if record.role == 'student' and not db.scalar(select(Student).where(Student.user_id == record.id)):
        db.add(Student(user_id=record.id))
    audit(db, user, 'user.updated', 'profile', record.id)
    db.commit()
    return dump(record, ('privacy_settings', 'notification_preferences'))


@router.get('/admin/staff')
def staff(user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    return [{**dump(item), 'full_name': profile.full_name, 'active': profile.active} for item, profile in db.execute(select(Staff, Profile).join(Profile, Profile.id == Staff.user_id).where(Profile.role == 'staff'))]


@router.get('/staff/profile')
def staff_profile(user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = db.scalar(select(Staff).where(Staff.user_id == user.id))
    if not record:
        raise HTTPException(404, 'Professional profile not found')
    return dump(record)


@router.patch('/staff/profile')
def own_staff_profile(data: StaffUpdate, user: Profile = Depends(roles('staff')), db: Session = Depends(get_db)):
    record = db.scalar(select(Staff).where(Staff.user_id == user.id))
    if not record:
        raise HTTPException(404, 'Professional profile not found')
    return save_staff(db, user, record, data)


def save_staff(db, user, record, data):
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(record, key, str(value) if key == 'department_id' else value)
    audit(db, user, 'staff.profile_updated', 'staff', record.id)
    db.commit()
    return dump(record)


@router.patch('/admin/staff/{staff_id}')
def edit_staff(staff_id: UUID, data: StaffUpdate, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    return save_staff(db, user, required(db, Staff, staff_id), data)


@router.get('/admin/appointments')
def all_appointments(staff_id: UUID | None = None, student_id: UUID | None = None, status: str = '', offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    query = select(Appointment)
    for column, value in [(Appointment.staff_id, staff_id), (Appointment.student_id, student_id), (Appointment.status, status)]:
        if value:
            query = query.where(column == (str(value)))
    result = page(db, query.order_by(Appointment.created_at.desc()), offset, limit)
    result['items'] = [appointment_view(db, item, user) for item in result['items']]
    return result


@router.get('/admin/question-assignments')
def question_assignments(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    result = page(db, select(Question).order_by(Question.created_at.desc()), offset, limit)
    result['items'] = [dump(item, ('student_id', 'body')) for item in result['items']]
    return result


@router.patch('/admin/questions/{question_id}/assignment')
def assign_question(question_id: UUID, data: Assign, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    require_staff(db, str(data.professional_id))
    record = required(db, Question, question_id)
    record.assigned_staff_id, record.status = str(data.professional_id), 'assigned'
    notify(db, record.assigned_staff_id, 'question', 'A question has been assigned to you', '/professional/dashboard')
    audit(db, user, 'question.assigned', 'question', record.id)
    db.commit()
    return dump(record, ('student_id', 'body'))


@router.get('/admin/audit-logs')
def audit_logs(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    result = page(db, select(AuditLog).order_by(AuditLog.created_at.desc()), offset, limit)
    care_entities = {'question', 'conversation', 'checkin', 'referral', 'closed_care_records'}
    result['items'] = [dump(item, ('actor_id',) if item.entity_type in care_entities else ()) for item in result['items']]
    return result


def install_content_routes(prefix, model, schema, allow_staff=False):
    allowed = ('admin', 'staff') if allow_staff else ('admin',)
    def listing(offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles(*allowed)), db: Session = Depends(get_db)):
        query = select(model)
        if user.role == 'staff':
            query = query.where(model.author_id == user.id)
        result = page(db, query.order_by(model.created_at.desc()), offset, limit)
        result['items'] = [dump(item) for item in result['items']]
        return result
    def create(data: schema, user: Profile = Depends(roles(*allowed)), db: Session = Depends(get_db)):
        values = data.model_dump()
        if allow_staff:
            values['author_id'] = user.id
            if user.role == 'staff':
                values.update(status='draft', featured=False)
        record = model(**values)
        db.add(record)
        db.flush()
        audit(db, user, 'content.created', model.__tablename__, record.id)
        db.commit()
        return dump(record)
    def edit(record_id: UUID, data: schema, user: Profile = Depends(roles(*allowed)), db: Session = Depends(get_db)):
        record = required(db, model, record_id)
        if user.role == 'staff' and (record.author_id != user.id or record.status != 'draft'):
            raise HTTPException(403, 'You can edit only your own draft content')
        values = data.model_dump()
        if user.role == 'staff':
            values.update(status='draft', featured=False)
        for key, value in values.items():
            setattr(record, key, value)
        audit(db, user, 'content.updated', model.__tablename__, record.id)
        db.commit()
        return dump(record)
    def archive(record_id: UUID, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
        record = required(db, model, record_id)
        record.status = 'archived'
        audit(db, user, 'content.archived', model.__tablename__, record.id)
        db.commit()
        return {'archived': True}
    for endpoint in (listing, create, edit, archive):
        endpoint.__name__ = model.__tablename__ + '_' + endpoint.__name__
    router.add_api_route(prefix, listing, methods=['GET'])
    router.add_api_route(prefix, create, methods=['POST'], status_code=201)
    router.add_api_route(prefix + '/{record_id}', edit, methods=['PATCH'])
    router.add_api_route(prefix + '/{record_id}', archive, methods=['DELETE'])


install_content_routes('/admin/resources', Resource, ResourceInput)
install_content_routes('/staff/resources', Resource, ResourceInput, allow_staff=True)
install_content_routes('/admin/daily-cards', DailyCard, DailyCardInput)
install_content_routes('/admin/knowledge', KnowledgeSource, KnowledgeInput)


@router.post('/admin/knowledge/upload', status_code=201)
async def upload_knowledge(file: UploadFile = File(...), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    filename = Path(file.filename or 'document.txt').name
    if Path(filename).suffix.lower() not in ('.txt', '.md'):
        raise HTTPException(422, 'Upload an approved UTF-8 text or Markdown document')
    raw = await file.read(get_settings().upload_max_bytes + 1)
    if len(raw) > get_settings().upload_max_bytes:
        raise HTTPException(413, 'Document is too large')
    try:
        content = raw.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(422, 'Document must be UTF-8 text')
    if not content.strip() or len(content) > 100000:
        raise HTTPException(422, 'Document must contain between 1 and 100000 characters')
    record = KnowledgeSource(title=filename[:200], filename=filename[:200], content=content, status='draft')
    db.add(record)
    audit(db, user, 'knowledge.uploaded', 'knowledge')
    db.commit()
    return dump(record)


@router.post('/admin/media/illustrations', status_code=201)
async def upload_image(file: UploadFile = File(...), user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    raw = await file.read(get_settings().upload_max_bytes + 1)
    if len(raw) > get_settings().upload_max_bytes:
        raise HTTPException(413, 'Image is too large')
    suffix = '.png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else '.jpg' if raw.startswith(b'\xff\xd8\xff') else None
    if not suffix:
        raise HTTPException(422, 'Upload a PNG or JPEG illustration')
    folder = Path('uploads')
    folder.mkdir(exist_ok=True)
    filename = str(uuid4()) + suffix
    (folder / filename).write_bytes(raw)
    audit(db, user, 'illustration.uploaded', 'media', filename)
    db.commit()
    return {'url': '/api/v1/media/' + filename}


@router.get('/admin/settings')
def settings(user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    return [dump(item) for item in db.scalars(select(PlatformSetting))]


@router.put('/admin/settings/{key}')
def setting(key: str, data: SettingInput, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
    if key not in ('notification_templates', 'appointment_types', 'platform', 'ai_guidance'):
        raise HTTPException(422, 'Unsupported platform setting')
    record = db.scalar(select(PlatformSetting).where(PlatformSetting.key == key))
    if not record:
        record = PlatformSetting(key=key)
        db.add(record)
    record.value = data.value
    audit(db, user, 'settings.updated', 'setting', key)
    db.commit()
    return dump(record)


def install_directory_routes(prefix, model, schema):
    def listing(user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
        return [dump(item) for item in db.scalars(select(model).limit(100))]
    def create(data: schema, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
        record = model(**data.model_dump())
        db.add(record)
        audit(db, user, 'directory.created', model.__tablename__)
        db.commit()
        return dump(record)
    def edit(record_id: UUID, data: schema, user: Profile = Depends(roles('admin')), db: Session = Depends(get_db)):
        record = required(db, model, record_id)
        for key, value in data.model_dump().items():
            setattr(record, key, value)
        audit(db, user, 'directory.updated', model.__tablename__, record.id)
        db.commit()
        return dump(record)
    router.add_api_route(prefix, listing, methods=['GET'], name=model.__tablename__ + '_list')
    router.add_api_route(prefix, create, methods=['POST'], status_code=201, name=model.__tablename__ + '_create')
    router.add_api_route(prefix + '/{record_id}', edit, methods=['PATCH'], name=model.__tablename__ + '_edit')


install_directory_routes('/admin/categories', Category, NamedInput)
install_directory_routes('/admin/departments', Department, NamedInput)
install_directory_routes('/admin/emergency-contacts', EmergencyContact, EmergencyInput)
