from collections import defaultdict, deque
from pathlib import Path
from time import monotonic
from uuid import uuid4
import logging
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.config import get_settings
from app.database.session import engine
from app.models import Profile
from app.api.routes import admin, appointments, auth, conversations, dashboard, questions, resources, wellbeing

settings = get_settings()
logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s %(message)s')
logger = logging.getLogger('kira')
# Do not let HTTP clients log URLs, access tokens, or authentication responses.
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('httpcore').setLevel(logging.WARNING)
logging.getLogger('uvicorn.access').disabled = True

app = FastAPI(title='Kira App API', version='1.0.0', description='Kepler College wellness services. Supabase Auth; roles and private-record permissions enforced by FastAPI.')
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False, allow_methods=['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['Authorization', 'Content-Type'], expose_headers=['X-Request-ID'])
_requests: dict[str, deque] = defaultdict(deque)


@app.middleware('http')
async def request_guards(request: Request, call_next):
    request_id = str(uuid4())
    if request.method != 'OPTIONS' and settings.app_env != 'test':
        now = monotonic()
        if len(_requests) > 10000:
            for key in list(_requests):
                if not _requests[key] or _requests[key][-1] < now - 60:
                    del _requests[key]
        key = (request.client.host if request.client else 'unknown') + (':write' if request.method != 'GET' else ':read')
        window = _requests[key]
        while window and window[0] < now - 60:
            window.popleft()
        maximum = 60 if request.method != 'GET' else 300
        if len(window) >= maximum:
            return JSONResponse({'detail': 'Too many requests. Please try again shortly.'}, 429, headers={'Retry-After': '60', 'X-Request-ID': request_id})
        window.append(now)
    response = await call_next(request)
    response.headers['X-Request-ID'] = request_id
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    if request.url.path.startswith('/api/v1/') and '/media/' not in request.url.path:
        response.headers['Cache-Control'] = 'no-store'
    return response


@app.exception_handler(IntegrityError)
async def constraint_error(request, exception):
    return JSONResponse({'detail': 'This request conflicts with an existing record. Refresh and try again.'}, 409)


@app.exception_handler(RequestValidationError)
async def input_error(request, exception):
    # Pydantic's default response includes the submitted input. Never echo private
    # messages, passwords, or medical reflections in validation error payloads.
    errors = [{'loc': list(item['loc']), 'msg': item['msg'], 'type': item['type']} for item in exception.errors()]
    return JSONResponse({'detail': jsonable_encoder(errors)}, 422)


@app.exception_handler(SQLAlchemyError)
async def database_error(request, exception):
    logger.error('Database operation failed (%s)', type(exception).__name__)
    return JSONResponse({'detail': 'The data service is temporarily unavailable'}, 503)


@app.get('/api/v1/health', tags=['Health'])
def health():
    return {'status': 'ok', 'authentication_configured': bool(settings.supabase_url and settings.supabase_publishable_key), 'database': 'postgresql' if engine.dialect.name == 'postgresql' else 'sqlite-development', 'demo_accounts_enabled': settings.enable_demo_accounts and settings.app_env == 'development'}


@app.get('/api/v1/health/ready', tags=['Health'])
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(select(Profile.id).limit(1))
        if not (settings.supabase_url and settings.supabase_publishable_key):
            return JSONResponse({'status': 'configuration_required', 'detail': 'Configure Supabase Auth to enable sign-in'}, 503)
        return {'status': 'ready'}
    except SQLAlchemyError:
        return JSONResponse({'status': 'database_unavailable'}, 503)


for router in (auth.router, resources.router, questions.router, conversations.router, appointments.router, wellbeing.router, dashboard.router, admin.router):
    app.include_router(router, prefix='/api/v1')

Path('uploads').mkdir(exist_ok=True)
app.mount('/api/v1/media', StaticFiles(directory='uploads'), name='public_illustrations')
