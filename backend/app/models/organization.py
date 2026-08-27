"""
FinePrint — Organization Model
Top-level tenant entity. All other data is scoped to an org.
"""

import uuid
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    mcp_connections: Mapped[list["McpConnection"]] = relationship("McpConnection", back_populates="organization", cascade="all, delete-orphan")
    contracts: Mapped[list["Contract"]] = relationship("Contract", back_populates="organization", cascade="all, delete-orphan")
    settings: Mapped["OrgSettings"] = relationship("OrgSettings", back_populates="organization", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r}>"
