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

def run_ingestion_loop():
    """Background loop that polls for new contracts periodically."""
    logger.info("[Ingestion Scheduler] Started.")
    while True:
        db = SessionLocal()
        try:
            # For MVP, just get all distinct org_ids
            # In a real app, this would iterate over active McpConnections
            orgs = db.query(User.org_id).distinct().all()
            
            for org in orgs:
                org_id = org[0]
                budget = settings.max_contracts_per_scan
                
                # Poll Drive
                ingested_drive = poll_drive_mcp(org_id, db, budget=budget)
                budget -= ingested_drive
                
                # Poll Gmail if budget allows
                if budget > 0:
                    ingested_gmail = poll_gmail_mcp(org_id, db, budget=budget)
                    budget -= ingested_gmail
        except Exception as e:
            logger.error(f"[Ingestion Scheduler] Error in loop: {e}")
        finally:
            db.close()
            
        # Sleep for 60 seconds for demo purposes (normally 12-24 hours)
        time.sleep(60)

def start_ingestion_scheduler():
    t = threading.Thread(target=run_ingestion_loop, daemon=True)
    t.start()
