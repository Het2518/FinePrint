"""
FinePrint — Decisions API Router
Approval queue and approve/reject endpoints.
Human approval resumes the LangGraph pipeline (FR-APP-2, FR-APP-3).
"""

import uuid
import threading
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth.jwt import get_current_user
from app.auth.rbac import require_user_or_admin
from app.models.user import User
from app.models.decision import Decision, ApprovalStatus
from app.models.contract import Contract
from app.models.audit_log import AuditLog
from app.services.email_service import send_action_confirmation

router = APIRouter()


@router.get("")
def list_decisions(
    status: Optional[str] = Query(None, description="Filter by approval_status (e.g., pending)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the approval queue for the org. Default: pending decisions."""
    query = (
        db.query(Decision)
        .join(Contract, Decision.contract_id == Contract.id)
        .filter(Contract.org_id == current_user.org_id)
    )

    if status:
        query = query.filter(Decision.approval_status == status)
    else:
        query = query.filter(Decision.approval_status == ApprovalStatus.pending)

    decisions = query.order_by(Decision.decided_at.asc()).all()

    return {
        "decisions": [
            {
                "id": str(d.id),
                "contract_id": str(d.contract_id),
                "situation": d.situation,
                "root_cause": d.root_cause,
                "recommended_action": d.recommended_action.value if d.recommended_action else None,
                "expected_impact": d.expected_impact_json,
                "risk_level": d.risk_level.value if d.risk_level else None,
                "confidence": d.confidence,
                "requires_approval": d.requires_approval,
                "approval_status": d.approval_status.value,
                "decided_at": d.decided_at.isoformat() if d.decided_at else None,
            }
            for d in decisions
        ],
        "total": len(decisions),
    }


@router.post("/{decision_id}/approve")
def approve_decision(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin),
):
    """
    Approves a pending decision (FR-APP-2, FR-APP-3).
    Records approving user identity + timestamp on the decision record.
    Triggers Action Agent to generate a draft artifact.
    """
    decision = _get_decision_or_404(decision_id, current_user, db)

    if decision.approval_status != ApprovalStatus.pending:
        raise HTTPException(status_code=400, detail=f"Decision is already {decision.approval_status.value}")

    decision.approval_status = ApprovalStatus.approved
    decision.approved_by_user_id = current_user.id
    decision.decided_at = datetime.now(timezone.utc)

    # Log to audit trail (REQ-COMP-1)
    _log_audit(db, current_user, "decision.approved", "decision", decision.id)

    db.commit()

    # Generate action draft in background
    _generate_action_draft(decision, db)

    # Fire confirmation email (background thread — non-blocking)
    vendor = decision.situation.split()[0] if decision.situation else "vendor"
    action_label = decision.recommended_action.value if decision.recommended_action else "action"
    threading.Thread(
        target=send_action_confirmation,
        args=(current_user.email, vendor, action_label, current_user.full_name or current_user.email, decision.situation or ""),
        daemon=True,
    ).start()

    from app.services.slack_service import send_slack_action_draft
    slack_action_details = {
        "contract_id": str(decision.contract_id),
        "type": action_label
    }
    threading.Thread(
        target=send_slack_action_draft,
        args=(str(current_user.org_id), slack_action_details),
        daemon=True
    ).start()

    return {
        "message": "Decision approved",
        "decision_id": decision_id,
        "approved_by": current_user.email,
    }


@router.post("/{decision_id}/reject")
def reject_decision(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin),
):
    """Rejects a pending decision."""
    decision = _get_decision_or_404(decision_id, current_user, db)

    if decision.approval_status != ApprovalStatus.pending:
        raise HTTPException(status_code=400, detail=f"Decision is already {decision.approval_status.value}")

    decision.approval_status = ApprovalStatus.rejected
    decision.approved_by_user_id = current_user.id
    decision.decided_at = datetime.now(timezone.utc)

    _log_audit(db, current_user, "decision.rejected", "decision", decision.id)
    db.commit()

    return {"message": "Decision rejected", "decision_id": decision_id}


def _get_decision_or_404(decision_id: str, current_user: User, db: Session) -> Decision:
    """Helper: fetches a decision ensuring it belongs to the user's org."""
    decision = (
        db.query(Decision)
        .join(Contract, Decision.contract_id == Contract.id)
        .filter(
            Decision.id == uuid.UUID(decision_id),
            Contract.org_id == current_user.org_id,
        )
        .first()
    )
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


def _log_audit(db: Session, user: User, action: str, entity_type: str, entity_id):
    """Appends an entry to the audit log."""
    log = AuditLog(
        org_id=user.org_id,
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)


def _generate_action_draft(decision: Decision, db: Session):
    """Generates a draft action artifact after approval."""
    from app.models.action import Action, ActionType, ActionStatus
    from app.models.contract_clause import ContractClause
    from app.agents.action import run_action_agent

    clause = (
        db.query(ContractClause)
        .filter(ContractClause.contract_id == decision.contract_id)
        .order_by(ContractClause.created_at.desc())
        .first()
    )

    clauses_dict = {}
    if clause:
        clauses_dict = {
            "vendor_name": clause.vendor_name,
            "renewal_date": str(clause.renewal_date) if clause.renewal_date else None,
            "contract_value_annual": clause.contract_value_annual,
            "currency": clause.currency,
        }

    action_type = "email_draft"
    decision_dict = {
        "situation": decision.situation,
        "recommended_action": decision.recommended_action.value if decision.recommended_action else "manual_review",
        "expected_impact": decision.expected_impact_json,
    }

    draft_payload = run_action_agent(decision_dict, clauses_dict, action_type)

    action = Action(
        decision_id=decision.id,
        action_type=ActionType.email_draft,
        payload_json=draft_payload,
        status=ActionStatus.draft,
    )
    db.add(action)
    db.commit()
