from datetime import timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import roles
from app.core.permissions import require_staff
from app.database.base import utcnow
from app.database.session import get_db
from app.models import Appointment, Availability, Profile
from app.schemas.inputs import AppointmentCreate, AppointmentUpdate, SlotCreate
from app.services.common import audit, aware, dump, notify, page, required

router = APIRouter(tags=['Appointments and availability'])
ACTIVE = ('pending', 'confirmed', 'rescheduled')


def appointment_view(db, record, actor):
    # Platform administrators receive scheduling metadata, never clinical notes.
    result = dump(record, ('follow_up',) if actor.role == 'admin' else ())
    slot = db.get(Availability, record.slot_id)
    result.update(starts_at=slot.starts_at, ends_at=slot.ends_at, professional_name=db.get(Profile, record.staff_id).full_name)
    if actor.role in ('staff', 'admin'):
        result['student_name'] = db.get(Profile, record.student_id).full_name
    return result


@router.get('/professionals/{staff_id}/availability')
def available(staff_id: UUID, db: Session = Depends(get_db)):
    require_staff(db, str(staff_id))
    booked = select(Appointment.slot_id).where(Appointment.status.in_(ACTIVE))
    return [dump(slot) for slot in db.scalars(select(Availability).where(Availability.staff_id == str(staff_id), Availability.available.is_(True), Availability.starts_at > utcnow(), Availability.id.not_in(booked)).order_by(Availability.starts_at).limit(100))]


@router.get('/admin/staff/{staff_id}/availability')
@router.get('/staff/availability')
def own_availability(staff_id: UUID | None = None, user: Profile = Depends(roles('staff', 'admin')), db: Session = Depends(get_db)):
    target = str(staff_id) if staff_id else user.id
    if user.role == 'staff' and target != user.id:
        raise HTTPException(403, 'You can only manage your own availability')
    require_staff(db, target)
    return [dump(slot) for slot in db.scalars(select(Availability).where(Availability.staff_id == target, Availability.starts_at > utcnow()).order_by(Availability.starts_at).limit(100))]


@router.post('/admin/staff/{staff_id}/availability', status_code=201)
@router.post('/staff/availability', status_code=201)
def add_availability(data: SlotCreate, staff_id: UUID | None = None, user: Profile = Depends(roles('staff', 'admin')), db: Session = Depends(get_db)):
    target = str(staff_id) if staff_id else user.id
    if user.role == 'staff' and target != user.id:
        raise HTTPException(403, 'You can only manage your own availability')
    require_staff(db, target)
    db.scalar(select(Profile).where(Profile.id == target).with_for_update())
    if data.starts_at <= utcnow() or data.ends_at - data.starts_at > timedelta(hours=4):
        raise HTTPException(422, 'Choose a future slot no longer than four hours')
    overlap = db.scalar(select(Availability).where(Availability.staff_id == target, Availability.starts_at < data.ends_at, Availability.ends_at > data.starts_at, Availability.available.is_(True)))
    if overlap:
        raise HTTPException(409, 'This slot overlaps existing availability')
    slot = Availability(staff_id=target, **data.model_dump())
    db.add(slot)
    audit(db, user, 'availability.created', 'availability')
    db.commit()
    return dump(slot)


@router.delete('/admin/staff/{staff_id}/availability/{slot_id}')
@router.delete('/staff/availability/{slot_id}')
def remove_availability(slot_id: UUID, staff_id: UUID | None = None, user: Profile = Depends(roles('staff', 'admin')), db: Session = Depends(get_db)):
    target = str(staff_id) if staff_id else user.id
    if user.role == 'staff' and target != user.id:
        raise HTTPException(403, 'You can only manage your own availability')
    slot = db.scalar(select(Availability).where(Availability.id == str(slot_id), Availability.staff_id == target).with_for_update())
    if not slot:
        raise HTTPException(404, 'Slot not found')
    if db.scalar(select(Appointment.id).where(Appointment.slot_id == slot.id, Appointment.status.in_(ACTIVE))):
        raise HTTPException(409, 'Cancel the booked appointment first')
    slot.available = False
    audit(db, user, 'availability.closed', 'availability', slot.id)
    db.commit()
    return {'closed': True}


def reserve_slot(db, slot_id, student_id, exclude_appointment=None):
    db.scalar(select(Profile).where(Profile.id == student_id).with_for_update())
    slot = db.scalar(select(Availability).where(Availability.id == str(slot_id)).with_for_update())
    if not slot or not slot.available or aware(slot.starts_at) <= utcnow():
        raise HTTPException(409, 'This time is no longer available')
    require_staff(db, slot.staff_id)
    query = select(Appointment).join(Availability, Availability.id == Appointment.slot_id).where(Appointment.status.in_(ACTIVE))
    if exclude_appointment:
        query = query.where(Appointment.id != exclude_appointment)
    if db.scalar(query.where(Appointment.slot_id == slot.id)):
        raise HTTPException(409, 'This time has already been booked')
    if db.scalar(query.where(Appointment.student_id == student_id, Availability.starts_at < slot.ends_at, Availability.ends_at > slot.starts_at)):
        raise HTTPException(409, 'You already have an appointment at this time')
    return slot


@router.post('/student/appointments', status_code=201)
def book(data: AppointmentCreate, user: Profile = Depends(roles('student')), db: Session = Depends(get_db)):
    slot = reserve_slot(db, data.slot_id, user.id)
    record = Appointment(student_id=user.id, staff_id=slot.staff_id, slot_id=slot.id, appointment_type=data.appointment_type)
    db.add(record)
    db.flush()
    notify(db, slot.staff_id, 'appointment', 'An appointment request needs your review', '/professional/dashboard')
    notify(db, user.id, 'appointment', 'Your appointment request is pending', '/student/dashboard')
    audit(db, user, 'appointment.requested', 'appointment', record.id)
    db.commit()
    return appointment_view(db, record, user)


@router.get('/student/appointments')
@router.get('/staff/appointments')
def appointments(status: str = '', offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100), user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    query = select(Appointment).where(Appointment.student_id == user.id) if user.role == 'student' else select(Appointment).where(Appointment.staff_id == user.id)
    if status:
        query = query.where(Appointment.status == status)
    result = page(db, query.order_by(Appointment.created_at.desc()), offset, limit)
    result['items'] = [appointment_view(db, item, user) for item in result['items']]
    return result


@router.patch('/student/appointments/{appointment_id}')
@router.patch('/staff/appointments/{appointment_id}')
def update_appointment(appointment_id: UUID, data: AppointmentUpdate, user: Profile = Depends(roles('student', 'staff')), db: Session = Depends(get_db)):
    record = db.scalar(select(Appointment).where(Appointment.id == str(appointment_id)).with_for_update())
    if not record or (user.role == 'student' and record.student_id != user.id) or (user.role == 'staff' and record.staff_id != user.id):
        raise HTTPException(404, 'Appointment not found')
    if record.status not in ACTIVE:
        raise HTTPException(409, 'This appointment is already closed')
    slot = db.get(Availability, record.slot_id)
    if user.role == 'student':
        if data.status != 'cancelled' or data.follow_up is not None or data.slot_id:
            raise HTTPException(403, 'Students may only cancel their own appointment')
        if aware(slot.starts_at) - utcnow() < timedelta(hours=24):
            raise HTTPException(409, 'For cancellations within 24 hours, contact the office directly')
    else:
        if data.status == 'pending':
            raise HTTPException(422, 'Choose confirmed, rescheduled, completed, cancelled, or no_show')
        if data.status in ('completed', 'no_show') and aware(slot.starts_at) > utcnow():
            raise HTTPException(422, 'A future appointment cannot be marked completed or no-show')
        if data.status == 'rescheduled':
            if not data.slot_id:
                raise HTTPException(422, 'Select a replacement slot')
            new_slot = reserve_slot(db, data.slot_id, record.student_id, record.id)
            if new_slot.staff_id != user.id:
                raise HTTPException(403, 'You can only reschedule into your own availability')
            record.slot_id = new_slot.id
        elif data.slot_id:
            raise HTTPException(422, 'Use rescheduled status when changing the slot')
        if data.follow_up is not None:
            record.follow_up = data.follow_up
    if data.status is not None:
        record.status = data.status
    notify(db, record.student_id, 'appointment', 'Your appointment has an update', '/student/dashboard')
    audit(db, user, 'appointment.updated', 'appointment', record.id)
    db.commit()
    return appointment_view(db, record, user)
