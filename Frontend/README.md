# Kira App — Kepler College

The Kepler College wellness frontend, connected to FastAPI and prepared for Supabase Auth. Built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and Embla Carousel.

## Run locally — no Supabase or database needed

From the repository root:

```powershell
cd Frontend
npm ci
npm run dev
```

Development mode uses browser-only mock roles and sample data by default. You do not need an `.env` file, demo flags, a running backend, or a database. Open `/login` and choose **Continue as Student**, **Continue as Staff**, or **Continue as Admin**. The displayed email/password combinations also work in the normal login form.

Mock actions change sample data in session storage in the current browser tab. No authentication or data request is sent to Supabase or FastAPI. These are UI previews, not real accounts, secure authorization, clinical records, sent emails, or live AI responses. Account creation, email invitations, password recovery and file uploads require the connected service and are not simulated as successful deliveries.

To force preview mode, set `VITE_AUTH_MODE=mock` in `.env`. To connect Supabase later, set `VITE_AUTH_MODE=supabase`, configure the public project URL and publishable key, and follow [backend setup](../backend/README.md). Restart the frontend after changing environment variables. The standard production build excludes browser mock mode and demo credentials. The explicit `npm run build:demo` command includes only the requested public mockup, isolated from any real services.

```powershell
npm run test:mock
npm run build
```

The mock tests run with networking disabled and cover all roles, wrong credentials, role-scoped data, reload persistence, sign-out, and production guards.

## Frontend features

- Responsive public navigation, with a mobile menu and Ask & Connect dropdown.
- A centered Home hero with seven illustrated mental-health cards in a colorful animated fan. Each card opens a reflection; today's featured theme sits in the center and rotates by the Africa/Kigali date. On mobile, the cards form a swipeable deck.
- Hero cards use pastel gradients, icon badges, live titles and messages, and seven custom soft 3D illustrations. Optimized transparent PNGs are stored in `public/images/hero-wellness/`; the ImageGen prompt set is documented in `docs/hero-illustration-prompts.md`.
- Complete landing page: hero, daily wellness carousel, services, AI introduction, featured resources, privacy and trust, final call to action, and footer.
- Landing motion includes staggered section entrances, card hover interactions, a custom animated wellness illustration, and subtle daily-card and chat graphics. Motion can be paused, respects the system's reduced-motion preference, and pauses offscreen or when the tab is hidden.
- Seven mock daily wellness carousel cards, separate from the hero's mental-health themes. The carousel's featured starting card rotates by the **Africa/Kigali** calendar date. Visitors can swipe the carousel, use navigation buttons or keyboard arrows, open details, and save cards in this browser.
- Public routes for resources, resource previews, daily wellness, about, services, emergency, privacy, and other footer destinations.
- Appointments and Check-in pages follow the original prototype layouts, with example time selection and a private, unsaved mood interaction.
- Clearly labeled previews for student features scheduled for later phases. No messages, appointments, account details, or wellbeing records are collected by Phase 1.

## Structure

- `src/data/` — mock content, independent of UI components.
- `src/services/` — data access and Kigali date logic; replace mock data here when Supabase/FastAPI integration is ready.
- `src/components/` — reusable layout, illustration, and carousel components.
- `src/pages/` — route-level pages.
- `src/routes/` — React Router configuration.
- `src/styles.css` — Tailwind theme tokens and component styling.
- `src/styles/landing-motion.css` — landing animations and reduced-motion overrides.
- `src/styles/mental-health-hero.css` — styles and fan animation scoped to the Home hero.

## Integration status

The backend now supplies resources, daily cards, questions, conversations, appointments, check-ins, referrals, notifications and role-based dashboards. Supabase credentials are intentionally pending. Development-only mock roles can be enabled without Supabase; see the backend setup guide. See [the backend README](../backend/README.md) for setup, development accounts, tests, and remaining production requirements.

## Original roadmap

1. Simulated authentication, registration, student layout and dashboard.
2. Student resources, questions, messaging, AI assistant, appointments, and personal wellbeing flows.
3. Professional, administration, and aggregated management dashboards.
4. Service integration, accessibility review, content review, privacy approval, and institutional contact verification.

The educational card copy is sample content and needs review by qualified staff before publication. The emergency and contact pages distinguish published contact routes from preview features. Privacy and terms remain drafts for institutional review.

## Hosting the public mockup

Use `npm run build:demo` and publish `dist`. The included Vercel configuration already does this and handles direct navigation to `/login`, `/student/dashboard`, `/professional/dashboard`, and `/admin/dashboard`. The explicit public-demo flag is required for mock mode in a deployed build; ordinary `npm run build` remains protected from accidental mock access.

The public demo contains synthetic browser-only roles, not real authentication or student records. Normal sign-in and the role shortcut buttons both navigate to the corresponding dashboard. Each tab stores only its own preview changes.
