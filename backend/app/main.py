"""
FinePrint — FastAPI Application Entrypoint
"""

import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.verification.verifier import run_daily_verification
from app.ingestion.scheduler import start_ingestion_scheduler

def start_verification_scheduler():
    """Simple background scheduler for the verifier job (MVP)."""
    from app.jobs.retention import run_retention_cleanup
    def _run():
        while True:
            run_daily_verification()
            run_retention_cleanup()
            time.sleep(86400) # Wait 24 hours
    
    t = threading.Thread(target=_run, daemon=True)
    t.start()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_verification_scheduler()
    start_ingestion_scheduler()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="FinePrint API",
    description="AI Agent Pipeline for SaaS & Vendor Contract Risk Monitoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "FinePrint API"}


from app.api import auth, contracts, decisions, actions, dashboard, mcp, settings as org_settings, audit

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
app.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
app.include_router(actions.router, prefix="/actions", tags=["Actions"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(mcp.router, prefix="/mcp", tags=["MCP"])
app.include_router(org_settings.router, prefix="/settings", tags=["Settings"])
app.include_router(audit.router, prefix="/audit", tags=["Audit"])

