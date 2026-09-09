## Visual design

Defaults (warm cream + terracotta, or dark mode + neon accent, or identical rounded shadow-cards). Since this is a discussion-board/forum, I leaned into a **ledger/bulletin-board** feel instead of a card grid:

| Token | Value | Why |
|---|---|---|
| Ink | `#1B2430` | Near-black but blue-tinted, used for text and the top bar — not flat `#000`/`#111` |
| Paper | `#F1F3F4` | Cool light grey background, avoids the cliché warm-cream `#F4F1EA` |
| Mustard | `#E4A83B` | Primary accent (buttons, active tab, upvote) — avoids the common terracotta |
| Teal | `#2E7D6B` | Links, secondary accent |
| Plum | `#7C5AC7` | Downvote state only |
| Fraunces (serif) | Post titles, view headings | Gives titles character, like a masthead |
| IBM Plex Sans | UI chrome, body text | Neutral, legible, distinct from the serif |

**Layout choice:** posts render as thin horizontal rows separated by hairline dividers, with the vote count as a typographic numeral to the left — not a rounded card with a drop shadow. That's `.post-row` in `style.css`. Metadata reads as plain prose ("in *programming* by john_doe, 2 hours ago") instead of dot-separated tokens (`A · B · C`), per the "avoid template chrome" guidance — it's more conversational and matches how a human would say it.

The sidebar and top bar use 2–4px border radii, not fully rounded pills, and color is spent sparingly: mustard only shows up on primary actions, the active tab underline, and upvotes.

## Routing

There's no framework router — just a ~60-line hash router in `src/router.js`. The core idea:

```js
export function registerRoute(path, handler) {
  const paramNames = [];
  const pattern = path
    .replace(/:[a-zA-Z]+/g, (m) => { paramNames.push(m.slice(1)); return '([^/]+)'; })
    .replace(/\//g, '\\/');
  routes.push({ regex: new RegExp(`^${pattern}$`), paramNames, handler });
}
```

`/c/:name` becomes a regex `^\/c\/([^/]+)$` with `paramNames = ['name']`. On `hashchange`, it splits `location.hash` into a path and a query string (`#/?sort=new` → `path: '/'`, `query: {sort: 'new'}`), finds the first matching route, extracts named params, and calls the handler with `{ params, query }`.

In `main.js`, routes are registered against view functions:

```js
registerRoute('/c/:name', (ctx) => renderCommunityView(outlet, ctx));
registerRoute('/post/:id', (ctx) => renderPostView(outlet, ctx));
```

Each view function is async, does its own data fetching, and writes directly into the shared `#outlet` element — no virtual DOM, no diffing. That's the tradeoff of going vanilla: simpler mental model (render = build an HTML string, insert it, then attach listeners), at the cost of full re-renders per navigation instead of fine-grained updates. For a page like this (server round-trips dominate render cost anyway), that tradeoff is fine.

## App shell

`main.js` builds a static shell once:

```
topbar (search + auth actions)
└── layout-shell
    ├── sidebar (sort links + community list, sticky)
    └── #outlet (router target)
```

The sidebar and navbar are rendered once and wired once; only `#outlet` changes per route. That's why the sidebar's "active sort" state and the community list persist across navigations without re-fetching.

## Auth & data flow

- `api.js` is a thin fetch wrapper. It attaches `Authorization: Bearer <token>` automatically, and on a `401` it tries the refresh-token endpoint once, then replays the original request — so an expired access token is invisible to the UI.
- Session (`accessToken`, `refreshToken`, `user`) lives in `localStorage`, not in-memory app state, so a page reload doesn't log you out.
- There's no central store (no Redux-equivalent). Each view re-fetches what it needs on mount. `getCurrentUser()` reads the cached user object out of `localStorage` synchronously, which is how the navbar and post-detail "delete" button decide what to show without an extra round trip.

## Component pattern

Every component follows the same two-function shape: a pure `render*()` that returns an HTML string, and a `wire*()` that attaches event listeners after that string is in the DOM. For example `voteControl.js`:

```js
export function renderVote(target, score, userVote) { /* returns markup */ }
export function wireVotes(container) { /* attaches click handlers, calls the API, updates the DOM node directly */ }
```

Votes update optimistically — the click handler mutates the `.vote-score` text node right after a successful API call rather than waiting for a full re-fetch, so it feels instant. Comment replies work the same way: `wireCommentThread` takes an `onReplyAdded` callback that the post view uses to re-run `loadComments()` after a successful post, so nesting stays in sync with the server rather than trying to splice the new comment into the DOM by hand.

## PWA layer

`vite-plugin-pwa` in `generateSW` mode does two things: precaches the built app shell (JS/CSS/HTML/icons) so the app opens instantly and works offline, and applies a `NetworkFirst` strategy specifically to `/api/*` requests — it tries the network first (so data stays fresh) and only falls back to a cached response if the network fails, which is the right call for something like a feed where staleness matters more than raw offline availability.