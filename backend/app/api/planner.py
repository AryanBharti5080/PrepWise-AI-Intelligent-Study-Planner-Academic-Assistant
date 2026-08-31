from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client
from uuid import UUID
import os

from app.database.supabase import supabase
from app.schemas.planner import (
    SaveStudyPlanRequest,
    StudyPlanRequest,
)
from app.services.groq import generate_study_plan
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/planner",
    tags=["Study Planner"],
)

security = HTTPBearer()


@router.post("/generate")
async def planner(request: StudyPlanRequest):

    plan = generate_study_plan(
        request.subject,
        request.topics,
        request.exam_date,
        request.study_hours,
    )

    return {
        "subject": request.subject,
        "plan": plan,
    }


@router.post("/save")
async def save_study_plan(
    request: SaveStudyPlanRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(access_token)

        if not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token.",
            )

        user_id = str(user_response.user.id)

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        result = (
            user_supabase
            .table("study_plans")
            .insert({
                "user_id": user_id,
                "subject": request.subject,
                "topics": request.topics,
                "exam_date": request.exam_date,
                "study_hours": request.study_hours,
                "generated_plan": request.generated_plan,
            })
            .execute()
        )

        return {
            "message": "Study plan saved successfully",
            "data": result.data,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/saved")
async def get_saved_plans(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(access_token)

        if not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token.",
            )

        user_id = str(user_response.user.id)

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        result = (
            user_supabase
            .table("study_plans")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "data": result.data,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch study plans",
        )


@router.delete("/saved/{plan_id}")
async def delete_study_plan(
    plan_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(access_token)

        if not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token.",
            )

        user_id = str(user_response.user.id)

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        user_supabase.postgrest.auth(access_token)

        result = (
            user_supabase
            .table("study_plans")
            .delete()
            .eq("id", str(plan_id))
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Study plan not found",
            )

        return {
            "message": "Study plan deleted successfully",
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete study plan",
        )