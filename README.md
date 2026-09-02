# VELOCITY — Real-Time Bike Racing Platform

A production-ready real-time bike racing platform. The server is fully
authoritative for race timing and outcome — the browser only renders what
the server tells it.

**Note:** This build is a pure spectator/entertainment experience. There is
no betting, wagering, paid entry, or real-money/virtual-currency system
anywhere in this codebase, and none should be added without re-architecting
the trust model (see "Important note on scope" at the bottom).

---

## Stack

- **Backend:** C# / ASP.NET Core 8 Web API, SignalR, MongoDB.Driver, JWT
- **Frontend:** React + TypeScript, Vite, **Ant Design**, Framer Motion, SignalR JS client, font: **Outfit**

---

## Design system

- **Font:** Outfit (Google Fonts) across the whole app.
- **Custom logo:** a hand-built SVG emblem (`src/components/Logo.tsx`) — a speed-chevron
  "V" badge with a gradient ring, not a stock icon — paired with the Outfit wordmark.
- **Hybrid light/dark theme:** the public race experience (home, live race, winners) uses
  a dark cinematic "broadcast" theme with neon accents, since that's the show people watch.
  The admin dashboard uses a clean light theme, since operators are scanning tables and
  forms. Both share the same brand color, font, and logo so the product still feels like
  one system — see `src/theme.ts` for the two Ant Design theme configs.
- **Fully responsive:** Ant Design's `Grid`/`Row`/`Col` breakpoints drive layout; the public
  nav collapses into a `Drawer` on mobile, the admin sidebar becomes a slide-out `Drawer`
  below the `lg` breakpoint, and tables switch to stacked cards on small screens.

---

## 1. Backend Setup

### Prerequisites
- .NET 8 SDK
- MongoDB (local install, Docker container, or MongoDB Atlas)

### Steps

```bash
cd Backend

# Restore packages
dotnet restore

# Configure your connection string + JWT key
# Edit appsettings.json (or use appsettings.Development.json / user-secrets):
#   Mongo:ConnectionString   e.g. mongodb://localhost:27017
#   Mongo:DatabaseName       e.g. BikeRacingDb
#   Jwt:Key   <-- MUST be changed to a long random secret before any real deployment

# Run (creates indexes + seeds the database on first run)
dotnet run
```

Quickest way to get MongoDB running locally with Docker:

```bash
docker run -d --name bikeracing-mongo -p 27017:27017 mongo:7
```

The API starts on `https://localhost:7099` (see `Properties/launchSettings.json` —
adjust the frontend's `VITE_API_URL` to match).

On first run, the app seeds:
- Admin login: `admin@bikeracing.com` / `Admin@123` (**change this immediately in production**)
- 15 demo bikes (Bike 01–15)
- One sample scheduled race starting ~2 minutes after boot

> **Bike count is dynamic, not fixed at 15.** A race can use anywhere from 2 up to
> however many *active* bikes exist in the `bikes` collection. Add a 16th, 17th, etc.
> bike from the admin **Bikes** page and it immediately becomes selectable when
> creating a race — there is no hardcoded 10–15 cap on either the frontend form or
> the backend validation (`AdminRaceService.CreateRaceAsync`).

> **Data model note:** MongoDB documents are used instead of a relational schema.
> `Race` documents embed a snapshot of their bikes (`Bikes: RaceBikeEmbedded[]`) at
> creation time rather than joining a separate table — this matches MongoDB's
> embed-over-join idiom and also preserves historical race data even if a `Bike`
> document is edited afterward. IDs are MongoDB `ObjectId`s serialized as strings.

### Key endpoints

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | none | Admin login |
| GET/POST/PUT/DELETE | `/api/bikes` | Admin | Bike management |
| GET/POST | `/api/races`, `/api/races/{id}/start\|cancel\|finish` | Admin | Race control |
| GET | `/api/public/current-race` | none | Winner hidden unless FINISHED |
| GET | `/api/public/winners` | none | Paginated, FINISHED races only |
| GET | `/api/public/races/{id}` | none | Public race detail |
| WS | `/hubs/race` | none (public), JWT via `?access_token=` (admin ops) | SignalR |

---

## 2. Frontend Setup

### Prerequisites
- Node.js 18+

### Steps

```bash
cd Frontend
npm install

# Point at your backend
cp .env.example .env
# edit .env -> VITE_API_URL=https://localhost:7099

npm run dev
```

Opens at `http://localhost:5173`.

- `/` — public homepage (live status, countdown, latest winner) with an **Admin Login**
  button in the header (desktop) or mobile nav drawer
- `/race` — live race view
- `/winners` — winner history
- `/admin/login` — admin login
- `/admin/dashboard`, `/admin/create-race`, `/admin/live-race`,
  `/admin/race-history`, `/admin/bikes`, `/admin/settings` — admin panel (JWT-protected),
  with a **View Live Race** button in the top bar that opens the public `/race` page in a
  new tab so the admin session stays intact

`npm run build` produces a static production bundle in `dist/`.

---

## 3. How server-authoritative timing works

- `RaceSchedulerService` (a `BackgroundService`) ticks every 500ms, comparing
  `DateTime.UtcNow` against each race's `StartTime` and `StartTime + DurationSeconds`.
  It never uses client input to decide race state.
- Every SignalR broadcast (`RaceStarted`, `RaceState`, `RaceFinished`) carries
  the server's own timestamp so clients can compute a clock offset and stay
  in sync regardless of the visitor's local clock.
- **Winner secrecy:** `RaceStateProvider` is the single choke point that turns
  a `Race` entity into a public DTO. It only ever populates `WinnerBikeId` /
  `WinnerBikeNumber` when `Status == FINISHED`. The admin DTO (JWT-protected)
  always includes it. There is no code path where the public REST API or
  public SignalR message can leak the winner early.
- **Refresh / reconnect:** on connect, `RaceHub.OnConnectedAsync` immediately
  pushes the current state to the joining client, and the frontend also does
  an initial REST fetch before SignalR connects — so a mid-race page load
  or refresh synchronizes to the correct elapsed time instead of restarting.
- **Server restart recovery:** on boot, `RaceSchedulerService.RecoverOnStartupAsync`
  re-evaluates any `RUNNING` race against real elapsed time — if the duration
  already passed while the server was down, it's finished immediately with the
  correct winner; otherwise it resumes broadcasting from the correct point.

---

## 4. Project structure

```
Backend/
  Controllers/   Auth, Bikes, Races (admin), Public
  Hubs/          RaceHub (SignalR)
  Services/      RaceSchedulerService, AdminRaceService, RaceStateProvider, ViewerTracker
  Models/        Admin, Bike, Race, RaceBike, RaceStatus
  DTOs/          Request/response records (public vs admin DTOs kept separate on purpose)
  Data/          MongoDbContext, DbSeeder
  Auth/          JwtTokenService
  Middleware/    ExceptionMiddleware

Frontend/
  src/
    components/  RaceTrack, BikeLane, WinnerModal, CountdownTimer, ConnectionBadge, PublicHeader
    pages/        HomePage, RacePage, WinnersPage, admin/*
    layouts/      AdminLayout
    hooks/        useRaceConnection, useServerClock, useAdminAuth
    services/     api.ts (axios), raceApi.ts, signalr.ts
    types/        shared DTO types
```

---

## 5. Security notes

- Passwords hashed with BCrypt; JWT signed with HMAC-SHA256.
- `Jwt:Key` in `appsettings.json` is a placeholder — replace it before any
  non-local deployment (use user-secrets or environment variables, not source control).
- Rate limiting via `AspNetCoreRateLimit` on all endpoints.
- CORS restricted to the configured frontend origin(s) in `appsettings.json` → `Cors:AllowedOrigins`.
- Winner confidentiality is enforced server-side (see §3), not just hidden in the UI —
  the value is genuinely absent from the JSON/SignalR payload until the race finishes.

---

## Important note on scope

This platform is built strictly as a **spectator/entertainment** product: no
betting, wagering, deposits, paid entry, or cash-out mechanics exist anywhere
in this codebase, and the admin pre-selecting a winner is treated the same as
a scheduled game-show reveal — never as a financial outcome. If real-money
wagering, paid entries, or a cash-convertible in-app currency are ever added
on top of this, the trust/architecture requirements change substantially
(regulatory licensing, provably-fair mechanisms, KYC, audit trails, etc.) and
this codebase would need a fundamentally different design review before that
use case.
