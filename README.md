# Kira App — Kepler College

Phase 1 of the Kepler College wellness frontend. Built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and Embla Carousel.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed by Vite. Use `npm run build` to type-check and create a production bundle.

## Phase 1 features

- Responsive public navigation, with a mobile menu and Ask & Connect dropdown.
- The original prototype's split hero, daily flash card, four service cards, and calm wellbeing feature layout, now styled with Trust Blue.
- Complete landing page: hero, daily wellness carousel, services, AI introduction, featured resources, privacy and trust, final call to action, and footer.
- Landing motion includes staggered section entrances, card hover interactions, a custom animated wellness illustration, and subtle daily-card and chat graphics. Motion can be paused, respects the system's reduced-motion preference, and pauses offscreen or when the tab is hidden.
- Seven mock daily wellness cards. The hero flash card and carousel's featured starting card rotate by the **Africa/Kigali** calendar date. Visitors can flip the hero card, swipe the carousel, use navigation buttons or keyboard arrows, open details, and save cards in this browser.
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

## Next phases

1. Simulated authentication, registration, student layout and dashboard.
2. Student resources, questions, messaging, AI assistant, appointments, and personal wellbeing flows.
3. Professional, administration, and aggregated management dashboards.
4. Service integration, accessibility review, content review, privacy approval, and institutional contact verification.

The educational card copy is sample content and needs review by qualified staff before publication. Emergency numbers and professional credentials are intentionally absent until approved.
