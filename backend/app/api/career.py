import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import ValidationError
from supabase import create_client

from app.schemas.career import (
    CareerRecommendationRequest,
    SaveCareerRecommendationRequest,
)
from app.services.career import generate_career_recommendation
from app.utils.auth import get_current_user


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/career",
    tags=["Career Assistant"],
)

security = HTTPBearer()

MAX_INTEREST_LENGTH = 2000


def normalize_interest(interest: str) -> str:
    """Normalize whitespace and validate career interest."""
    normalized = " ".join((interest or "").split())

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Interest cannot be empty.",
        )

    if len(normalized) > MAX_INTEREST_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Interest cannot exceed {MAX_INTEREST_LENGTH} characters.",
        )

    return normalized


def get_user_supabase(access_token: str):
    """Create a Supabase client using the authenticated user's JWT."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Supabase environment variables are not configured.")
        raise HTTPException(
            status_code=500,
            detail="Database configuration is incomplete.",
        )

    client = create_client(supabase_url, supabase_key)
    client.postgrest.auth(access_token)

    return client


async def authenticate_user(credentials: HTTPAuthorizationCredentials):
    """Validate the access token and return the authenticated user."""
    try:
        user = await get_current_user(credentials=credentials)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Career Assistant authentication failed.")
        raise HTTPException(
            status_code=401,
            detail="Unable to authenticate user.",
        )

    if not user or not user.get("id"):
        raise HTTPException(
            status_code=401,
            detail="Invalid user credentials.",
        )

    return user


@router.post("/recommend")
async def recommend_career(
    request: CareerRecommendationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = await authenticate_user(credentials)
    user_id = user["id"]

    interest = normalize_interest(request.interest)

    try:
        user_supabase = get_user_supabase(credentials.credentials)

        # Return the most recent saved recommendation for this user's interest.
        result = (
            user_supabase
            .table("career_recommendations")
            .select("id, interest, recommendation, created_at")
            .eq("user_id", user_id)
            .ilike("interest", interest)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if result.data:
            saved = result.data[0]

            return {
                "interest": interest,
                "recommendation": saved["recommendation"],
                "already_saved": True,
            }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to check saved career recommendations.")
        raise HTTPException(
            status_code=500,
            detail="Failed to check existing career recommendations.",
        )

    try:
        recommendation = generate_career_recommendation(interest)

        if not recommendation or not str(recommendation).strip():
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty recommendation.",
            )

        return {
            "interest": interest,
            "recommendation": recommendation,
            "already_saved": False,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Career recommendation generation failed.")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate career recommendation. Please try again.",
        )


@router.post("/save")
async def save_career_recommendation(
    request: SaveCareerRecommendationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = await authenticate_user(credentials)
    user_id = user["id"]

    interest = normalize_interest(request.interest)
    recommendation = (request.recommendation or "").strip()

    if not recommendation:
        raise HTTPException(
            status_code=400,
            detail="Recommendation content cannot be empty.",
        )

    try:
        user_supabase = get_user_supabase(credentials.credentials)

        # Avoid saving the same content repeatedly for the same user and interest.
        existing = (
            user_supabase
            .table("career_recommendations")
            .select("id, interest, recommendation, created_at")
            .eq("user_id", user_id)
            .ilike("interest", interest)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if existing.data:
            saved = existing.data[0]

            if (
                (saved.get("recommendation") or "").strip()
                == recommendation
            ):
                return {
                    "message": "This career recommendation is already saved.",
                    "already_saved": True,
                    "data": [saved],
                }

        result = (
            user_supabase
            .table("career_recommendations")
            .insert(
                {
                    "user_id": user_id,
                    "interest": interest,
                    "recommendation": recommendation,
                }
            )
            .execute()
        )

        return {
            "message": "Career recommendation saved successfully.",
            "already_saved": False,
            "data": result.data or [],
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to save career recommendation.")
        raise HTTPException(
            status_code=500,
            detail="Failed to save career recommendation.",
        )


@router.get("/saved")
async def get_saved_career_recommendations(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = await authenticate_user(credentials)
    user_id = user["id"]

    try:
        user_supabase = get_user_supabase(credentials.credentials)

        result = (
            user_supabase
            .table("career_recommendations")
            .select("id, user_id, interest, recommendation, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "data": result.data or [],
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to fetch career recommendations.")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch career recommendations.",
        )


@router.delete("/saved/{recommendation_id}")
async def delete_career_recommendation(
    recommendation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = await authenticate_user(credentials)
    user_id = user["id"]

    if not recommendation_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Recommendation ID cannot be empty.",
        )

    try:
        user_supabase = get_user_supabase(credentials.credentials)

        result = (
            user_supabase
            .table("career_recommendations")
            .delete()
            .eq("id", recommendation_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Career recommendation not found.",
            )

        return {
            "message": "Career recommendation deleted successfully.",
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to delete career recommendation.")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete career recommendation.",
        )