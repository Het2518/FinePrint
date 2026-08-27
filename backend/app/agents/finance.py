"""
FinePrint — Finance Agent
Performs ALL financial calculations in pure deterministic Python.
Zero LLM calls. Zero MCP calls. (FR-FIN-2)
This is intentional by design — financial arithmetic must never be delegated to an LLM.
"""

import logging
from app.orchestrator.state import ContractScanState

logger = logging.getLogger(__name__)

# Heuristic: renegotiation typically achieves 10-25% savings, scaled by risk severity
RENEGOTIATION_SAVINGS_FACTOR = {
    "low": 0.10,
    "medium": 0.15,
    "high": 0.25,
}


def run_finance_agent(state: ContractScanState) -> ContractScanState:
    """
    LangGraph node: Finance Agent.
    All math is deterministic Python — no LLM, no MCP calls.
    Runs in parallel with the Risk Agent.
    """
    logger.info(f"[Finance Agent] Starting for contract={state['contract_id']}")

    clauses = state.get("clauses") or {}
    risk_output = state.get("risk_output") or {}
    risk_severity = risk_output.get("risk_severity", "low")

    annual_cost = _safe_float(clauses.get("contract_value_annual"), default=0.0)
    escalation_pct = _safe_float(clauses.get("price_escalation_pct"), default=0.0)

    # Cost if the contract auto-renews with price escalation applied
    annual_cost_if_renewed = annual_cost * (1 + escalation_pct / 100)

    # Cancellation saves the full renewal cost
    savings_if_cancelled = annual_cost_if_renewed

    # Renegotiation heuristic — scaled by risk severity
    savings_factor = RENEGOTIATION_SAVINGS_FACTOR.get(risk_severity, 0.10)
    savings_if_renegotiated = annual_cost * savings_factor

    finance_output = {
        "annual_cost_current": round(annual_cost, 2),
        "annual_cost_if_renewed": round(annual_cost_if_renewed, 2),
        "price_escalation_pct": round(escalation_pct, 2),
        "estimated_savings_if_cancelled": round(savings_if_cancelled, 2),
        "estimated_savings_if_renegotiated": round(savings_if_renegotiated, 2),
        "currency": clauses.get("currency", "USD"),
    }

    logger.info(
        f"[Finance Agent] Current=${annual_cost:.2f} → Renewed=${annual_cost_if_renewed:.2f} "
        f"| Cancel saves=${savings_if_cancelled:.2f} | Renegotiate saves=${savings_if_renegotiated:.2f}"
    )

    return {**state, "finance_output": finance_output}


def _safe_float(value, default: float = 0.0) -> float:
    """Safely converts a value to float, returning default on failure."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
