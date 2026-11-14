# 🌍 PathWise – Smart Transport Comparison & Planner

A modern **Full-Stack MVP** application. PathWise allows users to comprehensively compare alternative modes of transport (Car with a personalized fuel profile, Train, Bus) based on **travel time, financial cost, and carbon footprint (CO2)**, empowered by an intelligent **AI Eco-Coach**.

## 🚀 Project Architecture

The project is split into independent layers and orchestrated via containerization (Docker + PostgreSQL):

```text
PathWise/
├── backend/                # Python + FastAPI + SQLAlchemy
│   └── app/
│       ├── api/            # HTTP routes (comparisons, geo)
│       ├── core/           # Settings
│       ├── data/           # Generated city list (cities.json)
│       ├── db/             # Database session
│       ├── models/         # SQLAlchemy models
│       ├── schemas/        # Request / response schemas
│       └── services/       # Calculator, AI Eco-Coach, geo lookups
├── frontend/               # React + Vite + Tailwind CSS + Leaflet
│   └── src/
│       ├── components/     # Map, sidebar, car settings, results, history
│       ├── data/           # Generated city list (cities.json)
│       ├── hooks/          # API client hook
│       ├── i18n/           # English / Polish text and formatting
│       ├── styles/
│       └── utils/          # Cities, currency, fuel profiles, transport modes
├── scripts/                # build_cities.mjs (regenerates the city lists)
├── docker-compose.yml      # Full application orchestration (DB + BE + FE)
└── README.md
```

## 💡 Key Features & Creative Twist

1. **Interactive Map:** Pick start and destination by clicking any of ~1,700 cities on an OpenStreetMap map (Poland and its neighbours), or search by name, including Polish names like *Praga* or *Kijów*.
2. **Personalized Car Costs:** Set your car's fuel type (petrol, diesel, LPG or electric), consumption and fuel price. Units follow the fuel type (L/100km or kWh/100km), and EV emissions use the grid's CO2 intensity.
3. **Multi-Criteria Comparison:** For any city-to-city trip, compare Car, Train and Bus across travel time, cost and CO2 emissions.
4. **AI Eco Coach (OpenRouter):** The computed numbers are sent to an LLM via OpenRouter for a personalized recommendation (time vs. money vs. ecology). Without an API key, a built-in offline recommendation is used instead.
5. **History:** Comparisons are saved in PostgreSQL; browse, reopen and delete them.
6. **English / Polish and EUR / PLN:** Switch language and currency from the header. Prices are calculated in EUR and converted at a fixed rate; numbers and the AI's answer follow the chosen language.

## 🛠️ Setup & Execution (Docker + PostgreSQL)

To run the application, you only need **Docker** and **Docker Compose** installed on your machine.

### 1. Configure Environment
In the root directory of the project, create a `.env` file based on the template below:

```env
OPENROUTER_API_KEY=your_api_key_here
```
*(Note: If you leave this blank or don't provide a key, the app will automatically run in demo mode with an intelligent AI fallback).*

### 2. Run with a Single Command
In the root project directory, run:

```bash
docker compose up --build
```

That's it! Docker will automatically spin up:
* **Database (PostgreSQL):** Running on port `5432`
* **Backend (FastAPI):** Available at `http://localhost:8001` (Swagger Docs: `http://localhost:8001/docs`)
* **Frontend (React + Vite):** Available at `http://localhost:5173`

## 🗺️ Roadmap / Future Features
- [x] Interactive map on OpenStreetMap tiles (Leaflet) with ~1,700 clickable cities.
- [x] English / Polish interface and EUR / PLN prices.
- [ ] Polish display names for cities in the Polish interface (search already accepts them).
- [ ] Database module for gas stations and Electric Vehicle (EV) charging points along the route.
- [ ] User accounts and favorite saved routes tracking.

## 🏙️ City Data

The map, the sidebar autocomplete and the backend share one city list (every place with 15k+ inhabitants in Poland, Germany, Czechia, Slovakia, Lithuania, Belarus and Ukraine): `frontend/src/data/cities.json` and `backend/app/data/cities.json`. It is generated from [GeoNames](https://www.geonames.org/) (CC-BY 4.0). Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

To regenerate it, download and unzip [`cities15000.zip`](https://download.geonames.org/export/dump/cities15000.zip), then run:

```bash
node scripts/build_cities.mjs path/to/cities15000.txt
```
