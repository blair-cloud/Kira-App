# Kira App — Kepler College

The React frontend lives in [`Frontend/`](Frontend/). The FastAPI backend, migrations, tests, and Supabase setup instructions live in [`backend/`](backend/README.md).

## Run locally

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

Local development now opens a **browser-only mockup** automatically in local development. Log in with the Student, Staff, or Admin demo account. No backend or database is needed for these previews; sample changes stay in the current browser tab.

To force the preview, set `VITE_AUTH_MODE=mock` in `Frontend/.env`. To connect real services later, set `VITE_AUTH_MODE=supabase` and follow [backend setup](backend/README.md). Mock access is not included in production builds.

Development credentials:

| Role | Email | Password |
|---|---|---|
| Student | student@wellness.test | Student@123 |
| Professional | staff@wellness.test | Staff@123 |
| Admin | admin@wellness.test | Admin@123 |

Run the offline mock tests with `npm run test:mock` inside `Frontend`.

## Production build

```bash
cd Frontend
npm run build
```

The build output is written to `Frontend/dist/`. For hosting, set the project root to `Frontend`, use `npm run build`, and publish `dist`.

See [the frontend documentation](Frontend/README.md) for the source structure and feature details.
