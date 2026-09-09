# Ripples

A social media platform and online forum network

## Stack
- **Vite** — dev server & build
- **Vanilla JS** — hash-based router, no framework
- **Bootstrap 5** — base components (buttons, forms, dropdowns, toasts), overridden
  with a custom theme in `src/style.css`
- **vite-plugin-pwa** — web app manifest + service worker (installable, works offline
  for the app shell, network-first caching for API calls)

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend if it's not localhost:3000
npm run dev             # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview          # serve the production build locally
```

The backend is expected to run at `http://localhost:3000/api` by default (same as the
`.http` collection's `@baseUrl`). Change `VITE_API_URL` in `.env` to point elsewhere.

## Structure

```
src/
  api.js              REST client (auth headers, token refresh, all endpoints)
  router.js           Minimal hash router
  utils.js            Formatting, toasts, auth guard helpers
  style.css           Theme (overrides Bootstrap)
  components/         navbar, sidebar, post row, vote control, comment thread
  views/              feed, login, register, community, communities, post,
                       submit, profile, search
```

## Pages
- `#/` — front page feed (Hot / New / Top / Controversial)
- `#/login`, `#/register`
- `#/communities` — browse & create communities
- `#/c/:name` — a single community's posts, join/leave
- `#/post/:id` — post detail, nested comments, voting, replying
- `#/submit` — create a text or link post
- `#/u/:username` — profile, posts & comments tabs
- `#/search?q=` — searches posts and communities

## Notes
- Auth tokens are stored in `localStorage`; a 401 triggers an automatic refresh-token
  retry once before falling back to logged-out state.
- Vote buttons update optimistically against the local score, then reconcile with the
  server response on the next full data load.
- Icons in `public/icons` are placeholders — swap them for your own branding.
