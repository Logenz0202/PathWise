# PathWise

[![CI](https://github.com/Logenz0202/PathWise/actions/workflows/ci.yml/badge.svg)](https://github.com/Logenz0202/PathWise/actions/workflows/ci.yml)

PathWise compares getting between two cities in Central and Eastern Europe by car, train or bus. For each option it shows the door-to-door travel time, the cost and the CO₂ emissions, and an AI "Eco-Coach" recommends one based on what you care about most.

## Functionality

- Interactive map with ~5,700 cities and towns in Poland and neighbouring countries (OpenStreetMap). Places can also be searched by name, including Polish names like *Lwów* or *Drezno*.
- Real road routes drawn on the map, with the road distance and a time preview for each mode.
- Comparison of car, train and bus on time, cost and CO₂, with the fastest, cheapest and greenest option marked.
- My Cars: save your own cars (fuel type, consumption, fuel or electricity price) and use them in comparisons. Petrol, diesel, LPG and electric are supported.
- Eco-Coach: pick a priority (balanced, fastest, cheapest, greenest) and optionally add a note such as "lots of luggage". It returns a recommended mode, a short reason and a couple of tips.
- History of saved comparisons; each one has its own URL (`/comparisons/:id`).
- English / Polish interface, prices in EUR or PLN.

## Technical description

### Stack

- **Backend:** Python, FastAPI, SQLAlchemy 2, Pydantic 2, httpx
- **Database:** SQLite (single file, created on first start)
- **Frontend:** React 19, TypeScript, React Router, Vite, Tailwind CSS, shadcn/ui, Leaflet
- **AI:** OpenRouter API, free models only (default `google/gemma-4-26b-a4b-it:free`)
- **External data:** OpenStreetMap (places, map tiles), OSRM (road routing)
- **Tooling:** Docker Compose, pytest, ruff, GitHub Actions

Swagger docs for the API are available at http://localhost:8001/docs once the backend is running.

### How things are calculated

All the rules live in [`backend/app/services/calculator.py`](backend/app/services/calculator.py) as named constants.

**Distance and route.** The road route comes from the public OSRM server and is cached in the database per city pair (the reverse trip reuses it). If OSRM is unavailable, a straight-line estimate is used and the UI says so.

**Time (door to door):**
- *Car* - OSRM driving time + 5% for traffic, a 15 min break every 4 h, and 90 min at a non-Schengen border.
- *Bus* - each road segment capped at 100 km/h, 5 min of stops per 100 km, the 45 min break EU rules require after 4.5 h of driving, plus 30 min to get to the stop.
- *Train* - there is no free rail router for the region, so the rail distance is the straight line × 1.2, travelled at a typical speed for each country (e.g. 115 km/h in Germany, 105 in Poland), slower on trips under 150 km. Borders add time (passport control outside Schengen, a gauge change at the Lithuanian, Belarusian and Ukrainian borders), plus 40 min to get to the station. Train times are labelled as estimates.

**Cost.** Train and bus use a fare per km (€0.15 and €0.08). The car uses the selected car's consumption × fuel price, or €0.12/km if no car is selected. Everything is stored in EUR and converted to PLN in the frontend.

**CO₂.** Per passenger-km for train (0.041 kg) and bus (0.089 kg). For the car it is fuel used × CO₂ per litre (petrol 2.31, diesel 2.68, LPG 1.51 kg). Electric cars use 0.25 kg per kWh (roughly the EU grid mix), so they are not shown as zero-emission.

**Recommendation.** The backend picks the best option itself and the LLM only explains it. For a specific priority it is that category's winner. For "balanced", each option is scored by how many times worse it is than the best one on time, cost and CO₂ (log ratios, so being 3× more expensive weighs more than 3% more CO₂). The model gets the numbers and the suggested pick, may change it only if the user's note gives a concrete reason, and must reply with JSON that is validated before saving. If there is no API key or the reply is unusable, a rule-based coach returns advice in the same format.

## Running

Optional: to enable the AI coach, copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` (a free OpenRouter account is enough). Without it the app uses the rule-based coach.

### Docker

```bash
docker compose up --build
```

Frontend: http://localhost:5173, API: http://localhost:8001

### Without Docker

Requires Python 3.11+ and Node.js 22.12+.

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

Tests:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Use of AI

- **Google Antigravity** generated the first version of the app: the FastAPI backend, the basic calculator, the Eco-Coach with its offline fallback, the React frontend and the Docker setup.
- **Claude Code** was used as a pair programmer for the rest: the Leaflet map and city data, car presets, OSRM routing and the travel-time model, reworking the Eco-Coach so its answers follow the numbers, the TypeScript and React Router migration, the switch to SQLite, the UI redesign, tests and cleanup.
- I decided on the features and the UX, checked the calculated times against real trips, and reviewed and tested every change in the browser.
- The app itself uses an LLM (via OpenRouter) to turn the computed comparison into a short recommendation.

Map, place and road data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; routes by [OSRM](https://project-osrm.org/).
