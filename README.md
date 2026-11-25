# 🫧 Bshooter — Full-Stack Bubble Shooter

> An original, production-style **full-stack bubble shooter web game**. The game's
> display name is **100% environment-driven** — change one variable, rebuild, and
> the whole app (frontend, backend, PWA, SEO) renames itself.

Default game identity: **`BUBBLE BLAST ADVENTURE`** (configurable via `VITE_GAME_NAME` / `GAME_NAME`).

---

## 1. Project Name

**Bshooter** (repository). The *in-app* product name is not hardcoded — it is read from
`VITE_GAME_NAME` on the frontend and `GAME_NAME` on the backend, through a single
configuration module on each side. See **§8 Environment Variables**.

## 2. Project Description

A colorful, cartoon-style bubble shooter built as a real game product, not a coding demo:
a proper canvas game engine with a clear state machine, data-driven levels with endless
auto-generation, boosters, special bubbles, combos and chain reactions, audio, a full
authentication system, persistent player progress, a global leaderboard, achievements,
daily challenges, server-side score validation and basic anti-cheat.

## 3. Reference Game

Inspired by the **gameplay genre and mechanics** of a classic bubble shooter
(reference: `Bubble Shooter` — `play.google.com/store/apps/details?id=game.bubble.shooter.dragon.pop`).

Only the **mechanics** were studied (aiming, match-3, floating-bubble removal, rescue
objectives, stars, boosters). **No** branding, characters, artwork, audio or code from the
reference were copied. All names, colors, the helper character *"Bubbo"*, sounds (synthesized),
animations and level layouts are original. See **§18 Known Limitations** and the
`ORIGINALITY & COPYRIGHT` notes below.

## 4. Gameplay Mechanics

- **Aiming** — mouse (desktop) or touch-drag (mobile); a live dotted **trajectory** with
  **wall bouncing** and a collision-point marker.
- **Shooting** — click / tap-release / Space. A strict state machine prevents double-shooting
  while a shot resolves.
- **Matching** — BFS connected-component detection pops groups of **3+** same-colored bubbles
  (chain matching, not visual adjacency). Rainbow bubbles are wildcards.
- **Floating detection** — bubbles no longer connected to the ceiling fall (BFS from row 0),
  producing **chain reactions** and bonus points.
- **Special bubbles** — Bomb (area clear), Rainbow (any color), Lightning (row clear),
  Fire (cluster destroy), Color-changer.
- **Boosters** — Aim Guide, Bomb, Rainbow, Extra Shots, Shuffle — each with real logic,
  inventory counts, and validation (e.g. no Extra Shot after the level ends).
- **Shot system**, **combos** (consecutive successful shots → score multiplier),
  **objectives** (clear all / rescue / target score / clear color / limited shots / drop / combo),
  **3-star** ratings, pause/restart, **undo** (real state restore), and a **hint** system.

## 5. Features

Gameplay: hex/offset grid · aiming + trajectory + wall bounce · collision & snap · match-3 BFS ·
floating detection · chain reactions · special bubbles · boosters · combos · 3 stars ·
40 campaign levels + **endless procedural levels** · 7 objective types · pause/restart/undo/hint.

App: landing · register/login/logout · dashboard · level select with unlocking · game screen ·
level-complete / level-failed screens · leaderboard (global/weekly/monthly) · achievements (10+) ·
daily challenge · profile · settings · help · 404 · responsive (mobile→desktop) · PWA + offline ·
synthesized audio with **independent** sound/music toggles · particles & animations · accessibility.

Backend: JWT + bcrypt auth · MongoDB models · game sessions · **server-side score validation** ·
**anti-cheat** · leaderboard aggregation · achievements engine · daily challenge · player progress ·
admin level management · rate limiting · safe error handling.

## 6. Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React 18, Vite, React Router, Zustand, Tailwind CSS |
| Game engine | Custom engine on HTML5 **Canvas** (framework-agnostic, `src/game/`) |
| Audio | Web Audio API (fully synthesized — no audio files) |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| PWA | Web App Manifest + Service Worker |

## 7. Installation

```bash
# 1. Clone
git clone https://github.com/PuneetkumarHegde/Bshooter.git
cd Bshooter

# 2. Frontend
cd client
cp .env.example .env         # then edit values
npm install
npm run dev                  # http://localhost:5173

# 3. Backend (new terminal)
cd ../server
cp .env.example .env         # then edit values (MONGODB_URI, JWT_SECRET, …)
npm install
npm run seed                 # optional: seed levels, achievements, admin
npm run dev                  # http://localhost:5000
```

> The frontend is **fully playable offline** (levels generate locally and progress is cached),
> so you can try the game even before configuring the backend. Accounts, the leaderboard and
> server validation require the backend + MongoDB.

## 8. Environment Variables

The game name has **one source of truth** and is **never hardcoded**.

**Frontend — `client/.env`**
```
VITE_GAME_NAME=BUBBLE BLAST ADVENTURE
VITE_API_URL=http://localhost:5000/api
```
Read through `client/src/config/gameConfig.js` → `export const GAME_NAME = import.meta.env.VITE_GAME_NAME || 'BUBBLE BLAST ADVENTURE'`.
Used everywhere (navbar, pages, footer, `index.html` title/SEO/Open Graph, PWA manifest, emails, error pages).

**Backend — `server/.env`**
```
GAME_NAME=BUBBLE BLAST ADVENTURE
PORT=5000
NODE_ENV=development
MONGODB_URI=<your mongodb connection string>
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```
Read through `server/src/config/gameConfig.js` → `GAME_NAME = process.env.GAME_NAME || 'BUBBLE BLAST ADVENTURE'`.

**⚠️ Rebuild note (frontend):** `VITE_*` variables are inlined at **build time**. After changing
`VITE_GAME_NAME`, you must **rebuild/redeploy** the frontend (`npm run build`) before the new name
appears in the production bundle. In dev, restart `npm run dev`. Backend `GAME_NAME` changes take
effect on server restart.

**Game-name evaluation test (verified):**
```bash
VITE_GAME_NAME="POP MASTER" npm run build     # title + manifest become "POP MASTER"
VITE_GAME_NAME="BUBBLE QUEST" npm run build    # title + manifest become "BUBBLE QUEST"
```
No React components are edited — the name flows from the single config module.

`.env`, `.env.local`, `.env.production` and `node_modules` are git-ignored. **Never commit real secrets.**

## 9. Database Setup

1. Create a free **MongoDB Atlas** cluster (or run MongoDB locally).
2. Put the connection string in `server/.env` as `MONGODB_URI`.
3. Seed baseline data: `cd server && npm run seed` (levels, achievements, optional admin).

Recommended collections (created by Mongoose): `users`, `levels`, `gamesessions`,
`achievements`, `userachievements`, `dailychallenges`.

> If `MONGODB_URI` is empty, the API still boots (health + generated levels work) and DB-backed
> routes return a clear **503** instead of crashing — convenient for first-run setup.

## 10. API Documentation

Base URL: `${VITE_API_URL}` (default `http://localhost:5000/api`). Protected routes need
`Authorization: Bearer <jwt>`.

**Auth** — `POST /auth/register` · `POST /auth/login` · `GET /auth/me` 🔒 · `POST /auth/logout` 🔒
**Levels** — `GET /levels` · `GET /levels/:id`
**Game** — `POST /games/start` 🔒 · `POST /games/complete` 🔒 · `GET /games/history` 🔒 · `GET /games/:id` 🔒
**Leaderboard** — `GET /leaderboard?scope=global|weekly|monthly` · `GET /leaderboard/me` 🔒
**Achievements** — `GET /achievements` · `GET /achievements/me` 🔒
**Daily Challenge** — `GET /daily-challenge` · `POST /daily-challenge/complete` 🔒
**Player** — `GET /player/progress` 🔒
**Admin** 🔒 (admin role) — `GET/POST /admin/levels` · `PUT/DELETE /admin/levels/:id` · `PATCH /admin/levels/:id/publish`

Example — complete a session (server validates & is authoritative):
```http
POST /api/games/complete
Authorization: Bearer <jwt>
{ "sessionToken": "...", "levelNumber": 7, "score": 4210, "stars": 3,
  "shotsUsed": 14, "bubblesPopped": 61, "bestCombo": 5, "rescued": 2, "completed": true }
→ { "serverValidated": true, "score": 4210, "stars": 3, "newHighScore": true, "newAchievements": [...] }
```

## 11. Game Architecture

Game logic is **separated from React** (no giant `App.jsx` / `Game.jsx`). The engine is a pure
class; React only handles input + HUD.

```
client/src/
├── game/            # engine (framework-agnostic)
│   ├── gameEngine.js       # orchestrator + canvas renderer + state machine
│   ├── hexGrid.js          # offset-grid geometry & neighbors
│   ├── collision.js        # trajectory, wall bounce, snap
│   ├── matchDetector.js    # BFS connected-color matching
│   ├── floatingDetector.js # BFS floating-bubble detection
│   ├── scoreManager.js     # scoring + combos
│   ├── specialBubbles.js   # bomb / rainbow / lightning / fire / color
│   ├── levelManager.js     # board build / restart clone
│   └── objectiveManager.js # objective rules
├── data/levelGenerator.js  # deterministic, data-driven levels
├── config/gameConfig.js    # single source of truth (GAME_NAME, tuning)
├── services/               # api, auth, game, leaderboard, audio
├── store/                  # Zustand: auth, settings, progress
├── hooks/useGameEngine.js  # React ↔ engine binding
├── components/             # Navbar, HUD, BoosterBar, overlays, Character …
└── pages/                  # landing, auth, dashboard, levels, game, …
```

**State machine:** `LOADING → READY → AIMING → SHOOTING → RESOLVING → (COMBO) → READY`,
terminating in `LEVEL_COMPLETE` / `LEVEL_FAILED`, with `PAUSED` overlay. Pause genuinely halts
the update loop.

## 12. Authentication

- Register/login issue a **JWT** (`jsonwebtoken`); passwords are hashed with **bcryptjs**.
- Protected routes use `requireAuth` middleware; admin routes add `requireAdmin`.
- The token is stored client-side and attached to protected requests; `ProtectedRoute` guards
  authenticated pages.

## 13. Score Validation (server-side)

The browser is **never trusted**. On `POST /games/complete` the server:
1. Verifies **session ownership** and that the session is **not reused** (anti-cheat).
2. Checks **plausibility** — shot budget (incl. boosters) and an **impossible-completion-time** guard.
3. **Regenerates the level** deterministically and recomputes a plausible **max score**;
   impossible payloads (e.g. `{ "score": 999999999 }`) are **rejected** and the session flagged.
4. Recomputes **stars** from the accepted score vs the level's thresholds.
5. Only then updates user totals, progress, and evaluates achievements.

## 14. Leaderboard

Global (lifetime user totals), Weekly and Monthly (aggregated from validated sessions in the
time window), plus **Your Rank**. Only server-validated scores can enter the leaderboard.

## 15. Deployment

- **Frontend → Vercel / Netlify.** Build `client` with `npm run build` (output `client/dist`).
  Set `VITE_GAME_NAME` and `VITE_API_URL` in the host's environment, then redeploy.
- **Backend → Render / Railway.** Deploy `server`, set env vars (`GAME_NAME`, `MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_ORIGIN`). Start command `npm start`; run `npm run seed` once.
- **Database → MongoDB Atlas.**

Live URLs (fill in after deploying):
- Frontend: `https://<your-project>.vercel.app`
- Backend: `https://<your-api>.onrender.com`

## 16. Screenshots

_Add screenshots here after running locally:_ landing, level select, gameplay (aiming + trajectory),
level complete, leaderboard, achievements, dashboard.

## 17. Demo Video

_Add a link to a short demo showing:_ landing → register → login → dashboard → level select →
aiming/shooting → wall bounce → match → pop → floating removal → combo → booster → rescue →
level complete → stars → leaderboard → achievements → mobile responsiveness → backend persistence.

## 18. Known Limitations

- Visual design uses a **custom Canvas renderer** (Phaser is an acceptable alternative per the
  spec); it is optimized and avoids thousands of DOM nodes.
- Friends leaderboard falls back to global (no friend graph yet).
- Offline mode caches the app shell and plays generated levels; score sync to the server happens
  when back online (offline scores are never blindly trusted).
- A visual admin **level editor** is scaffolded via admin APIs but ships as API-only (bonus).

---

### Originality & Copyright
All code, the **Bubbo** character, bubble art, backgrounds, UI, animations, synthesized audio and
level layouts are **original**. No logos, branding, characters, artwork, audio, screenshots or code
from the reference game are used. This project demonstrates studying an existing game *mechanic* and
independently engineering an original web implementation.

### Security
`JWT_SECRET`, MongoDB credentials, private keys and admin passwords are **backend-only** and never
committed. Only `VITE_*` values are exposed to the frontend bundle by design.
