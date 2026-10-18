import logging
import os
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.database.supabase import supabase
from app.schemas.planner import (
    SaveStudyPlanRequest,
    StudyPlanRequest,
)
from app.services.groq import generate_study_plan

router = APIRouter(
    prefix="/planner",
    tags=["Study Planner"],
)

security = HTTPBearer()
logger = logging.getLogger(__name__)


# --------------------------------------------------
# SUPABASE HELPERS
# --------------------------------------------------

def get_user_supabase(access_token: str):
    """
    Create a Supabase client authenticated with the user's
    access token so database operations respect user permissions.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail="Database configuration is missing.",
        )

    user_supabase = create_client(
        supabase_url,
        supabase_key,
    )

    user_supabase.postgrest.auth(access_token)

    return user_supabase


def get_authenticated_user(access_token: str):
    """Validate the access token and return the authenticated user."""
    try:
        user_response = supabase.auth.get_user(access_token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token.",
            )

        return user_response.user

    except HTTPException:
        raise

    except Exception:
        logger.exception("User authentication failed.")

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token.",
        )


def normalize_text(value: str) -> str:
    """
    Normalize whitespace and capitalization for duplicate checks.

    Examples:
        ' ML '       -> 'ml'
        'Operating   System' -> 'operating system'
    """
    return " ".join(value.strip().lower().split())


def validate_plan_inputs(request: SaveStudyPlanRequest):
    """Validate and normalize the plan details."""
    subject = request.subject.strip()
    topics = request.topics.strip()
    generated_plan = request.generated_plan.strip()

    if not subject or not topics:
        raise HTTPException(
            status_code=422,
            detail="Subject and topics cannot be empty.",
        )

    if not generated_plan:
        raise HTTPException(
            status_code=422,
            detail="Generated study plan cannot be empty.",
        )

    if not 1 <= request.study_hours <= 12:
        raise HTTPException(
            status_code=422,
            detail="Daily study hours must be between 1 and 12.",
        )

    try:
        exam_date = date.fromisoformat(
            str(request.exam_date)
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="Please provide a valid exam date.",
        )

    return {
        "subject": subject,
        "topics": topics,
        "exam_date": exam_date.isoformat(),
        "study_hours": request.study_hours,
        "generated_plan": generated_plan,
    }


def create_duplicate_key(plan: dict) -> tuple:
    """
    Build a key representing the study-plan inputs.

    Plans are considered duplicates when their normalized
    subject, topics, exam date, and daily study hours match.
    """
    return (
        normalize_text(plan["subject"]),
        normalize_text(plan["topics"]),
        plan["exam_date"],
        plan["study_hours"],
    )


# --------------------------------------------------
# GENERATE STUDY PLAN
# --------------------------------------------------

@router.post("/generate")
async def planner(request: StudyPlanRequest):
    subject = request.subject.strip()
    topics = request.topics.strip()

    if not subject or not topics:
        raise HTTPException(
            status_code=422,
            detail="Subject and topics cannot be empty.",
        )

    if not 1 <= request.study_hours <= 12:
        raise HTTPException(
            status_code=422,
            detail="Daily study hours must be between 1 and 12.",
        )

    try:
        exam_date = date.fromisoformat(
            str(request.exam_date)
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="Please provide a valid exam date.",
        )

    try:
        plan = generate_study_plan(
            subject,
            topics,
            exam_date.isoformat(),
            request.study_hours,
        )

        if not isinstance(plan, str) or not plan.strip():
            raise HTTPException(
                status_code=502,
                detail=(
                    "The AI returned an empty study plan. "
                    "Please try again."
                ),
            )

        return {
            "subject": subject,
            "plan": plan.strip(),
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        )

    except Exception:
        logger.exception("Study plan generation failed.")

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to generate your study plan right now. "
                "Please try again shortly."
            ),
        )


# --------------------------------------------------
# SAVE STUDY PLAN — DUPLICATE PROTECTION
# --------------------------------------------------

@router.post("/save")
async def save_study_plan(
    request: SaveStudyPlanRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = get_authenticated_user(access_token)
        user_id = str(user.id)

        plan = validate_plan_inputs(request)

        user_supabase = get_user_supabase(access_token)

        # Fetch this user's existing plans.
        existing_result = (
            user_supabase
            .table("study_plans")
            .select(
                "id, subject, topics, exam_date, study_hours, "
                "generated_plan, created_at"
            )
            .eq("user_id", user_id)
            .execute()
        )

        new_key = create_duplicate_key(plan)

        # Detect an existing plan with the same inputs.
        for existing in existing_result.data or []:
            existing_plan = {
                "subject": existing.get("subject") or "",
                "topics": existing.get("topics") or "",
                "exam_date": str(existing.get("exam_date", "")),
                "study_hours": existing.get("study_hours"),
            }

            if create_duplicate_key(existing_plan) == new_key:
                return {
                    "message": (
                        "An identical study plan already exists. "
                        "The existing plan was retained."
                    ),
                    "duplicate": True,
                    "data": existing,
                }

        # Insert only if an equivalent plan was not found.
        result = (
            user_supabase
            .table("study_plans")
            .insert({
                "user_id": user_id,
                "subject": plan["subject"],
                "topics": plan["topics"],
                "exam_date": plan["exam_date"],
                "study_hours": plan["study_hours"],
                "generated_plan": plan["generated_plan"],
            })
            .execute()
        )

        return {
            "message": "Study plan saved successfully.",
            "duplicate": False,
            "data": result.data,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Saving study plan failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to save the study plan. Please try again.",
        )


# --------------------------------------------------
# FETCH SAVED PLANS — FILTER EXISTING DUPLICATES
# --------------------------------------------------

@router.get("/saved")
async def get_saved_plans(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = get_authenticated_user(access_token)
        user_id = str(user.id)

        user_supabase = get_user_supabase(access_token)

        result = (
            user_supabase
            .table("study_plans")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        unique_plans = []
        seen_keys = set()

        # Keep the newest record for each matching input combination.
        for row in result.data or []:
            plan_key = create_duplicate_key({
                "subject": row.get("subject") or "",
                "topics": row.get("topics") or "",
                "exam_date": str(row.get("exam_date", "")),
                "study_hours": row.get("study_hours"),
            })

            if plan_key in seen_keys:
                continue

            seen_keys.add(plan_key)
            unique_plans.append(row)

        return {
            "data": unique_plans,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Fetching saved study plans failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch study plans. Please try again.",
        )


# --------------------------------------------------
# DELETE SAVED STUDY PLAN
# --------------------------------------------------

@router.delete("/saved/{plan_id}")
async def delete_study_plan(
    plan_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user = get_authenticated_user(access_token)
        user_id = str(user.id)

        user_supabase = get_user_supabase(access_token)

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
                detail="Study plan not found.",
            )

        return {
            "message": "Study plan deleted successfully.",
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Deleting study plan failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to delete the study plan. Please try again.",
        )