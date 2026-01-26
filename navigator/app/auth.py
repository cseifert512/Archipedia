"""
Clerk JWT Authentication for FastAPI

This module provides JWT verification for Clerk-issued tokens.
Clerk uses RS256 (RSA) for signing JWTs, and we verify them using
the JWKS (JSON Web Key Set) endpoint.
"""

import os
import time
import logging
from typing import Optional, Dict, Any
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Header, Depends
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ============ Configuration ============

# Clerk Frontend API URL - used to fetch JWKS
# Format: https://<your-clerk-frontend-api>.clerk.accounts.dev
CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API", "")
CLERK_JWKS_URL = f"{CLERK_FRONTEND_API}/.well-known/jwks.json" if CLERK_FRONTEND_API else ""

# Cache for JWKS client (reuse connection)
_jwks_client: Optional[PyJWKClient] = None


# ============ Models ============

class ClerkUser(BaseModel):
    """Authenticated user from Clerk JWT"""
    user_id: str
    email: Optional[str] = None
    session_id: Optional[str] = None
    org_id: Optional[str] = None
    org_role: Optional[str] = None


# ============ JWKS Client ============

def get_jwks_client() -> Optional[PyJWKClient]:
    """Get or create the JWKS client for Clerk."""
    global _jwks_client
    
    if not CLERK_FRONTEND_API:
        return None
    
    if _jwks_client is None:
        try:
            _jwks_client = PyJWKClient(CLERK_JWKS_URL, cache_keys=True)
            logger.info(f"Initialized JWKS client for {CLERK_JWKS_URL}")
        except Exception as e:
            logger.error(f"Failed to initialize JWKS client: {e}")
            return None
    
    return _jwks_client


# ============ Token Verification ============

def verify_clerk_token(token: str) -> Optional[ClerkUser]:
    """
    Verify a Clerk JWT and extract user information.
    
    Args:
        token: The JWT from the Authorization header (without 'Bearer ' prefix)
    
    Returns:
        ClerkUser if valid, None if verification fails
    """
    client = get_jwks_client()
    if not client:
        logger.warning("JWKS client not available - auth disabled")
        return None
    
    try:
        # Get the signing key from JWKS
        signing_key = client.get_signing_key_from_jwt(token)
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
            }
        )
        
        # Extract user info from Clerk's JWT claims
        # Clerk uses 'sub' for user_id
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("JWT missing 'sub' claim")
            return None
        
        # Extract optional claims
        email = None
        if "email" in payload:
            email = payload["email"]
        elif "email_addresses" in payload and payload["email_addresses"]:
            email = payload["email_addresses"][0]
        
        return ClerkUser(
            user_id=user_id,
            email=email,
            session_id=payload.get("sid"),
            org_id=payload.get("org_id"),
            org_role=payload.get("org_role"),
        )
        
    except jwt.ExpiredSignatureError:
        logger.debug("JWT has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.debug(f"Invalid JWT: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying JWT: {e}")
        return None


# ============ FastAPI Dependencies ============

def get_current_user(authorization: Optional[str] = Header(None)) -> ClerkUser:
    """
    FastAPI dependency that requires authentication.
    Raises 401 if not authenticated.
    
    Usage:
        @app.get("/protected")
        def protected_route(user: ClerkUser = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    # Check if auth is configured
    if not CLERK_FRONTEND_API:
        raise HTTPException(
            status_code=503,
            detail="Authentication not configured"
        )
    
    # Check for Authorization header
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )
    
    # Extract token from "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use 'Bearer <token>'"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Verify token
    user = verify_clerk_token(token)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    return user


def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[ClerkUser]:
    """
    FastAPI dependency that optionally extracts user if authenticated.
    Returns None if not authenticated (doesn't raise error).
    
    Usage:
        @app.get("/public")
        def public_route(user: Optional[ClerkUser] = Depends(get_optional_user)):
            if user:
                return {"message": f"Hello {user.user_id}"}
            return {"message": "Hello anonymous"}
    """
    # If auth not configured, return None
    if not CLERK_FRONTEND_API:
        return None
    
    # If no auth header, return None
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization[7:]
    return verify_clerk_token(token)


def is_auth_enabled() -> bool:
    """Check if authentication is configured."""
    return bool(CLERK_FRONTEND_API)

