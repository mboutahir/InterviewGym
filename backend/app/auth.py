from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError
import os
from app.logging_config import logger

security = HTTPBearer()

CLERK_JWT_PUBLIC_KEY = os.getenv("CLERK_JWT_PUBLIC_KEY")

# Validate that the key exists and is in PEM format
if not CLERK_JWT_PUBLIC_KEY:
    logger.error("CLERK_JWT_PUBLIC_KEY environment variable is not set!")
    logger.error("Please add your Clerk public key to .env file")
    logger.error(
        "Format should be: -----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----"
    )

if CLERK_JWT_PUBLIC_KEY and not CLERK_JWT_PUBLIC_KEY.startswith("-----BEGIN"):
    logger.warning(
        "CLERK_JWT_PUBLIC_KEY does not appear to be in PEM format. It may fail during verification."
    )


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify JWT token from Clerk and extract user info"""

    if not CLERK_JWT_PUBLIC_KEY:
        logger.error(
            "Attempt to verify token but CLERK_JWT_PUBLIC_KEY is not configured"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: JWT key not set",
        )

    token = credentials.credentials
    import base64, json
    payload_b64 = token.split(".")[1]
    payload_b64 += "=" * (4 - len(payload_b64) % 4)
    decoded = json.loads(base64.b64decode(payload_b64))
    logger.info(f"RAW TOKEN PAYLOAD: {json.dumps(decoded, indent=2)}")

    try:
        # Verify locally — no network call needed
        payload = jwt.decode(
            token,
            CLERK_JWT_PUBLIC_KEY,
            algorithms=["RS256"],  # Clerk always uses RS256
            options={"verify_aud": False},  # Clerk tokens have no audience by default
        )

        user_id = payload.get("sub")
        email = None

        # Clerk stores email in different places depending on your JWT template
        # Check the common locations:
        if payload.get("email"):
            email = payload.get("email")
        elif payload.get("primary_email_address"):
            email = payload.get("primary_email_address")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user ID",
            )

        logger.info(f"Token verified for user: {user_id}")

        return {
            "user_id": user_id,
            "email": email,
            "name": payload.get("name") or payload.get("full_name"),
            "session_id": payload.get("sid"),
        }

    except InvalidTokenError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalid or expired: {str(e)}",
        )


async def get_current_user(user_data: dict = Depends(verify_clerk_token)) -> dict:
    """Get current authenticated user from verified token data"""
    if not user_data.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not authenticated"
        )
    return user_data
