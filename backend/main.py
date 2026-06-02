"""
M3 Portfolio Tracker — FastAPI backend entry point.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth, portfolio

logger = logging.getLogger(__name__)

# Import models so metadata is populated before create_all
import models  # noqa: F401
from database import engine, Base

app = FastAPI(
    title="M3 Portfolio Tracker",
    version="0.1.0",
    description="Family office portfolio tracker for listed Indian companies.",
)

# CORS — allow frontend dev server + office LAN
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(portfolio.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")


@app.get("/health")
def health():
    return {"status": "ok"}


# ─── Serve React frontend (production build) ──────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

_dist = (Path(__file__).resolve().parent.parent / "frontend" / "dist")
if _dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        candidate = _dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_dist / "index.html"))
