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

To force the preview, set `VITE_AUTH_MODE=mock` in `Frontend/.env`. To connect real services later, set `VITE_AUTH_MODE=supabase` and follow [backend setup](backend/README.md). The standard production build excludes mock access. The separately configured public demo build intentionally includes sample-only role previews.

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

## Public Vercel demo

This repository now includes `vercel.json` at the repository root and in `Frontend` so either Vercel Root Directory setting can build the current app. The configuration installs the frontend, runs `npm run build:demo`, publishes `dist`, and rewrites application routes to `index.html` so `/login` and each dashboard work on direct navigation and refresh.

`build:demo` explicitly sets `VITE_AUTH_MODE=mock` and `VITE_PUBLIC_DEMO=true`. It provides only synthetic data stored in each visitor's tab, with no backend, Supabase, or database connection. The public role credentials above are demo values, not access to a real student service.

For a real connected deployment later, change Vercel's build command in the appropriate `vercel.json` to `npm run build` (or the equivalent root-prefix command), remove the public-demo flag, and set `VITE_AUTH_MODE=supabase` with the approved service configuration.
