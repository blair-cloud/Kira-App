from functools import lru_cache
from typing import Literal
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    app_env: Literal['development', 'test', 'production'] = 'development'
    database_url: str = 'sqlite:///./kira.db'
    supabase_url: str = ''
    supabase_publishable_key: str = ''
    supabase_service_role_key: str = ''
    cors_origins: list[str] = ['http://127.0.0.1:5173', 'http://localhost:5173']
    auth_redirect_url: str = 'http://127.0.0.1:5173/auth/callback'
    enable_demo_accounts: bool = False
    enable_local_demo: bool = False
    demo_project_url: str = ''
    retention_days: int = Field(default=365, ge=1, le=36500)
    report_min_group_size: int = 5
    upload_max_bytes: int = 2_097_152

    @model_validator(mode='after')
    def production_guards(self):
        self.supabase_url = self.supabase_url.rstrip('/')
        if self.enable_local_demo and (self.app_env != 'development' or not self.database_url.startswith('sqlite:') or self.supabase_url):
            raise ValueError('Local mock login requires development mode, a local SQLite database, and no Supabase project configured')
        if self.app_env == 'production':
            if self.enable_demo_accounts or not self.database_url.startswith(('postgresql+psycopg://', 'postgresql://', 'postgres://')):
                raise ValueError('Production requires PostgreSQL and demo accounts disabled')
            if not self.supabase_url.startswith('https://') or not self.supabase_publishable_key:
                raise ValueError('Production requires Supabase HTTPS configuration')
            if any(not origin.startswith('https://') for origin in self.cors_origins):
                raise ValueError('Production CORS origins must use HTTPS')
        if self.report_min_group_size < 5:
            raise ValueError('Reports require a minimum group size of five')
        return self


@lru_cache
def get_settings():
    return Settings()
