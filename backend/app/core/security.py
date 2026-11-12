from functools import lru_cache
from uuid import UUID
import httpx
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import get_settings

bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=4)
def jwks_client(url: str):
    return jwt.PyJWKClient(url, cache_keys=True, lifespan=300, timeout=10)


def verified_identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise HTTPException(401, 'Sign in to continue', headers={'WWW-Authenticate': 'Bearer'})
    settings = get_settings()
    if credentials.credentials.startswith('kira_demo_'):
        from app.services.local_demo import identity
        return identity(credentials.credentials)
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(503, 'Supabase authentication has not been configured')
    token = credentials.credentials
    try:
        algorithm = jwt.get_unverified_header(token).get('alg')
        if algorithm in ('RS256', 'ES256'):
            key = jwks_client(f'{settings.supabase_url}/auth/v1/.well-known/jwks.json').get_signing_key_from_jwt(token)
            claims = jwt.decode(token, key.key, algorithms=[algorithm], audience='authenticated',
                                issuer=f'{settings.supabase_url}/auth/v1', options={'require': ['exp', 'sub', 'iss', 'aud']})
            identity = {'id': claims['sub'], 'email': claims.get('email', ''), 'user_metadata': {}}
        elif algorithm == 'HS256':
            # Legacy Supabase projects: Auth validates the signature and session.
            # Never trust unverified claims, even when a JWT header is parseable.
            response = httpx.get(f'{settings.supabase_url}/auth/v1/user',
                                 headers={'apikey': settings.supabase_publishable_key, 'Authorization': f'Bearer {token}'}, timeout=10)
            if response.status_code != 200:
                raise HTTPException(401, 'Session is invalid or expired')
            identity = response.json()
        else:
            raise HTTPException(401, 'Unsupported access token')
        identity['id'] = str(UUID(identity['id']))
        if not identity.get('email'):
            raise HTTPException(401, 'An email account is required')
        return identity
    except HTTPException:
        raise
    except (httpx.HTTPError, jwt.PyJWKClientConnectionError):
        raise HTTPException(503, 'Authentication service is temporarily unavailable')
    except (jwt.PyJWTError, ValueError, KeyError, TypeError):
        raise HTTPException(401, 'Session is invalid or expired', headers={'WWW-Authenticate': 'Bearer'})
