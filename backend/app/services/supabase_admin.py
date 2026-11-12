import httpx
from fastapi import HTTPException
from app.core.config import get_settings


def provision_user(email: str, full_name: str, password: str | None = None):
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(503, 'Server-side Supabase user provisioning is not configured')
    headers = {'apikey': settings.supabase_service_role_key, 'Authorization': f'Bearer {settings.supabase_service_role_key}'}
    data = {'email': email, 'user_metadata': {'full_name': full_name}}
    path = '/auth/v1/invite'
    if password:
        data.update(password=password, email_confirm=True)
        path = '/auth/v1/admin/users'
    try:
        response = httpx.post(settings.supabase_url + path, headers=headers, json=data, timeout=20)
    except httpx.HTTPError:
        raise HTTPException(503, 'Supabase account provisioning is temporarily unavailable')
    if response.status_code not in (200, 201):
        # Upstream errors may contain personal details; never echo the response body.
        raise HTTPException(409 if response.status_code == 422 else 502, 'Supabase could not provision this account. Check existing users and server configuration.')
    body = response.json()
    return body.get('user', body)
