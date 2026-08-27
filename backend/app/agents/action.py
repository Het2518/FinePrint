"""
FinePrint — Action Agent
Drafts action artifacts (emails, Slack messages) after human approval.
NEVER sends autonomously — only creates draft stored in DB for human confirmation (FR-ACT-2).
"""

import json
import logging
from groq import Groq
from app.config import settings
from app.orchestrator.state import ContractScanState

logger = logging.getLogger(__name__)
groq_client = Groq(api_key=settings.groq_api_key)

ACTION_SYSTEM_PROMPT = """You are a professional business communication writer.
Generate a polished, professional draft message based on the provided contract details.
The message will be reviewed and sent by a human — write as if it's ready to send but will be human-edited.
Return ONLY valid JSON."""

ACTION_USER_PROMPT_TEMPLATE = """Generate a draft action for this approved decision:

DECISION:
{decision_json}

CONTRACT CLAUSES:
{clauses_json}

ACTION TYPE: {action_type}

Return a JSON object:
{{
  "subject": "Email subject line (if email) or null",
  "body": "Full message body — professional, specific, uses contract details",
  "recipient_hint": "Suggested recipient (e.g., vendor account manager) based on vendor name",
  "action_type": "{action_type}"
}}"""


def run_action_agent(decision_output: dict, clauses: dict, action_type: str = "email_draft") -> dict:
    """
    Generates a draft action artifact after human approval.
    Called by the Action Executor, NOT automatically by the graph.
    Returns the draft payload to be stored in the actions table.
    """
    logger.info(f"[Action Agent] Drafting {action_type} for vendor={clauses.get('vendor_name', 'unknown')}")

    try:
        response = groq_client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": ACTION_SYSTEM_PROMPT},
                {"role": "user", "content": ACTION_USER_PROMPT_TEMPLATE.format(
                    decision_json=json.dumps(decision_output, indent=2),
                    clauses_json=json.dumps(clauses, indent=2),
                    action_type=action_type,
                )},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Slight creativity for polished writing
            max_tokens=1024,
        )

        draft = json.loads(response.choices[0].message.content)
        logger.info(f"[Action Agent] Draft generated: {action_type}")
        return draft

    except Exception as e:
        logger.error(f"[Action Agent] Error generating draft: {e}")
        # Fallback draft so the UI still has something to show
        return {
            "subject": f"Re: Contract Review — {clauses.get('vendor_name', 'Vendor')}",
            "body": f"[Draft generation failed: {e}]\n\nPlease write your message manually based on the decision details.",
            "recipient_hint": f"{clauses.get('vendor_name', 'Vendor')} Account Manager",
            "action_type": action_type,
        }
