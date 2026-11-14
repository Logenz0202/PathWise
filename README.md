# 🌍 PathWise – Smart Transport Comparison & Planner

**PathWise** is a full-stack MVP for comparing how to make a trip between two cities in Central and Eastern Europe — by **car, train or bus** — on **travel time, cost and CO₂ emissions**. Pick the cities on an interactive map, choose one of your saved cars, and an **AI Eco-Coach** explains which option fits best depending on whether you care most about speed, money or the planet.

## 💡 Features

1. **Interactive map** – ~1,700 clickable cities (Poland and its neighbours) on OpenStreetMap. Smaller towns appear as you zoom in. Cities can also be searched by name, including Polish names such as *Praga* or *Kijów*.
2. **Multi-criteria comparison** – car vs. train vs. bus across travel time, cost and CO₂, with the fastest, cheapest and greenest option highlighted.
3. **My Cars (car presets)** – save your own cars (name, fuel type, consumption, fuel/electricity price) and pick one in the planner; results and History show which car each comparison used. Petrol, diesel, LPG and electric are supported, with the right units (L/100km or kWh/100km). Without a selected car, PathWise uses an average car.
4. **AI Eco-Coach** – the computed numbers are sent to an LLM (via OpenRouter) for a short, personalised recommendation. If no API key is configured or the call fails, a built-in rule-based recommendation is used instead, so the app always works.
5. **History** – every comparison is saved; reopen or delete past trips.
6. **English / Polish and EUR / PLN** – switch language and currency from the header. Numbers and the AI's answer follow the chosen language.

### ✨ Creative twist
The Eco-Coach turns raw numbers into a decision ("take the train: almost as fast, a third of the CO₂"). Emissions are realistic rather than flattering: an electric car is charged from the grid, so it is **not** shown as zero-emission.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python 3.11, **FastAPI**, SQLAlchemy 2, Pydantic 2, httpx |
| Database | **PostgreSQL 15** (Docker) |
| Frontend | **React 18**, Vite 5, Tailwind CSS 3, **Leaflet** / react-leaflet, lucide-react icons |
| AI | LLM via the **OpenRouter** API (model configurable, default `google/gemma-4-26b-a4b-it`) |
| Data | City list generated from **GeoNames**; map tiles from **OpenStreetMap** |
| Infrastructure | Docker Compose (database + API + frontend) |

### Interesting solutions
- **Layered backend** – `api/` (REST routes) → `services/` (calculator, AI coach, geo lookups) → `models/` + `schemas/` (SQLAlchemy tables, Pydantic validation).
- **AI with a safe fallback** – any OpenRouter problem (no key, network, quota) is logged and replaced by an offline recommendation in the user's language.
- **1,700 markers without lag** – cities are drawn on a Leaflet canvas layer and filtered by zoom level and viewport, so only relevant markers are rendered.
- **Reproducible city data** – `scripts/build_cities.mjs` builds the city list from the GeoNames dump: it removes districts listed as separate towns, ranks cities into zoom tiers and adds Polish names as search aliases.
- **Comparisons keep their own copy of the car** – the preset's name and specs are copied into each saved comparison, so History stays accurate after a car is renamed or deleted.
- **Small schema upgrades without a migration tool** – `db/migrations.py` adds columns introduced after a database was created (e.g. `comparisons.car_name`), safely on every startup.
- **Money stored once** – all amounts are calculated and stored in EUR; the frontend converts to PLN for display and input at a fixed rate.
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
| `GET` | `/api/geo/distance?origin=&destination=` | Estimate the road distance between two cities |

Invalid input returns `422` with the offending fields; unknown ids return `404`. CORS is configured for the frontend origin (`CORS_ORIGINS` in `backend/app/core/config.py`).

## 📁 Project Structure

```text
PathWise/
├── backend/                # Python + FastAPI + SQLAlchemy
│   └── app/
│       ├── api/            # REST routes: cars, comparisons, geo
│       ├── core/           # Settings (environment variables)
│       ├── data/           # Generated city list (cities.json)
│       ├── db/             # Database session
│       ├── models/         # SQLAlchemy models
│       ├── schemas/        # Request / response validation
│       └── services/       # Calculator, AI Eco-Coach, geo lookups
├── frontend/               # React + Vite + Tailwind CSS + Leaflet
│   └── src/
│       ├── components/     # Map, sidebar, car picker, My Cars, results, history
│       ├── data/           # Generated city list (cities.json)
│       ├── hooks/          # API client and car presets hooks
│       ├── i18n/           # English / Polish text and formatting
│       ├── styles/
│       └── utils/          # Cities, currency, fuel profiles, transport modes
├── scripts/                # build_cities.mjs (regenerates the city lists)
├── docker-compose.yml      # Database + API + frontend
└── README.md
```

## 🚀 Running Locally

### Optional: AI key
Copy `.env.example` to `.env` in the project root and set `OPENROUTER_API_KEY` (get one at https://openrouter.ai/keys). Without a key the app works the same, using the offline recommendation.

### Option A – Docker (one command)
Requirements: **Docker** with Docker Compose.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8001 (Swagger: http://localhost:8001/docs)
- PostgreSQL: `localhost:5433` (user / password `postgres`, database `pathwise`)

### Option B – API and frontend without Docker
Requirements: **Python 3.11+**, **Node.js 18+** and a PostgreSQL database. The simplest way to get the database is to start only that container:

```bash
docker compose up -d db
```

**1. API** (terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

By default the API connects to `postgresql://postgres:postgres@localhost:5433/pathwise` (the `db` container). To use another PostgreSQL server, set the `DATABASE_URL` environment variable. To enable the AI coach, set `OPENROUTER_API_KEY`.

**2. Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the API on port 8001.

## 🤖 How AI Tools Were Used

- **Google Antigravity** – generated the initial version of the app: the FastAPI + SQLAlchemy backend, the comparison calculator, the OpenRouter-based Eco-Coach with its offline fallback, the React frontend and the Docker setup.
- **Claude Code (Anthropic)** – used as a pair programmer for everything after that:
  - replacing the hand-drawn SVG map with Leaflet + OpenStreetMap and writing the GeoNames city-list generator;
  - car presets as a full CRUD resource (API + My Cars page), electric-car units and emissions, EUR/PLN and English/Polish support;
  - UX changes (layout fitting laptop screens, history cards, header behaviour) based on my feedback;
  - code review and cleanup: removing dead code, de-duplicating components, fixing bugs found along the way (e.g. a startup error in the config, broken API paths, an invalid AI model id) and REST status codes.
- I decided on the features and UX, reviewed the changes and tested the app in the browser on Docker after each step.

## 🗺️ Roadmap
- [x] Interactive map on OpenStreetMap tiles (Leaflet) with ~1,700 clickable cities.
- [x] English / Polish interface and EUR / PLN prices.
- [x] Saved car presets.
- [ ] Polish display names for cities in the Polish interface (search already accepts them).
- [ ] Database module for gas stations and Electric Vehicle (EV) charging points along the route.
- [ ] User accounts and favorite saved routes tracking.

## 🏙️ City Data & Attribution

The map, the sidebar search and the backend share one city list (every place with 15k+ inhabitants in Poland, Germany, Czechia, Slovakia, Lithuania, Belarus and Ukraine): `frontend/src/data/cities.json` and `backend/app/data/cities.json`. It is generated from [GeoNames](https://www.geonames.org/) (CC-BY 4.0). Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

To regenerate it, download and unzip [`cities15000.zip`](https://download.geonames.org/export/dump/cities15000.zip), then run:

```bash
node scripts/build_cities.mjs path/to/cities15000.txt
```
