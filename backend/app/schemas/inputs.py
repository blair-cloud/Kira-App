from datetime import date, datetime, timezone
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Role = Literal['student', 'staff', 'admin']
QuestionStatus = Literal['new', 'assigned', 'in_progress', 'awaiting_student', 'resolved', 'closed']
AppointmentStatus = Literal['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show']
ReferralStatus = Literal['pending', 'referred', 'accepted', 'completed', 'declined', 'cancelled']
PublishStatus = Literal['draft', 'published', 'archived']


class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class ProfileSync(Input):
    full_name: str = Field(default='', max_length=120)


class ProfileUpdate(Input):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    notification_preferences: dict[str, bool] | None = None
    privacy_settings: dict[str, bool] | None = None


class UserCreate(Input):
    email: str = Field(min_length=5, max_length=254, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    full_name: str = Field(min_length=2, max_length=120)
    role: Role = 'student'


class UserUpdate(Input):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: Role | None = None
    active: bool | None = None


class StaffUpdate(Input):
    title: str | None = Field(default=None, max_length=100)
    biography: str | None = Field(default=None, max_length=3000)
    department_id: UUID | None = None
    areas: list[str] | None = Field(default=None, max_length=15)
    contact_email: str | None = Field(default=None, max_length=254)


class QuestionCreate(Input):
    body: str = Field(min_length=3, max_length=10000)
    category: str = Field(min_length=2, max_length=100)
    anonymous: bool = True
    professional_id: UUID | None = None


class ResponseCreate(Input):
    body: str = Field(min_length=1, max_length=10000)
    private_note: bool = False


class QuestionUpdate(Input):
    status: QuestionStatus
    priority: Literal['normal', 'follow_up', 'urgent'] = 'normal'


class Assign(Input):
    professional_id: UUID


class ConversationCreate(Input):
    mode: Literal['professional', 'ai'] = 'professional'
    professional_id: UUID | None = None


class MessageCreate(Input):
    body: str = Field(min_length=1, max_length=20000)


class ConversationUpdate(Input):
    status: Literal['active', 'resolved']


class SlotCreate(Input):
    starts_at: datetime
    ends_at: datetime

    @model_validator(mode='after')
    def validate_dates(self):
        if self.starts_at.tzinfo is None or self.ends_at.tzinfo is None:
            raise ValueError('Availability must include a timezone')
        if self.ends_at <= self.starts_at:
            raise ValueError('End must be after start')
        self.starts_at = self.starts_at.astimezone(timezone.utc)
        self.ends_at = self.ends_at.astimezone(timezone.utc)
        return self


class AppointmentCreate(Input):
    slot_id: UUID
    appointment_type: Literal['Counselling session', 'Medical appointment', 'Follow-up support']


class AppointmentUpdate(Input):
    status: AppointmentStatus | None = None
    slot_id: UUID | None = None
    follow_up: str | None = Field(default=None, max_length=5000)

    @model_validator(mode='after')
    def has_update(self):
        if self.status is None and self.slot_id is None and self.follow_up is None:
            raise ValueError('Provide a status, reschedule slot, or follow-up update')
        return self


class CheckinCreate(Input):
    mood: Literal['Great', 'Okay', 'Low', 'Anxious', 'Not sure']
    reflection: str = Field(default='', max_length=5000)
    shared_with_id: UUID | None = None


class GoalCreate(Input):
    title: str = Field(min_length=2, max_length=200)


class GoalUpdate(Input):
    completed: bool


class ReferralCreate(Input):
    student_id: UUID
    category: str = Field(min_length=2, max_length=100)
    reason: str = Field(min_length=3, max_length=5000)


class ReferralUpdate(Input):
    status: ReferralStatus


class RecommendResource(Input):
    student_id: UUID
    resource_id: UUID


class ResourceInput(Input):
    title: str = Field(min_length=3, max_length=200)
    slug: str = Field(min_length=3, max_length=200, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    category: str = Field(min_length=2, max_length=100)
    body: str = Field(min_length=3, max_length=100000)
    description: str = Field(default='', max_length=1000)
    status: PublishStatus = 'draft'
    featured: bool = False
    minutes: int = Field(default=4, ge=1, le=120)
    tone: Literal['blue', 'teal', 'lavender', 'peach'] = 'blue'


class DailyCardInput(Input):
    title: str = Field(min_length=3, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    message: str = Field(min_length=3, max_length=1000)
    action: str = Field(default='', max_length=500)
    detail: str = Field(default='', max_length=10000)
    icon: Literal['brain', 'book', 'heart', 'activity', 'users', 'sparkles', 'growth'] = 'heart'
    tone: Literal['blue', 'teal', 'lavender', 'peach'] = 'blue'
    illustration_url: str = Field(default='', max_length=500)
    status: PublishStatus = 'draft'
    starts_on: date | None = None
    ends_on: date | None = None

    @field_validator('illustration_url')
    @classmethod
    def safe_image(cls, value):
        if value and not (value.startswith('/images/') or value.startswith('/api/v1/media/') or value.startswith('https://')):
            raise ValueError('Use an HTTPS or local image URL')
        return value

    @model_validator(mode='after')
    def schedule(self):
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError('End date must not precede start date')
        return self


class KnowledgeInput(Input):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=3, max_length=100000)
    status: PublishStatus = 'draft'


class SettingInput(Input):
    value: dict = Field(default_factory=dict)


class NamedInput(Input):
    name: str = Field(min_length=2, max_length=100)


class EmergencyInput(Input):
    title: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=3, max_length=40, pattern=r'^[+\d ()-]+$')
    source_url: str = Field(max_length=500, pattern=r'^https://')
    active: bool = True
