# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend ───────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# main.py resolves: Path(__file__).parent.parent / "frontend" / "dist"
# = /app/main.py → parent.parent = / → /frontend/dist
COPY --from=frontend-builder /frontend/dist /frontend/dist

# seed.py is idempotent: creates tables, adds columns, seeds default users
CMD python seed.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
