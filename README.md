# lobster-claw

A full-stack scaffold with React + FastAPI for real-time workflow visualization.

## Tech stack

- Frontend: React 18, TypeScript, Tailwind CSS v3, shadcn/ui-compatible setup, React Flow v11, Zustand
- Backend: FastAPI, Python 3.11, SQLAlchemy, SQLite
- Communication: REST API + WebSocket (`/ws/status`)

## Project structure

```text
lobster-claw/
├── frontend/
├── backend/
├── installer/
├── docker-compose.yml
├── README.md
└── LICENSE
```

## Local development

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2) Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Docker

```bash
docker compose up --build
```

## Lint and format

Frontend:

```bash
cd frontend
npm run lint
npm run format:check
```

## API endpoints

- `GET /api/v1/health`
- `WS /ws/status`

## Suggested next steps

- Initialize shadcn/ui components (`npx shadcn@latest init` in `frontend/`)
- Add auth and domain models in `backend/app/models`
- Add CI workflow for lint/test/build
