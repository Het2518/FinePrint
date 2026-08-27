"""
FinePrint — OrgSettings API Router
Allows Org Admins to configure business rules and thresholds for their organization.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.auth.rbac import require_admin
from app.models.user import User
from app.models.org_settings import OrgSettings

router = APIRouter()


class OrgSettingsUpdate(BaseModel):
    approval_threshold_usd: float


class OrgSettingsResponse(BaseModel):
    approval_threshold_usd: float


@router.get("", response_model=OrgSettingsResponse)
def get_org_settings(
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_admin)
):
    """Gets the current settings for the organization."""
    settings = db.query(OrgSettings).filter(OrgSettings.org_id == current_admin.org_id).first()
    
    # If no settings exist yet, return defaults
    if not settings:
        return OrgSettingsResponse(approval_threshold_usd=5000.0)
        
    return OrgSettingsResponse(
        approval_threshold_usd=settings.approval_threshold_usd
    )


@router.put("", response_model=OrgSettingsResponse)
def update_org_settings(
    request: OrgSettingsUpdate,
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_admin)
):
    """Updates the org settings."""
    settings = db.query(OrgSettings).filter(OrgSettings.org_id == current_admin.org_id).first()
    
    if not settings:
        settings = OrgSettings(
            org_id=current_admin.org_id,
            approval_threshold_usd=request.approval_threshold_usd
        )
        db.add(settings)
    else:
        settings.approval_threshold_usd = request.approval_threshold_usd
        
    db.commit()
    db.refresh(settings)
    
    return OrgSettingsResponse(
        approval_threshold_usd=settings.approval_threshold_usd
    )
