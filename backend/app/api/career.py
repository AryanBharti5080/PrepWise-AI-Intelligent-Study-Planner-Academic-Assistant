from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client
import os

from app.schemas.career import CareerRecommendationRequest
from app.services.career import generate_career_recommendation
from app.utils.auth import get_current_user
from app.schemas.career import (
    CareerRecommendationRequest,
    SaveCareerRecommendationRequest,
)


router = APIRouter(
    prefix="/career",
    tags=["Career Assistant"],
)

security = HTTPBearer()


@router.post("/recommend")
async def recommend_career(
    request: CareerRecommendationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        # Normalize the interest
        interest = " ".join(request.interest.strip().split())

        if not interest:
            raise HTTPException(
                status_code=400,
                detail="Interest cannot be empty",
            )

        # Check for an existing saved recommendation
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
            return {
                "interest": interest,
                "recommendation": result.data[0]["recommendation"],
                "already_saved": True,
            }

        # Generate only when no saved recommendation exists
        recommendation = generate_career_recommendation(interest)

        return {
            "interest": interest,
            "recommendation": recommendation,
            "already_saved": False,
        }

    except HTTPException:
        raise

    except Exception as error:
        print("CAREER RECOMMENDATION ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to generate career recommendation",
        )

@router.post("/save")
async def save_career_recommendation(
    request: SaveCareerRecommendationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        recommendation = generate_career_recommendation(
            request.interest
        )

        result = (
            user_supabase
            .table("career_recommendations")
            .insert({
                "user_id": user_id,
                "interest": request.interest,
                "recommendation": recommendation,
            })
            .execute()
        )

        return {
            "message": "Career recommendation saved successfully",
            "data": result.data,
        }

    except HTTPException:
        raise

    except Exception as error:
        print("CAREER SAVE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to save career recommendation",
        )

@router.get("/saved")
async def get_saved_career_recommendations(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        result = (
            user_supabase
            .table("career_recommendations")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {"data": result.data or []}

    except HTTPException:
        raise

    except Exception as error:
        print("CAREER FETCH ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch career recommendations",
        )


@router.delete("/saved/{recommendation_id}")
async def delete_career_recommendation(
    recommendation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

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
                detail="Career recommendation not found",
            )

        return {"message": "Career recommendation deleted successfully"}

    except HTTPException:
        raise

    except Exception as error:
        print("CAREER DELETE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete career recommendation",
        )