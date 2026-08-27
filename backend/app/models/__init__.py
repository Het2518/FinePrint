"""
FinePrint — Models Package
Imports all models to ensure Alembic discovers them for migrations.
"""

from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.mcp_connection import McpConnection, McpServerType, McpConnectionStatus
from app.models.contract import Contract, ContractSource, ContractStatus
from app.models.contract_clause import ContractClause
from app.models.usage_signal import UsageSignal, UsageSignalSource
from app.models.agent_run import AgentRun, AgentRunStatus
from app.models.decision import Decision, RiskLevel, RecommendedAction, ApprovalStatus
from app.models.action import Action, ActionType, ActionStatus
from app.models.outcome import Outcome, OutcomeResult
from app.models.audit_log import AuditLog
from app.models.org_settings import OrgSettings

__all__ = [
    "Organization",
    "User", "UserRole",
    "McpConnection", "McpServerType", "McpConnectionStatus",
    "Contract", "ContractSource", "ContractStatus",
    "ContractClause",
    "UsageSignal", "UsageSignalSource",
    "AgentRun", "AgentRunStatus",
    "Decision", "RiskLevel", "RecommendedAction", "ApprovalStatus",
    "Action", "ActionType", "ActionStatus",
    "Outcome", "OutcomeResult",
    "AuditLog",
    "OrgSettings",
]
