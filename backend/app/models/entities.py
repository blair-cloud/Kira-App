from datetime import date, datetime
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, Record


def user_fk(**kwargs):
    return mapped_column(Uuid(as_uuid=False), ForeignKey('kira.profiles.id'), **kwargs)


class Profile(Record, Base):
    __tablename__ = 'profiles'
    __table_args__ = (CheckConstraint("role IN ('student','staff','admin')", name='valid_role'),)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), default='student', index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    privacy_settings: Mapped[dict] = mapped_column(JSON, default=dict)


class Department(Record, Base):
    __tablename__ = 'departments'
    name: Mapped[str] = mapped_column(String(100), unique=True)


class Student(Record, Base):
    __tablename__ = 'students'
    user_id: Mapped[str] = user_fk(unique=True)
    student_number: Mapped[str | None] = mapped_column(String(50), unique=True)


class Staff(Record, Base):
    __tablename__ = 'staff'
    user_id: Mapped[str] = user_fk(unique=True)
    department_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.departments.id'))
    title: Mapped[str] = mapped_column(String(100), default='Wellness professional')
    biography: Mapped[str] = mapped_column(Text, default='')
    areas: Mapped[list] = mapped_column(JSON, default=list)
    contact_email: Mapped[str] = mapped_column(String(254), default='')


class Category(Record, Base):
    __tablename__ = 'wellness_categories'
    name: Mapped[str] = mapped_column(String(100), unique=True)


class Resource(Record, Base):
    __tablename__ = 'wellness_resources'
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    body: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(String(1000), default='')
    status: Mapped[str] = mapped_column(String(20), default='draft', index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[str | None] = user_fk()
    minutes: Mapped[int] = mapped_column(Integer, default=4)
    tone: Mapped[str] = mapped_column(String(20), default='blue')


class DailyCard(Record, Base):
    __tablename__ = 'daily_wellness_cards'
    title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(100))
    message: Mapped[str] = mapped_column(String(1000))
    action: Mapped[str] = mapped_column(String(500), default='')
    detail: Mapped[str] = mapped_column(Text, default='')
    icon: Mapped[str] = mapped_column(String(30), default='heart')
    tone: Mapped[str] = mapped_column(String(30), default='blue')
    illustration_url: Mapped[str] = mapped_column(String(500), default='')
    status: Mapped[str] = mapped_column(String(20), default='draft')
    starts_on: Mapped[date | None] = mapped_column(Date)
    ends_on: Mapped[date | None] = mapped_column(Date)


class Question(Record, Base):
    __tablename__ = 'wellness_questions'
    student_id: Mapped[str] = user_fk(index=True)
    assigned_staff_id: Mapped[str | None] = user_fk(index=True)
    category: Mapped[str] = mapped_column(String(100))
    body: Mapped[str] = mapped_column(Text)
    anonymous: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(30), default='new', index=True)
    priority: Mapped[str] = mapped_column(String(20), default='normal')


class QuestionResponse(Record, Base):
    __tablename__ = 'question_responses'
    question_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.wellness_questions.id'), index=True)
    author_id: Mapped[str] = user_fk()
    body: Mapped[str] = mapped_column(Text)
    private_note: Mapped[bool] = mapped_column(Boolean, default=False)


class Conversation(Record, Base):
    __tablename__ = 'conversations'
    student_id: Mapped[str] = user_fk(index=True)
    staff_id: Mapped[str | None] = user_fk(index=True)
    mode: Mapped[str] = mapped_column(String(20), default='professional')
    title: Mapped[str] = mapped_column(String(120), default='New conversation')
    status: Mapped[str] = mapped_column(String(20), default='active')


class Participant(Record, Base):
    __tablename__ = 'conversation_participants'
    __table_args__ = (UniqueConstraint('conversation_id', 'user_id'),)
    conversation_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.conversations.id'), index=True)
    user_id: Mapped[str] = user_fk(index=True)
    last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Message(Record, Base):
    __tablename__ = 'messages'
    conversation_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.conversations.id'), index=True)
    sender_id: Mapped[str | None] = user_fk()
    body: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(20), default='human')


class Availability(Record, Base):
    __tablename__ = 'professional_availability'
    __table_args__ = (UniqueConstraint('staff_id', 'starts_at'), CheckConstraint('ends_at > starts_at', name='positive_duration'))
    staff_id: Mapped[str] = user_fk(index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    available: Mapped[bool] = mapped_column(Boolean, default=True)


class Appointment(Record, Base):
    __tablename__ = 'appointments'
    __table_args__ = (Index('uq_active_appointment_slot', 'slot_id', unique=True, postgresql_where=text("status IN ('pending','confirmed','rescheduled')"), sqlite_where=text("status IN ('pending','confirmed','rescheduled')")),)
    student_id: Mapped[str] = user_fk(index=True)
    staff_id: Mapped[str] = user_fk(index=True)
    slot_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.professional_availability.id'))
    appointment_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(30), default='pending', index=True)
    follow_up: Mapped[str] = mapped_column(Text, default='')


class Checkin(Record, Base):
    __tablename__ = 'wellbeing_checkins'
    __table_args__ = (CheckConstraint('score >= 1 AND score <= 5', name='score_range'),)
    student_id: Mapped[str] = user_fk(index=True)
    mood: Mapped[str] = mapped_column(String(30))
    score: Mapped[int] = mapped_column(Integer)
    reflection: Mapped[str] = mapped_column(Text, default='')
    shared_with_id: Mapped[str | None] = user_fk(index=True)


class Goal(Record, Base):
    __tablename__ = 'wellbeing_goals'
    student_id: Mapped[str] = user_fk(index=True)
    title: Mapped[str] = mapped_column(String(200))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)


class Referral(Record, Base):
    __tablename__ = 'referrals'
    student_id: Mapped[str] = user_fk(index=True)
    staff_id: Mapped[str] = user_fk(index=True)
    category: Mapped[str] = mapped_column(String(100))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default='pending')


class Notification(Record, Base):
    __tablename__ = 'notifications'
    user_id: Mapped[str] = user_fk(index=True)
    kind: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    link: Mapped[str] = mapped_column(String(200), default='')
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class Bookmark(Record, Base):
    __tablename__ = 'bookmarks'
    __table_args__ = (UniqueConstraint('student_id', 'resource_id'),)
    student_id: Mapped[str] = user_fk(index=True)
    resource_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey('kira.wellness_resources.id'))


class KnowledgeSource(Record, Base):
    __tablename__ = 'ai_knowledge_sources'
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default='draft')
    filename: Mapped[str] = mapped_column(String(200), default='')


class AuditLog(Record, Base):
    __tablename__ = 'audit_logs'
    actor_id: Mapped[str | None] = user_fk(index=True)
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(100), default='')


class EmergencyContact(Record, Base):
    __tablename__ = 'emergency_contacts'
    title: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(40))
    source_url: Mapped[str] = mapped_column(String(500))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class PlatformSetting(Record, Base):
    __tablename__ = 'platform_settings'
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
