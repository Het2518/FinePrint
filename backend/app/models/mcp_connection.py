"""
FinePrint — MCP Connection Model
Stores per-org, per-server MCP server credentials and connection state.
Replaces the raw OAuth token table from v1 (per ADR-001).
"""

import uuid
import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class McpServerType(str, enum.Enum):
    google_drive = "google_drive"
    gmail = "gmail"
    slack = "slack"
    okta = "okta"


class McpConnectionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    disconnected = "disconnected"


class McpConnection(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "mcp_connections"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    mcp_server_type: Mapped[McpServerType] = mapped_column(SAEnum(McpServerType), nullable=False)
    mcp_server_url: Mapped[str] = mapped_column(String(512), nullable=True)
    # Auth credentials stored AES-256 encrypted (never in plaintext — NFR-4)
    auth_credentials_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    scopes_granted: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array of granted tool names
    connected_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status: Mapped[McpConnectionStatus] = mapped_column(
        SAEnum(McpConnectionStatus), nullable=False, default=McpConnectionStatus.active
    )
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="mcp_connections")

    def __repr__(self) -> str:
        return f"<McpConnection org={self.org_id} type={self.mcp_server_type} status={self.status}>"
