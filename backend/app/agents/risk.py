"""
FinePrint — Risk Agent
Classifies contract risk using extracted clauses + optional Okta usage signals.
Never fabricates usage data when Okta MCP is unavailable (FR-RISK-3).
"""

import json
import re
import logging
from groq import Groq
from app.config import settings
from app.orchestrator.state import ContractScanState

logger = logging.getLogger(__name__)
groq_client = Groq(api_key=settings.groq_api_key)


def _extract_json(raw: str) -> str:
    """Strip Qwen think-blocks, markdown fences, extract first JSON object."""
    raw = re.sub(r"<think>.*?</think>", "", raw or "", flags=re.DOTALL)
    raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    return match.group(0) if match else raw


RISK_SYSTEM_PROMPT = """You are a SaaS contract risk analyst.
Evaluate contract clause data to classify risk.
Base your assessment ONLY on provided data. Do NOT infer or fabricate usage numbers.
Return ONLY a raw JSON object — no markdown, no code fences."""

RISK_USER_PROMPT_TEMPLATE = """Analyze this contract for risk and return ONLY a JSON object:

CONTRACT CLAUSES:
{clauses_json}

USAGE DATA:
{usage_json}

Return ONLY this JSON (fill in real values):
{{"risk_type": "price_escalation", "risk_severity": "high", "evidence": "explanation here"}}

risk_type must be one of: underused, price_escalation, short_notice_window, none
risk_severity must be one of: low, medium, high
Rules:
- underused: active_users < 40% of total_seats
- price_escalation: price_escalation_pct > 5%
- short_notice_window: notice_period_days < 30 AND auto_renew is true
- none: nothing concerning"""


def run_risk_agent(state: ContractScanState) -> ContractScanState:
    """LangGraph node: Risk Agent."""
    logger.info(f"[Risk Agent] Starting for contract={state['contract_id']}")

    clauses = state.get("clauses", {})
    usage_signals = state.get("usage_signals")
    usage_json = json.dumps(usage_signals, indent=2) if usage_signals else \
        "No usage data — assess risk from contract clauses only."

    try:
        response = groq_client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": RISK_SYSTEM_PROMPT},
                {"role": "user", "content": RISK_USER_PROMPT_TEMPLATE.format(
                    clauses_json=json.dumps(clauses, indent=2),
                    usage_json=usage_json,
                )},
            ],
            temperature=0.0,
            max_tokens=512,
        )

        raw = response.choices[0].message.content or ""
        logger.debug(f"[Risk Agent] Raw output: {raw[:300]}")
        risk_output = json.loads(_extract_json(raw))
        logger.info(f"[Risk Agent] type={risk_output.get('risk_type')} severity={risk_output.get('risk_severity')}")
        return {**state, "risk_output": risk_output}

    except Exception as e:
        logger.error(f"[Risk Agent] Error: {e}")
        return {**state, "risk_output": {
            "risk_type": "none", "risk_severity": "low", "evidence": f"Risk assessment failed: {e}"
        }}
