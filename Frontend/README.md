# Kira App — Kepler College

The Kepler College wellness frontend, connected to FastAPI and prepared for Supabase Auth. Built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and Embla Carousel.

## Run locally

Run these commands from the `Frontend` directory. From the repository root, enter `cd Frontend` first.

```bash
npm install
npm run dev
```

Start the backend as described in [backend setup](../backend/README.md). Copy `.env.example` to `.env` and configure the public Supabase values when your project is ready. Then open the URL printed by Vite. Use `npm run build` to type-check and create a production bundle.

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

The backend now supplies resources, daily cards, questions, conversations, appointments, check-ins, referrals, notifications and role-based dashboards. Supabase credentials are intentionally pending. See [the backend README](../backend/README.md) for setup, development accounts, tests, and remaining production requirements.

## Original roadmap

1. Simulated authentication, registration, student layout and dashboard.
2. Student resources, questions, messaging, AI assistant, appointments, and personal wellbeing flows.
3. Professional, administration, and aggregated management dashboards.
4. Service integration, accessibility review, content review, privacy approval, and institutional contact verification.

The educational card copy is sample content and needs review by qualified staff before publication. The emergency and contact pages distinguish published contact routes from preview features. Privacy and terms remain drafts for institutional review.
