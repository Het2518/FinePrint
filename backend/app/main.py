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
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.redis import RedisJobStore

import urllib.parse

def get_scheduler() -> BackgroundScheduler:
    url = urllib.parse.urlparse(settings.redis_url)
    jobstores = {
        "default": RedisJobStore(
            jobs_key="fineprint_jobs",
            run_times_key="fineprint_running",
            host=url.hostname or "localhost",
            port=url.port or 6379,
            db=int(url.path[1:]) if url.path and len(url.path) > 1 else 0,
            password=url.password
        )
    }
    scheduler = BackgroundScheduler(jobstores=jobstores)
    return scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler = get_scheduler()
    
    # Add jobs if they don't already exist in Redis
    from app.ingestion.scheduler import run_ingestion_job
    scheduler.add_job(run_ingestion_job, "interval", minutes=1, id="ingestion_job", replace_existing=True)
    
    from app.jobs.retention import run_retention_cleanup
    scheduler.add_job(run_retention_cleanup, "interval", hours=24, id="retention_job", replace_existing=True)
    
    scheduler.add_job(run_daily_verification, "interval", hours=24, id="verification_job", replace_existing=True)
    
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()

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


from app.api import auth, contracts, decisions, actions, dashboard, mcp, settings as org_settings, audit, chat, analytics, notifications, renewals, export, vendors, team, webhooks

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
app.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
app.include_router(actions.router, prefix="/actions", tags=["Actions"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(mcp.router, prefix="/mcp", tags=["MCP"])
app.include_router(org_settings.router, prefix="/settings", tags=["Settings"])
app.include_router(audit.router, prefix="/audit", tags=["Audit"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(renewals.router, prefix="/renewals", tags=["Renewals"])
app.include_router(export.router, prefix="/export", tags=["Export"])
app.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
app.include_router(team.router, prefix="/team", tags=["Team"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

