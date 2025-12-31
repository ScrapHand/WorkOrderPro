from fastapi import APIRouter, Depends, Request
from app import schemas, models
from app.api import deps
from typing import Any

router = APIRouter()

@router.get("/verify", response_model=schemas.TokenPayload)
async def verify_session_cookie(
    request: Request,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Diagnostic Endpoint: Verify that the session cookie is being received and is valid.
    If this returns 200 OK with user data, the partitioned cookie strategy is working.
    """
    # If we get here, deps.get_current_user succeeded, which means
    # either the Authorization header OR the Cookie was valid.
    
    # Let's inspect the request to confirm SOURCE of auth
    params = {
        "sub": str(current_user.id),
        "role": current_user.role,
        "email": current_user.email,
        "auth_source": "unknown"
    }
    
    if request.cookies.get("access_token"):
        params["auth_source"] = "cookie (secure)"
        params["cookie_present"] = True
    elif request.headers.get("authorization"):
        params["auth_source"] = "header (bearer)"
        
    # We return a simple dict, but strictly matching TokenPayload might reject extra fields.
    # Let's just return the user ID/role as per TokenPayload or a custom dict.
    # The user asked for a "simple verify endpoint". 
    # Let's return a custom JSON.
    return params

@router.get("/debug-headers")
async def debug_headers(request: Request):
    """
    Raw Header Dump to check for 'Cookie' header presence in cross-site requests.
    """
    return {
        "headers": dict(request.headers),
        "cookies": request.cookies,
        "client": request.client.host if request.client else None,
        "scheme": request.url.scheme
    }
