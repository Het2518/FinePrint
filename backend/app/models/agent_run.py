"""
FinePrint — Agent Run Model
Full audit trail for every agent execution, including MCP tool calls made.
Every Decision, Risk, Finance, Detection, and Action agent call is logged here.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Float, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class AgentRunStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"
    low_confidence = "low_confidence"  # Detection Agent below threshold → manual review


class AgentRun(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "agent_runs"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_name: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g., "detection", "risk", "finance"
    input_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)   # Full input sent to the agent
    output_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # Full output from the agent
    reasoning_summary: Mapped[str | None] = mapped_column(Text, nullable=True)  # Human-readable summary
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Satisfies NFR-5 + FR-DASH-4: every MCP tool call logged in the audit trail
    mcp_tool_calls_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[AgentRunStatus] = mapped_column(
        SAEnum(AgentRunStatus), nullable=False, default=AgentRunStatus.running
    )

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="agent_runs")

    def __repr__(self) -> str:
        return f"<AgentRun agent={self.agent_name!r} status={self.status} contract={self.contract_id}>"
