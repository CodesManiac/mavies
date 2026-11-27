# Mavies

## Overview

Mavies is a movie and television discovery and trailer browsing application. It presents catalogue rows, trending titles, categorized collections, title details, and embedded YouTube trailers. Users can create an email/password account, sign in, reset a password, and browse the catalogue through a responsive interface on desktop and mobile.

Mavies is **not** a streaming service. It does not host, license, or provide full-length movies or television episodes. Playback is limited to trailers embedded from YouTube when a trailer is available from TMDB.

## Features

- Email/password authentication.
- Account registration and password reset.
- Persistent client-side authentication sessions.
- Movie and television catalogue browsing.
- Trending content and categorized catalogue rows.
- Movie and television details, including genres and available trailer metadata.
- YouTube trailer playback through React Player.
- Responsive layouts for desktop and mobile.
- Mobile landscape fullscreen trailer support where the browser and device permit it, with inline playback fallback.
- Search modal on desktop and mobile.
- Dynamic movie and television search with debounced requests and stale-request cancellation.
- All / Movies / TV Shows category filtering.
- Search pagination with a bounded page limit.
- Search state preservation while viewing title details.
- Loading, empty, and error states for search and trailers.
- Keyboard navigation, focus management, focus restoration, and visible focus states.

## Technology stack

The stack below reflects the current `package.json` and `yarn.lock`:

- Next.js 15.5.29, using the Pages Router.
- React 18.3.1 and React DOM 18.3.1.
- TypeScript 4.7.2.
- Tailwind CSS 3.4.19, with `tailwind-scrollbar` and `tailwind-scrollbar-hide`.
- Firebase Authentication 13.4.0 (modular Auth SDK; Firestore is not used).
- Recoil 0.7.6 for client UI state.
- React Hook Form 7.x for authentication forms.
- React Player 2.x for YouTube trailer playback.
- Iconsax React for interface icons.
- TMDB API for catalogue, details, and search data.
- YouTube embedded playback for trailers.
- Vercel as the intended deployment platform.

Removed dependencies from the original baseline include `axios`, `sweetalert2`, and `spinners-react`.

## Architecture

### Data and rendering

- `pages/index.tsx` uses `getServerSideProps` to fetch the catalogue server-side.
- `lib/tmdb.ts` is the server-side TMDB client. It builds upstream URLs from `process.env.TMDB_API_KEY`, applies an abort timeout, translates upstream failures, normalizes result shapes, and caps search pagination.
- Catalogue requests use fixed upstream paths and Next.js fetch revalidation.
- `next.config.js` restricts optimized remote images to `image.tmdb.org/t/p/**`, enables WebP output, disables SVG remote images, and sets a minimum image cache TTL.

### Authentication

- Firebase Authentication runs entirely in the browser using public Firebase web configuration.
- `hooks/userAuth.tsx` exposes `onAuthStateChanged` state, sign-in, sign-up, password reset, sign-out, and form submission state through `UserAuthProvider`.
- `pages/index.tsx` gates the catalogue UI on Firebase client state and redirects unauthenticated users to `/login`.
- Firebase client authentication is a UI gate only. It does **not** provide server-side authorization for catalogue pages or API routes.

### API routes

- `GET /api/tmdb/details` validates `mediaType` (`movie` or `tv`) and a numeric `id`, then returns a minimal payload containing genres and a trailer key. It uses public response caching on success and `no-store` on classified upstream errors.
- `GET /api/tmdb/search` validates `q`, `type`, and `page`, then maps requests to fixed TMDB paths:
  - `type=all` → `/search/multi`
  - `type=movie` → `/search/movie`
  - `type=tv` → `/search/tv`
- Search results exclude people and adult titles, normalize movie/TV metadata, deduplicate by media type and ID, and cap pagination at page 20.
- Search API errors are sanitized; validation errors, rate limits, timeouts, service failures, and unsupported methods return minimal JSON error messages.

### Modal integration

- `components/SearchModal.tsx` implements the responsive search dialog, query/filter state, request cancellation, and pagination.
- `components/SearchResultCard.tsx` renders accessible landscape result cards.
- `components/Modal.tsx` implements the existing details and trailer dialog.
- Search remains mounted while details opens above it, preserving query, filter, results, and scroll position. Closing details returns focus to the originating result where available.
- `lib/focus.ts` contains focus containment and inert helpers. The catalogue wrapper is made inert while a modal is open, and body/document scrolling is locked.

## Local development

Prerequisites:

- Node.js 18.18 or newer.
- Yarn 1.x.
- A TMDB API key.
- A Firebase web app with Email/Password authentication enabled.

Install and run:

```bash
yarn install
cp .env.example .env.local
# Populate .env.local with your own values.
yarn dev
```

The development server starts on the default Next.js port, 3000, unless a port is supplied to `next dev`.

Verification and production build:

```bash
npx tsc --noEmit --incremental false
yarn build
yarn start
```

## Environment variables

`.env.example` is the canonical environment template. `.env.sample` is retained as an identical compatibility template; both should describe the same variables.

Required variables:

| Name | Scope | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | Server-only | TMDB catalogue, details, and search requests. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public Firebase web config | Firebase project client identifier. |
| `NEXT_PUBLIC_AUTH_DOMAIN` | Public Firebase web config | Firebase Auth domain. |
| `NEXT_PUBLIC_PROJECT_ID` | Public Firebase web config | Firebase project ID. |
| `NEXT_PUBLIC_STORAGE_BUCKET` | Public Firebase web config | Firebase storage bucket. |
| `NEXT_PUBLIC_MESSAGING_SENDER_ID` | Public Firebase web config | Firebase messaging sender ID. |
| `NEXT_PUBLIC_APP_ID` | Public Firebase web config | Firebase app ID. |

`NEXT_PUBLIC_*` Firebase web values are public by design and are not secrets. They should be constrained with authorized domains, security rules, and App Check only after compatibility verification.

`TMDB_API_KEY` must remain server-only. It is read through `process.env.TMDB_API_KEY` in server code and must never be given a `NEXT_PUBLIC_` prefix.

The deprecated `NEXT_PUBLIC_API_KEY` has been removed from source and both environment templates. Existing deployments may still depend on it until environment migration and credential rotation are completed.

`.env.local` is ignored by `.gitignore` and must remain untracked. Never commit real credential values.

## Security considerations

- The TMDB credential is handled server-side and is not included in client bundles or serialized page props.
- Upstream paths are fixed; user input selects among predefined endpoint mappings rather than forming arbitrary URLs.
- API parameters are type-checked, range-checked, and normalized before upstream requests.
- Upstream failures are translated into minimal, sanitized client errors.
- Search pagination is bounded to page 20.
- Successful API responses use public caching to reduce upstream traffic; error responses use `no-store`.
- Public TMDB proxy endpoints have no server-side authentication and remain susceptible to quota abuse by any caller who discovers them. Caching and validation are usage optimizations, not abuse prevention.
- Firebase Authentication is client-side UI gating. It does not protect server-side API routes or catalogue rendering.
- Dependency security remediation reduced the prior advisory baseline from 113 unique advisories to zero in the current audited tree; this is not a claim that the application is universally vulnerability-free.
- Catalogue, search, and trailer playback depend on external TMDB and YouTube availability and terms.

For a public portfolio deployment, proportionate abuse mitigation could include rate limiting at the hosting edge, request-origin heuristics, or a static-credential proxy with a strict quota. These are recommendations only and are not implemented here.

## Known limitations

- Fullscreen and landscape orientation locking depend on browser and device support; inline playback remains the fallback.
- YouTube playback controls are managed inside a cross-origin iframe and cannot be customized from application code.
- Some titles do not have a trailer available and display an unavailable state.
- External TMDB or YouTube outages affect catalogue, details, search, and trailer functionality.
- Public TMDB proxy endpoints remain susceptible to quota abuse.
- Search pagination is intentionally bounded to 20 pages.
- The Firebase web configuration is public; application security cannot rely on hiding it.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

TMDB attribution requirements call for prominent notice within the application and use of an approved TMDB logo that is less prominent than the Mavies mark. Mavies implements this in a compact Credits section at the bottom of the main catalogue. It uses the unmodified official blue short TMDB logo stored at `public/assets/images/tmdb-logo.svg`, links to <https://www.themoviedb.org>, and displays the required notice above.

Trailers are embedded from YouTube. YouTube branding and player controls are provided by the official embedded player and must not be obscured, replaced, or presented as originating from Mavies. Mavies is not endorsed or certified by YouTube.
