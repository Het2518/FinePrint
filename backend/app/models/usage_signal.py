"""
FinePrint — Usage Signal Model
Usage/activity data per vendor, cross-referenced by the Risk Agent.
Source can be Okta MCP or a manually uploaded CSV.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class UsageSignalSource(str, enum.Enum):
    okta_mcp = "okta_mcp"
    manual = "manual"


class UsageSignal(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "usage_signals"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vendor_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active_users_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seats_purchased: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[UsageSignalSource] = mapped_column(
        SAEnum(UsageSignalSource), nullable=False, default=UsageSignalSource.manual
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<UsageSignal vendor={self.vendor_name!r} active={self.active_users_count}/{self.seats_purchased}>"
