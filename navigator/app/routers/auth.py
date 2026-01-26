"""
Authentication Router - User profile and auth-related endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from ..auth import (
    ClerkUser, 
    get_current_user, 
    get_optional_user, 
    is_auth_enabled
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ============ Response Models ============

class AuthStatusResponse(BaseModel):
    """Auth configuration status"""
    enabled: bool
    provider: str = "clerk"


class UserProfileResponse(BaseModel):
    """Current user profile"""
    user_id: str
    email: Optional[str] = None
    org_id: Optional[str] = None
    org_role: Optional[str] = None


# ============ Endpoints ============

@router.get("/status", response_model=AuthStatusResponse)
async def auth_status():
    """
    Check if authentication is enabled and configured.
    Useful for frontend to know whether to show auth UI.
    """
    return AuthStatusResponse(
        enabled=is_auth_enabled(),
        provider="clerk"
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(user: ClerkUser = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    Requires authentication.
    """
    return UserProfileResponse(
        user_id=user.user_id,
        email=user.email,
        org_id=user.org_id,
        org_role=user.org_role,
    )


@router.get("/check")
async def check_auth(user: Optional[ClerkUser] = Depends(get_optional_user)):
    """
    Check if the current request is authenticated.
    Returns user info if authenticated, null otherwise.
    Does not require authentication.
    """
    if user:
        return {
            "authenticated": True,
            "user_id": user.user_id,
            "email": user.email,
        }
    return {
        "authenticated": False,
        "user_id": None,
        "email": None,
    }

