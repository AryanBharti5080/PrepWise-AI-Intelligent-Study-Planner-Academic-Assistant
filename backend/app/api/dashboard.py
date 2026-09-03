from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client
import os

from app.database.supabase import supabase
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

security = HTTPBearer()


@router.get("/stats")
async def get_dashboard_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        # Verify the access token and get the logged-in user
        user = await get_current_user(
            credentials=credentials
        )

        user_id = user["id"]

        # Create a Supabase client for this authenticated user
        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )

        # Attach the user's JWT so Supabase RLS sees auth.uid()
        user_supabase.postgrest.auth(access_token)

        # Get this user's study plans
        result = (
            user_supabase
            .table("study_plans")
            .select(
                "id, subject, exam_date, study_hours, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        plans = result.data or []

        # Total study plans
        total_plans = len(plans)

        # Unique subjects
        subjects = {
            plan["subject"].strip().lower()
            for plan in plans
            if plan.get("subject")
        }

        # Unique upcoming exam dates
        today = date.today()

        upcoming_exam_dates = {
            plan["exam_date"]
            for plan in plans
            if plan.get("exam_date")
            and date.fromisoformat(plan["exam_date"]) >= today
        }

        upcoming_exams = len(upcoming_exam_dates)

        # Latest 3 plans
        recent_plans = plans[:3]

        # Study plans grouped by subject
        subject_counts = {}

        for plan in plans:
            subject = plan.get("subject", "").strip()

            if not subject:
                continue

            subject_key = subject.lower()

            if subject_key not in subject_counts:
                subject_counts[subject_key] = {
                    "name": subject,
                    "count": 0,
                }

            subject_counts[subject_key]["count"] += 1

        return {
            "total_plans": total_plans,
            "subjects_studied": len(subjects),
            "upcoming_exams": upcoming_exams,
            "recent_plans": recent_plans,
            "subject_counts": list(subject_counts.values()),
        }

    except HTTPException:
        raise

    except Exception as error:
        print("DASHBOARD ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard statistics",
        )