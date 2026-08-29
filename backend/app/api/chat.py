"""
FinePrint — AI Chat API
Conversational Q&A against a contract or the full portfolio using Groq + ChromaDB RAG.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.database import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.contract import Contract
from app.models.contract_clause import ContractClause
from app.models.decision import Decision

router = APIRouter()
logger = logging.getLogger(__name__)

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model_name=settings.groq_model,
    temperature=0.3,
    max_tokens=1024,
)

CHAT_SYSTEM_PROMPT = """You are FinePrint, an expert AI procurement advisor embedded in a contract intelligence system.
You help procurement teams understand contract risks, savings opportunities, and recommended actions.
You have access to contract data and past decision outcomes. Be concise, specific, and actionable.
If you don't have enough data to answer, say so clearly — never fabricate numbers or dates.
Format your responses clearly with bullet points where appropriate."""


class ChatMessage(BaseModel):
    message: str
    contract_id: Optional[str] = None  # If provided, focus on this specific contract


class ChatResponse(BaseModel):
    reply: str
    context_used: list[str]  # What data sources were referenced


def _build_portfolio_context(org_id, db: Session) -> str:
    """Builds a brief portfolio summary for general Q&A."""
    contracts = db.query(Contract).filter(Contract.org_id == org_id).limit(20).all()
    decisions = (
        db.query(Decision)
        .join(Contract, Decision.contract_id == Contract.id)
        .filter(Contract.org_id == org_id)
        .limit(10)
        .all()
    )

    lines = [f"PORTFOLIO OVERVIEW: {len(contracts)} contracts on file."]
    for d in decisions[:5]:
        clause = db.query(ContractClause).filter(ContractClause.contract_id == d.contract_id).order_by(ContractClause.created_at.desc()).first()
        vendor = clause.vendor_name if clause else "Unknown"
        action = d.recommended_action.value if d.recommended_action else "n/a"
        savings = d.expected_impact_json.get("savings_annual", 0) if d.expected_impact_json else 0
        lines.append(f"- {vendor}: action={action}, potential_savings=${savings:,.0f}, status={d.approval_status.value}")

    return "\n".join(lines)


def _build_contract_context(contract_id: str, org_id, db: Session) -> tuple[str, list[str]]:
    """Builds full context for a specific contract."""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.org_id == org_id
    ).first()
    if not contract:
        return "", []

    clause = db.query(ContractClause).filter(
        ContractClause.contract_id == contract.id
    ).order_by(ContractClause.created_at.desc()).first()

    decision = db.query(Decision).filter(Decision.contract_id == contract.id).order_by(Decision.decided_at.desc()).first()

    sources = [f"contract:{contract.file_name}"]
    lines = [f"CONTRACT: {contract.file_name}"]

    if clause:
        sources.append("extracted_clauses")
        lines += [
            f"  Vendor: {clause.vendor_name}",
            f"  Annual Value: ${clause.contract_value_annual or 0:,.0f} {clause.currency or 'USD'}",
            f"  Auto-Renew: {clause.auto_renew}",
            f"  Notice Period: {clause.notice_period_days} days",
            f"  Price Escalation: {clause.price_escalation_pct}%",
            f"  Renewal Date: {clause.renewal_date}",
        ]

    if decision:
        sources.append("ai_decision")
        impact = decision.expected_impact_json or {}
        lines += [
            f"  AI Recommendation: {decision.recommended_action.value if decision.recommended_action else 'n/a'}",
            f"  Risk Level: {decision.risk_level.value if decision.risk_level else 'n/a'}",
            f"  Situation: {decision.situation}",
            f"  Root Cause: {decision.root_cause}",
            f"  Potential Savings: ${impact.get('savings_annual', 0):,.0f}",
            f"  Approval Status: {decision.approval_status.value}",
        ]

    return "\n".join(lines), sources


@router.post("", response_model=ChatResponse)
def chat(
    body: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI chat endpoint — answers procurement questions using contract context + ChromaDB RAG."""
    context_used = []

    # Build context
    if body.contract_id:
        context_str, context_used = _build_contract_context(body.contract_id, current_user.org_id, db)
        if not context_str:
            raise HTTPException(status_code=404, detail="Contract not found")
    else:
        context_str = _build_portfolio_context(current_user.org_id, db)
        context_used = ["portfolio_summary"]

    # Enrich with ChromaDB historical outcomes
    try:
        from app.agents.decision import _query_historical_outcomes
        rag_context = _query_historical_outcomes(body.message, "")
        if rag_context != "None":
            context_str += f"\n\nSIMILAR PAST DECISIONS:\n{rag_context}"
            context_used.append("chromadb_rag")
    except Exception as e:
        logger.warning(f"[Chat] ChromaDB RAG failed: {e}")

    user_prompt = f"""CONTEXT:
{context_str}

USER QUESTION:
{body.message}"""

    try:
        response = llm.invoke([
            SystemMessage(content=CHAT_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        return ChatResponse(reply=response.content or "I could not generate a response.", context_used=context_used)
    except Exception as e:
        logger.error(f"[Chat] LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")
