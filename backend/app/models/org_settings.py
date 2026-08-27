"""
FinePrint — OrgSettings Model
Stores org-level configuration for business rules and thresholds.
"""

import uuid
from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class OrgSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "org_settings"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    
    # Dollar threshold for requiring human approval (FR-DEC-2)
    approval_threshold_usd: Mapped[float] = mapped_column(Float, nullable=False, default=5000.0)
    
    # Optional second approver threshold (FR-APP-4)
    second_approver_threshold_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="settings")

    def __repr__(self) -> str:
        return f"<OrgSettings org={self.org_id} threshold={self.approval_threshold_usd}>"
