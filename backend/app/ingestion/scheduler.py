"""
FinePrint — Ingestion Scheduler
Runs periodically to trigger MCP polling for each organization.
"""
import logging
import threading
import time

from app.database import SessionLocal
from app.models.user import User
from app.ingestion.ingestion_service import poll_drive_mcp, poll_gmail_mcp
from app.config import settings

logger = logging.getLogger(__name__)

def run_ingestion_job():
    """Single pass ingestion job executed by APScheduler."""
    logger.info("[Ingestion Scheduler] Running scheduled ingestion job.")
    db = SessionLocal()
    try:
        orgs = db.query(User.org_id).distinct().all()
        for org in orgs:
            org_id = org[0]
            budget = settings.max_contracts_per_scan
            
            ingested_drive = poll_drive_mcp(org_id, db, budget=budget)
            budget -= ingested_drive
            
            if budget > 0:
                ingested_gmail = poll_gmail_mcp(org_id, db, budget=budget)
                budget -= ingested_gmail
    except Exception as e:
        logger.error(f"[Ingestion Scheduler] Error in job: {e}")
    finally:
        db.close()
