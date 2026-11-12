# Kira App — Kepler College

The React frontend lives in [`Frontend/`](Frontend/). The FastAPI backend, migrations, tests, and Supabase setup instructions live in [`backend/`](backend/README.md).

## Run locally

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

Start the backend in a separate terminal after following [backend setup](backend/README.md):

```bash
cd backend
.venv/Scripts/python -m uvicorn app.main:app --reload --host 127.0.0.1
```

API documentation: [Swagger UI](http://127.0.0.1:8000/docs). Supabase is intentionally unconfigured until a project is connected; public content works locally, while sign-in requires those settings. Never commit `.env` secrets.

## Production build

```bash
cd Frontend
npm run build
```

The build output is written to `Frontend/dist/`. For hosting, set the project root to `Frontend`, use `npm run build`, and publish `dist`.

See [the frontend documentation](Frontend/README.md) for the source structure and feature details.
