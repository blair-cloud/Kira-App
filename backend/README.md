# Kira backend

FastAPI + SQLAlchemy 2 + Alembic, with **Supabase Auth** as the only identity provider. The React app remains in `../Frontend`.

## Current connection status

Supabase configuration is intentionally left blank until the project owner connects a project. The API runs with a local SQLite development database for public content and automated tests. It **does not create a replacement login system**: authenticated operations stay unavailable until Supabase is configured. SQLite is rejected in production and must not contain real student health information.

The assistant currently retrieves published guidance from resources and knowledge documents. It does not call a generative model or use a vector index. Its adapter is `app/services/assistant.py`; no AI credentials belong in React.

## Local setup (PowerShell, Python 3.12+)

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.lock
Copy-Item .env.example .env
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m app.seed
.venv/Scripts/python -m uvicorn app.main:app --reload --host 127.0.0.1
```

Do not overwrite an existing configured `.env`. `requirements.txt` expresses supported dependency ranges; `requirements.lock` pins the installation tested during implementation.

- Swagger: <http://127.0.0.1:8000/docs>
- OpenAPI: <http://127.0.0.1:8000/openapi.json>
- Health: <http://127.0.0.1:8000/api/v1/health>
- Readiness: `/api/v1/health/ready` returns 503 while authentication is unconfigured.

In another terminal:

```powershell
cd Frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Vite forwards `/api` to `127.0.0.1:8000`. Public sample resources and seven daily cards are served from the database. An API outage produces a visible error; mutations do not silently fall back to fake success.

## Connect Supabase later

1. Create a **development** Supabase project (or start the official Supabase local stack). Create a separate production project before public release.
2. Copy the PostgreSQL connection string from the project’s Connect panel into `backend/.env`. Use the session pooler when direct IPv6 access is unavailable. Format: `postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require`. URL-encode special characters in the database password.
3. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `backend/.env`. Use the project’s publishable key, or its legacy `anon` key. Set the server-only `SUPABASE_SERVICE_ROLE_KEY` only if account invitations or development seeding are needed.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `Frontend/.env` to the same public project values. **Never put a service-role key, database password, or signing secret in a `VITE_` variable.**
5. Configure Supabase Auth’s Site URL as `http://127.0.0.1:5173`. Allow `http://127.0.0.1:5173/auth/callback` and `http://127.0.0.1:5173/auth/callback?recovery=1` as redirect URLs. Add your HTTPS frontend URL separately for production. Configure a trusted email sender for invitations, confirmations, and password recovery.
6. Run `alembic upgrade head` **against the newly configured database**. Existing local SQLite data is not automatically copied to PostgreSQL. Restart both servers after changing environment files.
7. Use `/register` to create a student account through Supabase, confirm the email if required, then log in. FastAPI synchronizes a default student profile. Display-name metadata and JWT role strings cannot grant staff/admin permissions.

The private database schema is named `kira`. Do not add it to Supabase’s exposed Data API schemas. The initial migration revokes schema/table access for `PUBLIC`, `anon`, and `authenticated`; only the server database connection should reach these tables. Use a restricted server database role for production, not browser-side database access. Run migrations using a suitably privileged migration connection.

Token validation follows Supabase’s documented model: asymmetric access tokens are checked against the project’s JWKS, including signature, issuer, audience and expiration; legacy HS256 tokens are validated by the project’s Auth user endpoint. Permissions always come from current database profiles, including the active-account check.

Official references: [JWT validation](https://supabase.com/docs/guides/auth/jwts), [Auth admin user creation](https://supabase.com/docs/reference/python/auth-admin-createuser), [database connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [local development](https://supabase.com/docs/guides/local-development).

## Development demo accounts

No accounts have been created until you connect Supabase and run the seed script.

| Role | Email | Development password |
|---|---|---|
| Student | student@wellness.test | Student@123 |
| Staff | staff@wellness.test | Staff@123 |
| Admin | admin@wellness.test | Admin@123 |

For development **only**, set these backend values:

```dotenv
APP_ENV=development
ENABLE_DEMO_ACCOUNTS=true
DEMO_PROJECT_URL=https://YOUR-DEVELOPMENT-PROJECT.supabase.co
```

`DEMO_PROJECT_URL` must exactly match `SUPABASE_URL`. Then run:

```powershell
.venv/Scripts/python -m app.seed --demo
```

The script provisions passwords through Supabase Auth’s admin API and creates sample questions, replies, availability, appointments, messages, check-ins, notifications, goals, and a referral. Passwords are never stored in Kira’s database. Existing seed records are preserved; the script does not reset existing account passwords. If an Auth account exists without its matching profile, review that account manually rather than automatically taking it over.

To show quick-login buttons and credentials, set `VITE_ENABLE_DEMO_LOGIN=true` in `Frontend/.env` and restart Vite. The login component is dynamically imported only in a Vite **development** build, and also checks the backend demo flag. Production configuration rejects demo mode. There is no endpoint that returns demo passwords.

## Workspaces and implemented actions

- Student: `/student/dashboard` — personal overview, daily cards, questions/replies, conversations, appointments/cancellation, wellbeing history/sharing, goals, referrals, notifications, settings. Existing public chat, appointment and check-in designs now make API requests.
- Professional: `/professional/dashboard` — assigned questions, private professional notes, case status/priority, conversations/replies, appointment decisions/rescheduling, availability, shared check-ins, referrals, content drafts, professional profile.
- Admin: `/admin/dashboard` — user invitations/roles/activation, staff profiles, question assignment metadata, resources/publication, scheduled daily cards, text/Markdown knowledge uploads, illustration uploads, scheduling metadata, privacy-protected aggregate charts, audit log, directories and settings.

The frontend role guard is convenience only. Every private API request checks the user and record permissions again on the server. Dashboards use real database records and display loading, error, empty and success states.

## API organization

All endpoints use `/api/v1`. See Swagger for full request/response schemas and filters.

| Module | Examples |
|---|---|
| Auth/profile | `POST /auth/sync-profile`, `GET /auth/me`, `PATCH /users/me` |
| Content | `GET /resources`, `/resources/{slug}`, `/daily-cards`, `/professionals` |
| Questions | `/student/questions`, `/staff/questions/{id}/respond`, `/staff/questions/{id}/status` |
| Conversations | `/conversations`, `/{id}/messages`, `/{id}/read` |
| Appointments | `/student/appointments`, `/staff/appointments/{id}`, `/staff/availability` |
| Wellbeing | `/student/checkins`, `/{id}/unshare`, `/student/goals`, `/staff/wellbeing` |
| Referrals/updates | `/staff/referrals`, `/referrals`, `/notifications` |
| Administration | `/admin/users`, `/admin/staff`, `/admin/question-assignments`, `/admin/resources`, `/admin/daily-cards`, `/admin/knowledge`, `/admin/reports`, `/admin/audit-logs`, `/admin/settings` |

Paginated collections accept `offset` and `limit` (maximum 100). Resource and question filters are documented in OpenAPI. Content PATCH requests accept a full validated editor payload. DELETE on managed content archives it; check-in DELETE permanently removes the student-owned record. Availability closure does not erase appointment history.

## Booking and data-handling rules

- Professionals create future availability without overlaps. Appointment requests reserve a slot while pending. Database uniqueness plus transactional row locking protects booking conflicts in PostgreSQL.
- Students may cancel their own open appointment at least 24 hours before it starts. Staff can confirm/cancel/reschedule their own appointments and mark past appointments completed or no-show. Follow-up information is shared with the student and excluded from admin scheduling responses; private notes belong to the case’s private-note flow.
- Daily card publication uses inclusive dates and the `Africa/Kigali` timezone. The Home hero uses up to seven current published cards with the existing illustration and color system. Learn can browse the whole active collection.
- Private question text, messages, reflections, authentication values, and clinical notes are excluded from application logs and validation-error payloads. Audit records store action/reference metadata. General administrative audit output omits care-record actor IDs.
- Reports suppress an entire breakdown if a group has fewer than five records; care and registration groups also require five distinct students. This avoids repeated records from one student bypassing the threshold, and prevents complementary small-cell disclosure. Aggregate charts do not include message text, reflections, or counselling notes.
- CORS is an explicit allowlist. Access tokens are sent as Bearer headers. Responses containing API data use `Cache-Control: no-store`.
- The built-in limiter is **per process** (60 writes / 300 reads per IP per minute). Deploy a shared gateway limiter for multiple workers and tune trusted-proxy handling before production.

## Maintenance

Appointment reminders are database notifications; email/SMS delivery is not configured. Schedule this command regularly to enqueue due, confirmed appointment reminders:

```powershell
.venv/Scripts/python -m app.maintenance reminders
```

It avoids duplicate reminders. Notification preferences are respected.

Retention defaults to 365 days **as a development configuration, not an approved medical retention policy**. First inspect the dry run:

```powershell
.venv/Scripts/python -m app.maintenance retention
```

Only after the institution approves a retention policy, use `--apply-approved-policy`. This deletes expired check-ins and resolved/closed questions/conversations with their dependent notes/messages. It does not delete user accounts, audit records, appointment scheduling history, or referrals; these need separate institutional retention decisions. Backups and third-party Auth records require their own retention/deletion process.

## Tests and production readiness

```powershell
.venv/Scripts/python -m pytest
```

Tests cover token signatures/expiry/issuer/audience, database roles, unauthorized record access, anonymous follow-ups, private notes, check-in consent/unsharing, double-booking, overlapping times, cancellation/rescheduling, content publication, source uploads, privacy-protected reports, goals, notification access, and migration upgrade/downgrade.

SQLite tests do not prove PostgreSQL lock behavior or a live Supabase connection. Run integration tests against a dedicated Supabase development database before deployment. Real Supabase sign-in, confirmation/recovery email, invitations and demo provisioning remain unverified until configured.

Before real student use: approve Privacy/Terms, verify staff credentials and support coverage, review resource content, confirm consent/retention procedures, configure HTTPS and protected backups, restrict DB privileges, test account recovery and email delivery, add shared rate limits and monitoring, and perform a security review. The current deployment is local development, not a clinical production service.
