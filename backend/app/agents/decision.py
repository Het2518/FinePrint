"""
FinePrint — Decision Agent
Synthesizes Detection, Risk, and Finance agent outputs into a single recommendation.
LLM generates the NARRATIVE. Deterministic Finance numbers override LLM savings estimates.
"""

import json
import re
import logging

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.orchestrator.state import ContractScanState

logger = logging.getLogger(__name__)

llm = ChatGroq(api_key=settings.groq_api_key, model_name=settings.groq_model, temperature=0.1, max_tokens=768)

def _extract_json(raw: str) -> str:
    """Strip Qwen think-blocks, markdown fences, extract first JSON object."""
    raw = re.sub(r"<think>.*?</think>", "", raw or "", flags=re.DOTALL)
    raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    return match.group(0) if match else raw


from sentence_transformers import SentenceTransformer

# Load embedding model globally so it's cached in memory
_embedder = SentenceTransformer("all-MiniLM-L6-v2")

def _generate_embedding(text: str) -> list[float]:
    """Real semantic embedding using SentenceTransformer (padded to 1536-dim)."""
    # Generate 384-dim vector
    vec = _embedder.encode(text).tolist()
    # Repeat 4 times to fill the 1536-dim Vector column without breaking schema
    # (Mathematically preserves relative euclidean distances)
    return vec * 4


DECISION_SYSTEM_PROMPT = """You are a SaaS procurement advisor.
Given contract data and risk/finance analysis, write a concise business recommendation.
Return ONLY a raw JSON object — no markdown, no code fences, no explanations."""

DECISION_USER_PROMPT_TEMPLATE = """Provide a procurement recommendation based on this analysis. Return ONLY JSON:

CLAUSES: {clauses_json}

RISK: {risk_json}

FINANCE: {finance_json}

PAST SIMILAR OUTCOMES:
{historical_outcomes}


Return ONLY this JSON (fill in actual values):
{{"situation": "one sentence describing urgency", "root_cause": "one sentence on why this is a problem", "recommended_action": "renegotiate_seats", "expected_impact": {{"savings_annual": 0, "description": "one sentence outcome"}}, "risk": "high", "confidence": 0.85}}

recommended_action must be one of: cancel, renegotiate_seats, renew, manual_review
risk must be one of: low, medium, high"""


def run_decision_agent(state: ContractScanState) -> ContractScanState:
    """LangGraph node: Decision Agent. Runs after Risk and Finance agents join."""
    logger.info(f"[Decision Agent] Starting for contract={state['contract_id']}")

    clauses = state.get("clauses", {})
    risk_output = state.get("risk_output", {})
    finance_output = state.get("finance_output", {})

    db = None
    historical_outcomes_str = "None"
    embedding = None
    try:
        from app.database import SessionLocal
        from app.models.decision import Decision
        from app.models.outcome import Outcome, OutcomeResult
        
        db = SessionLocal()
        context_text = f"Vendor: {clauses.get('vendor_name', '')} - Risk: {risk_output.get('risk_type', '')}"
        embedding = _generate_embedding(context_text)
        
        # Search for similar decisions with verified outcomes
        past_decisions = (
            db.query(Decision, Outcome)
            .join(Outcome, Decision.id == Outcome.decision_id)
            .filter(Outcome.result == OutcomeResult.success)
            .order_by(Decision.embedding.l2_distance(embedding))
            .limit(3)
            .all()
        )
        
        if past_decisions:
            hist_list = []
            for d, o in past_decisions:
                hist_list.append(f"- Past action: {d.recommended_action.value if d.recommended_action else 'unknown'}, Result: {o.actual_outcome}")
            historical_outcomes_str = "\n".join(hist_list)
    except Exception as e:
        logger.error(f"[Decision Agent] Error fetching historical context: {e}")
    finally:
        if db:
            db.close()

    try:
        response = llm.invoke([
            SystemMessage(content=DECISION_SYSTEM_PROMPT),
            HumanMessage(content=DECISION_USER_PROMPT_TEMPLATE.format(
                clauses_json=json.dumps(clauses, indent=2),
                risk_json=json.dumps(risk_output, indent=2),
                finance_json=json.dumps(finance_output, indent=2),
                historical_outcomes=historical_outcomes_str,
            ))
        ])

        raw = response.content or ""
        logger.debug(f"[Decision Agent] Raw output: {raw[:400]}")
        decision_output = json.loads(_extract_json(raw))

        # Override LLM savings with deterministic Finance Agent numbers
        finance_savings = finance_output.get("estimated_savings_if_cancelled", 0)
        renegotiate_savings = finance_output.get("estimated_savings_if_renegotiated", 0)
        rec = decision_output.get("recommended_action", "manual_review")
        if "expected_impact" not in decision_output:
            decision_output["expected_impact"] = {}
        if rec == "cancel":
            decision_output["expected_impact"]["savings_annual"] = finance_savings
        elif rec == "renegotiate_seats":
            decision_output["expected_impact"]["savings_annual"] = renegotiate_savings

        logger.info(f"[Decision Agent] action={rec} confidence={decision_output.get('confidence')}")
        decision_output["embedding"] = embedding
        return {**state, "decision_output": decision_output}

    except Exception as e:
        logger.error(f"[Decision Agent] Error: {e}")
        return {
            **state,
            "decision_output": {
                "situation": "Decision synthesis failed",
                "root_cause": str(e),
                "recommended_action": "manual_review",
                "expected_impact": {"savings_annual": 0, "description": "Manual review required"},
                "risk": risk_output.get("risk_severity", "medium"),
                "confidence": 0.0,
            },
        }
