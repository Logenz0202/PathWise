# 🌍 PathWise – Smart Transport Comparison & Planner

[![CI](https://github.com/Logenz0202/PathWise/actions/workflows/ci.yml/badge.svg)](https://github.com/Logenz0202/PathWise/actions/workflows/ci.yml)

**PathWise** is a full-stack MVP for comparing how to make a trip between two cities in Central and Eastern Europe — by **car, train or bus** — on **travel time, cost and CO₂ emissions**. Pick the cities on an interactive map, choose one of your saved cars, and an **AI Eco-Coach** explains which option fits best depending on whether you care most about speed, money or the planet.

## 💡 Features

1. **Interactive map** – ~5,700 clickable cities and towns (Poland and its neighbours) from OpenStreetMap. Smaller towns appear as you zoom in. Places can also be searched by name, including Polish names such as *Praga*, *Lwów* or *Drezno*.
2. **Real road routes** – the route between two cities follows the actual road network (OpenStreetMap data via the free OSRM routing service, no API key) and is drawn on the map, with the real road distance and a time preview per mode before you compare.
3. **Multi-criteria comparison** – car vs. train vs. bus across door-to-door travel time, cost and CO₂, with the fastest, cheapest and greenest option highlighted. Times are realistic rather than "distance ÷ fixed speed": the car follows the speed limits of the roads it uses, the bus is capped at coach speed with stops and legal driver breaks, the train uses typical speeds per country with border and gauge changes, and train and bus include getting to the station.
4. **My Cars (car presets)** – save your own cars (name, fuel type, consumption, fuel/electricity price) and pick one in the planner; results and History show which car each comparison used. Petrol, diesel, LPG and electric are supported, with the right units (L/100km or kWh/100km). Without a selected car, PathWise uses an average car.
5. **AI Eco-Coach** – tell it what matters most (balanced, fastest, cheapest or greenest) and, optionally, anything else in your own words ("lots of luggage", "I want to work on the way"). Together with the computed numbers and the chosen car this goes to an LLM (via OpenRouter), which returns structured advice: the recommended mode (marked "AI pick" on its card), a one-line headline, the reasoning and up to two practical tips. If no API key is configured or the reply is unusable, a rule-based coach returns advice in the same format, so the app always works.
6. **History** – every comparison is saved; reopen or delete past trips. Each result has its own address (e.g. `/comparisons/42`), so it can be bookmarked, shared or reloaded.
7. **English / Polish and EUR / PLN** – switch language and currency from the header. Numbers and the AI's answer follow the chosen language.

### ✨ Creative twist
The Eco-Coach turns raw numbers into a decision for *you*: the same trip can get a different answer depending on your priority or a note like "moving flat, lots of luggage" (→ the car, because it can carry your things). Emissions are realistic rather than flattering: an electric car is charged from the grid, so it is **not** shown as zero-emission.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python 3.15, **FastAPI**, SQLAlchemy 2, Pydantic 2, httpx |
| Database | **SQLite** (a single file, created on first start; no database server) |
| Frontend | **React 19** + **TypeScript** (strict), **React Router 8**, Vite 8, Tailwind CSS 4, **shadcn/ui** (Radix), **Leaflet** / react-leaflet, lucide-react icons |
| AI | LLM via the **OpenRouter** API, free model by default (`google/gemma-4-26b-a4b-it:free`; configurable with `OPENROUTER_MODEL`) |
| Data | City list generated from **GeoNames**; map tiles from **OpenStreetMap** |
| Infrastructure | Docker Compose (database + API + frontend) |
| Quality | **pytest** + pytest-cov, **ruff**, GitHub Actions CI |

### Interesting solutions
- **Layered backend** – `api/` (REST routes) → `services/` (routing, calculator, AI coach, geo lookups) → `models/` + `schemas/` (SQLAlchemy tables, Pydantic validation).
- **Structured, grounded AI output** – the backend decides *what the numbers say* and the LLM explains it. For "balanced", each option gets a score from how many times worse it is than the best one on time, cost and CO₂ (log ratios, so 3× the price outweighs 3% more CO₂ instead of "winning a category"); a specific priority points to that category's winner. The prompt gives the model pre-formatted numbers, the exact differences ("+€60.63 vs car, 3.4x") and the best match; it must follow it unless the traveller's note gives a concrete reason, and must state the key trade-off with its size. The reply is a JSON object (`recommended`, `headline`, `reason`, `tips`) validated with Pydantic; temperature 0 keeps the same inputs giving the same pick.
- **Routing that is free, polite and offline-safe** – `services/routing.py` asks the public OSRM server for the route once per city pair (with an identifying User-Agent and at most one request per second, as its usage policy asks) and stores it in the database; the reverse trip reuses it. The line is simplified (Douglas–Peucker) to ~300 points for the map. If OSRM is down or `OSRM_URL` is empty, a straight-line estimate is used and the UI says so.
- **A transparent time model** – every rule in `services/calculator.py` is a named constant: traffic allowance and rest breaks for the car; for the bus, each road segment from OSRM capped at the 100 km/h coach limit, stops and the 45-minute break EU rules require after 4.5 h; for the train (no free rail router covers the region), a rail distance from the straight line, average long-distance train speeds per country, slower regional trains on short trips, and extra time at borders (passport control outside Schengen, changing trains where standard gauge meets the broad gauge of Lithuania, Belarus and Ukraine). Train times are labelled as estimates.
- **Free-text context, safely** – the traveller's note is passed to the model as quoted context with an instruction to ignore any instructions inside it (a simple prompt-injection guard), and is limited to 200 characters.
- **Free AI only, with a safe fallback** – the Eco-Coach only ever calls OpenRouter's free models (ids ending in `:free`; anything else is refused), so nobody needs paid credits. Free models are shared and often busy, so the request lists free fallbacks that OpenRouter tries in order (`OPENROUTER_FALLBACK_MODELS`), with reasoning switched off so "thinking" models still answer within the token limit. If all of that fails (no key, network, rate limit, invalid or empty reply), the problem is logged and rule-based advice in the same structure and the user's language is used instead.
- **5,700 markers without lag** – cities are drawn on a Leaflet canvas layer and filtered by zoom level and viewport, so only relevant markers are rendered.
- **Reproducible place data** – `scripts/build_cities.mjs` downloads every city and town from OpenStreetMap (Overpass API, no key) and builds the list: Latin-script names (English for Ukraine and Belarus), Polish and local names as search aliases, zoom tiers by population, duplicates removed. Names used by the earlier GeoNames-based list are kept as aliases (`scripts/legacy_names.json`), so saved trips like *Hannover* or *Grodno* still resolve.
- **Comparisons keep their own copy of the car** – the preset's name and specs are copied into each saved comparison, so History stays accurate after a car is renamed or deleted.
- **Zero-setup database** – SQLite, as the brief suggests: the API creates `backend/pathwise.db` and its tables on first start. SQLite keeps no time zone, so timestamps are written in UTC and sent to the browser marked as UTC (`...Z`); otherwise "5 min ago" in History would be off by the user's UTC offset.
- **Money stored once** – all amounts are calculated and stored in EUR; the frontend converts to PLN for display and input at a fixed rate.
- **Typed frontend** – strict TypeScript with the API shapes in one file (`src/types.ts`, mirroring the backend schemas). Translation keys are a type too: a misspelt key or a missing Polish translation fails the build.
- **Real URLs for every page** – React Router: `/` (map planner), `/history`, `/cars` and `/comparisons/:id`. A result opened from History or the planner reuses the data already loaded; opened directly, it is fetched from the API (with a "not found" page for unknown ids). The planner keeps the chosen route while you visit other pages.
- **A small, consistent UI** – dark only, warm neutral greys and one accent: orange for primary actions, with green and violet for the trip's start (A) and finish (B) (orange, green and violet are the three secondary colours, evenly spaced on the colour wheel). The palette lives in CSS variables in `styles/index.css`; buttons on orange use near-black text for contrast. Building blocks come from **shadcn/ui** (copied into `components/ui/`, built on Radix, so popovers, toggles and focus handling are accessible); feature folders compose them, and `components/common/` holds the app's own shared pieces (delete confirmation, empty and loading states). Class lists are merged with `cn()`.
- **Lightweight i18n** – a small React context (no extra library) for translations plus language-aware number, money and duration formatting.

## 🔌 REST API

Interactive docs (Swagger UI): http://localhost:8001/docs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cars/` | List saved car presets |
| `POST` | `/api/cars/` | Create a car preset → `201 Created` |
| `GET` | `/api/cars/{id}` | Get one car preset |
| `PUT` | `/api/cars/{id}` | Update (replace) a car preset |
| `DELETE` | `/api/cars/{id}` | Delete a car preset → `204 No Content` |
| `GET` | `/api/comparisons/` | List saved comparisons (history) |
| `POST` | `/api/comparisons/` | Run and save a comparison (incl. AI recommendation) → `201 Created` |
| `GET` | `/api/comparisons/{id}` | Get one comparison |
| `DELETE` | `/api/comparisons/{id}` | Delete a comparison → `204 No Content` |
| `GET` | `/api/geo/cities` | List supported cities |
| `GET` | `/api/geo/route?origin=&destination=[&distance_km=]` | Road route (map line, distance) and door-to-door time per mode for an average car |

Invalid input (including an unknown city or the same city twice) returns `422`; unknown ids return `404`. CORS is configured for the frontend origin (`CORS_ORIGINS` in `backend/app/core/config.py`).

## 📁 Project Structure

```text
PathWise/
├── backend/                # Python + FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/            # REST routes: cars, comparisons, geo
│   │   ├── core/           # Settings (environment variables)
│   │   ├── data/           # Generated city list (cities.json)
│   │   ├── db/             # Database session (SQLite)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Request / response validation
│   │   └── services/       # Calculator, AI Eco-Coach, geo lookups
│   └── tests/              # pytest: unit tests for services, API tests on a temporary SQLite database
├── frontend/               # React + TypeScript + Vite + Tailwind CSS + Leaflet
│   └── src/
│       ├── components/
│       │   ├── ui/         # shadcn/ui building blocks: Button, Input, Popover, Toggle Group, Card, …
│       │   ├── common/     # App-wide pieces: delete confirmation, empty and loading states
│       │   ├── layout/     # Header (navigation) and footer
│       │   ├── planner/    # Sidebar form: city inputs, distance card, car picker, preferences
│       │   ├── map/        # Leaflet map, its controls and overlays
│       │   ├── results/    # Comparison result: Eco-Coach card, per-mode cards, car details
│       │   ├── history/    # History list and cards
│       │   └── cars/       # Car preset form and row
│       ├── data/           # Generated city list (cities.json)
│       ├── hooks/          # API client and car presets hooks
│       ├── i18n/           # English / Polish text and formatting
│       ├── lib/            # cn() class-name helper (shadcn)
│       ├── pages/          # One per route: planner, history, comparison result, My Cars
│       ├── styles/
│       ├── utils/          # Cities, currency, fuel profiles, transport modes
│       └── types.ts        # API data types
├── .github/workflows/      # CI: lint + tests, frontend build, Docker build
├── scripts/                # build_cities.mjs (regenerates the city lists)
├── docker-compose.yml      # Database + API + frontend
└── README.md
```

## 🚀 Running Locally

There are two ways to run PathWise: **with Docker** (one command) or **without Docker** (API and frontend in two terminals). Neither needs a database server: the data lives in a SQLite file that is created on first start.

**Optional – AI key:** copy `.env.example` to `.env` in the project root and set `OPENROUTER_API_KEY` (get one at https://openrouter.ai/keys). Both ways read it from there. Only free models are used, so a key from a free OpenRouter account is enough; no credits are needed. Free models are rate-limited: when the main one is busy, free fallback models are tried, and if they are busy too, the offline recommendation is used. Without a key the app works the same, using the offline recommendation.

### With Docker
Requirements: **Docker** with Docker Compose.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8001 (Swagger: http://localhost:8001/docs)

The database file is kept in a Docker volume, so it survives restarts and rebuilds (`docker compose down -v` deletes it).

### Without Docker
Requirements: **Python 3.11+** and **Node.js 22.12+** (Docker and CI use Python 3.15 and Node 26 LTS).

**1. API** (terminal 1):

```bash
cd backend
python -m venv .venv
.venvScriptsactivate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

The database is created as `backend/pathwise.db` on first start (delete the file to start over).

**2. Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the API on port 8001.

## 🧪 Tests & CI

The backend has ~100 pytest tests (≈99% coverage):
- **Unit tests** for the time model (car breaks, coach speed cap and driver breaks, train speeds per country, border and gauge changes), the OSRM client (parsing, line simplification, caching, reverse trips and the fallback when OSRM fails, with a mocked HTTP transport), distance lookup and Eco-Coach: the decision logic (priorities and the size-based balanced score), formatting, parsing and validating the model's reply, the offline fallback, and the LLM call itself with a mocked HTTP transport (valid advice is used; HTTP errors, network errors and invalid replies fall back to offline advice). No network access or API key needed.
- **API tests** for every endpoint, run with FastAPI's `TestClient` against a real (temporary) SQLite database: CRUD flows, `201`/`204`/`404`/`422` responses, history order and paging, UTC timestamps and the CORS rules.

Tests use a throwaway database in a temporary folder, so your own `pathwise.db` is never touched, and need no network or API key:

```bash
cd backend
pip install -r requirements-dev.txt
pytest --cov
ruff check .
```

**GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push to `main` and every pull request: ruff + pytest with coverage, a type check and production build of the frontend, and a build of the Docker images.

## 🤖 How AI Tools Were Used

- **Google Antigravity** – generated the initial version of the app: the FastAPI + SQLAlchemy backend, the comparison calculator, the OpenRouter-based Eco-Coach with its offline fallback, the React frontend and the Docker setup.
- **Claude Code (Anthropic)** – used as a pair programmer for everything after that:
  - replacing the hand-drawn SVG map with Leaflet + OpenStreetMap and writing the GeoNames city-list generator;
  - car presets as a full CRUD resource (API + My Cars page), electric-car units and emissions, EUR/PLN and English/Polish support;
  - redesigning the Eco-Coach after testing its answers: structured JSON output validated before saving, a priority and free-text note from the traveller, door-to-door times, and moving the decision logic into the backend (size-based scoring) so the LLM explains a grounded choice instead of guessing — including fixing cases where it contradicted the numbers or gave tips for the wrong option;
  - UX changes (layout fitting laptop screens, history cards, header behaviour) based on my feedback, and a UI overhaul on shadcn/ui: I chose the direction (dark, one orange accent, no gradients or marketing copy) and reviewed it screen by screen;
  - real road routes from OSRM with a database cache and a realistic per-mode travel-time model (I chose free, keyless services and checked the numbers against real trips);
  - moving the frontend to TypeScript and React Router, and upgrading the stack to current versions (Python 3.15, Node 26, React 19, Vite 8, Tailwind CSS 4), and moving from PostgreSQL to SQLite so the project runs without a database server;
  - code review and cleanup: removing dead code, de-duplicating components, fixing bugs found along the way (e.g. a startup error in the config, broken API paths, an invalid AI model id) and REST status codes.
- I decided on the features and UX, reviewed the changes and tested the app in the browser on Docker after each step.

## 🗺️ Roadmap
- [x] Interactive map on OpenStreetMap tiles (Leaflet) with ~5,700 clickable cities and towns.
- [x] English / Polish interface and EUR / PLN prices.
- [x] Saved car presets.
- [x] Real road routes (OSRM) and realistic per-mode travel times.
- [ ] Villages too, loaded from the API by map area instead of one bundled list.
- [ ] Real train timetables instead of estimated train times.
- [ ] Polish display names for cities in the Polish interface (search already accepts them).
- [ ] Database module for gas stations and Electric Vehicle (EV) charging points along the route.
- [ ] User accounts and favorite saved routes tracking.
- [ ] Mobile app.

## 🏙️ Place Data & Attribution

The map, the sidebar search and the backend share one list of places: every city and town (OpenStreetMap `place=city` / `place=town`) in Poland, Germany, Czechia, Slovakia, Lithuania, Belarus and Ukraine, in `frontend/src/data/cities.json` and `backend/app/data/cities.json`. Place data, map tiles and road data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL); routes computed with [OSRM](https://project-osrm.org/).

To regenerate it (downloads ~4 MB from the public Overpass API; the raw responses are cached in `../.osm-cache` so re-runs are offline):

```bash
node scripts/build_cities.mjs
```
