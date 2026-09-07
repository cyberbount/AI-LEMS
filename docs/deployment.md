# Deployment and Local Setup

## Scope

This document describes the deployment configurations that actually exist in this repository. The project supports:

- local development with SQLite, FastAPI, Vite and a locally running Ollama service;
- a Docker Compose configuration using MySQL, FastAPI, Nginx and Ollama.

This is not a production operations guide. No production performance, backup, monitoring, TLS or high-availability result is claimed here.

## Repository components

- Backend: FastAPI application under `backend/app`.
- Frontend: React/Vite application under `frontend`.
- Local database default: SQLite file `lab.db`.
- Docker database: MySQL service defined in `docker-compose.yml`.
- AI provider: Ollama through the backend Ollama provider.
- Default model: `qwen2.5:3b`.
- Docker frontend serving: Nginx through `Dockerfile.frontend`.

## Local development

### Prerequisites

The repository uses Python, a Python virtual environment, Node.js/npm, and Ollama for the local AI path. The exact installed versions are not prescribed by this document beyond the versions declared by the repository files and Dockerfiles.

### Install dependencies

From the project root:

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend
npm install
cd ..
```

### Local configuration

Backend settings are read by `backend/app/config.py` from environment variables and an optional root `.env` file. The relevant names are:

| Variable | Default in code | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./lab.db` | SQLAlchemy database URL |
| `JWT_SECRET_KEY` | Ephemeral value generated for a local process when unset | JWT signing key; provide this variable for Docker or any persistent deployment |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime |
| `AI_PROVIDER` | `ollama` | AI provider selection |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Ollama model name |
| `OLLAMA_NUM_PREDICT` | `512` | Provider generation limit |
| `MAX_HISTORY_MESSAGES` | `12` | Maximum conversation history messages |
| `REQUEST_TIMEOUT_SECONDS` | `360.0` | AI request timeout |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed frontend origins |

The local SQLite database is initialized by the FastAPI startup event using SQLAlchemy `create_all` and the default seed data in `backend/app/db.py`. No Alembic migration history is present.

### Start the local system

The repository provides:

```bash
bash scripts/start-dev.sh
```

The script checks or starts Ollama, ensures the configured model is available, starts FastAPI on port `8000`, and starts Vite on port `5173`.

The URLs printed by the script are:

- Frontend: `http://localhost:5173/login`
- Backend API: `http://localhost:8000`
- FastAPI documentation: `http://localhost:8000/docs`
- Ollama endpoint: the value of `OLLAMA_BASE_URL`, normally `http://localhost:11434`

The script expects the local `.venv` and frontend dependencies to exist. It also expects the `ollama` executable to be available when Ollama is not already running.

### Manual local start

If the helper script is not used, the repository's actual development commands are:

```bash
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

In another terminal:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

Ollama must be running separately at the configured `OLLAMA_BASE_URL` if AI responses are required. The repository's helper script uses `qwen2.5:3b` by default and may run `ollama pull qwen2.5:3b` when the model is absent.

## Docker Compose

The repository's `docker-compose.yml` defines these services:

- `mysql`: MySQL 8.4, exposed on host port `3306`, with volume `mysql_data` and `backend/init.sql` as the initialization script;
- `backend`: built from `Dockerfile.backend`, exposed on host port `8000`;
- `frontend`: built from `Dockerfile.frontend`, served by Nginx on host port `3000`;
- `ollama`: `ollama/ollama:latest`, exposed on host port `11434`, with volume `ollama_data`;
- `ollama-init`: pulls `qwen2.5:3b` after the Ollama service becomes healthy.

The Compose backend builds its connection from the environment variables:

```text
mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
```

Compose requires `JWT_SECRET_KEY`, `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` from the environment or an ignored root `.env` file. No real secret is committed in the Compose configuration.

Start the declared Compose configuration with:

```bash
docker compose up --build
```

The repository does not contain a separate production Compose file, migration command, backup command, monitoring stack, or TLS configuration that can be documented as an implemented deployment capability.

## Verification

The current repository records these verification commands:

```bash
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
python -m compileall -q backend/app
cd frontend && npm run build
```

These verify the automated backend suite, backend compilation and frontend production build. They do not verify live Ollama behavior, Docker startup, browser/E2E behavior, production deployment, or backup recovery.

The application exposes:

- `GET /health` for backend and configured AI-provider health information;
- `GET /api/capabilities` for the configured provider/model capability response.

## Known limitations

- SQLite is the default local development database; Docker Compose uses MySQL. Both configurations exist, but parity has not been established by a full automated matrix in this repository.
- The current AI retrieval implementation is keyword-based. It is not semantic/vector RAG.
- Live Ollama execution has not been claimed as part of the automated test suite.
- Database initialization uses `create_all` and static SQL; no Alembic migration history exists.
- Document persistence/retrieval exists, but document CRUD/upload is not documented as an implemented API capability.
- Local mode may generate an ephemeral JWT secret when `JWT_SECRET_KEY` is unset; Docker requires `JWT_SECRET_KEY`.
- MySQL credentials come from environment variables. No live MySQL verification is claimed.
