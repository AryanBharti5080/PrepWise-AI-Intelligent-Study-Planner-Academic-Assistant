from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer(auto_error=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    print("AUTH HEADER RECEIVED")
    print("TOKEN TYPE:", credentials.scheme)
    print("TOKEN LENGTH:", len(token))

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase environment variables are missing.",
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY,
                },
            )

        print("SUPABASE STATUS:", response.status_code)

        if response.status_code != 200:
            print("SUPABASE RESPONSE:", response.text)

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token.",
            )

        return response.json()

    except HTTPException:
        raise

    except Exception as error:
        print("AUTH ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Authentication service error.",
        )