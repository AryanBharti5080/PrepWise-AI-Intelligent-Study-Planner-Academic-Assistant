from datetime import date, datetime, timedelta
from collections import defaultdict
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

security = HTTPBearer()


def parse_date(value):
    """Convert a database date or datetime string into a date."""
    if not value:
        return None

    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def normalize_subject(subject):
    """Normalize subject names for grouping."""
    return " ".join((subject or "").strip().split())


@router.get("/stats")
async def get_dashboard_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        # 1. Authenticate the current user
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        # 2. Create a user-authenticated Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase configuration is missing.",
            )

        user_supabase = create_client(
            supabase_url,
            supabase_key,
        )

        # Ensure database requests use the user's JWT
        user_supabase.postgrest.auth(access_token)

        # 3. Fetch this user's study plans
        result = (
            user_supabase
            .table("study_plans")
            .select(
                "id, subject, topics, exam_date, study_hours, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        plans = result.data or []

        today = date.today()
        now = datetime.now()

        # 4. Normalize and prepare plan data
        normalized_plans = []

        for plan in plans:
            subject = normalize_subject(plan.get("subject"))
            exam_date = parse_date(plan.get("exam_date"))
            created_at = plan.get("created_at")

            try:
                study_hours = float(plan.get("study_hours") or 0)
            except (ValueError, TypeError):
                study_hours = 0.0

            study_hours = max(study_hours, 0.0)

            normalized_plans.append({
                **plan,
                "subject": subject,
                "_exam_date": exam_date,
                "_study_hours": study_hours,
            })

        # 5. Summary statistics
        total_plans = len(normalized_plans)

        unique_subjects = {
            plan["subject"].casefold()
            for plan in normalized_plans
            if plan["subject"]
        }

        subjects_studied = len(unique_subjects)

        # Count distinct upcoming exam dates, not plans.
        upcoming_exam_dates = {
            plan["_exam_date"]
            for plan in normalized_plans
            if plan["_exam_date"]
            and plan["_exam_date"] >= today
        }

        upcoming_exams = len(upcoming_exam_dates)

        # This is the sum of daily study-hour inputs across plans,
        # not a measurement of actual hours studied.
        total_planned_study_hours = round(
            sum(plan["_study_hours"] for plan in normalized_plans),
            2,
        )

        # 6. Recent plans: newest 5
        recent_plans = [
            {
                key: value
                for key, value in plan.items()
                if not key.startswith("_")
            }
            for plan in normalized_plans[:5]
        ]

        # 7. Study plans grouped by subject
        subject_counts_map = {}

        for plan in normalized_plans:
            subject = plan["subject"]

            if not subject:
                continue

            subject_key = subject.casefold()

            if subject_key not in subject_counts_map:
                subject_counts_map[subject_key] = {
                    "name": subject,
                    "count": 0,
                    "planned_study_hours": 0.0,
                }

            subject_counts_map[subject_key]["count"] += 1
            subject_counts_map[subject_key]["planned_study_hours"] += (
                plan["_study_hours"]
            )

        subject_counts = sorted(
            [
                {
                    **item,
                    "planned_study_hours": round(
                        item["planned_study_hours"], 2
                    ),
                }
                for item in subject_counts_map.values()
            ],
            key=lambda item: item["count"],
            reverse=True,
        )

        # 8. Subject distribution for pie charts
        subject_distribution = [
            {
                "name": item["name"],
                "value": item["count"],
            }
            for item in subject_counts
        ]

        # 9. Study planning activity over the last 7 days
        activity_start = today - timedelta(days=6)

        activity_map = defaultdict(int)

        for offset in range(7):
            activity_date = activity_start + timedelta(days=offset)
            activity_map[activity_date.isoformat()] = 0

        for plan in normalized_plans:
            created_at = plan.get("created_at")

            if not created_at:
                continue

            try:
                created_date = datetime.fromisoformat(
                    created_at.replace("Z", "+00:00")
                ).date()

                if activity_start <= created_date <= today:
                    activity_map[created_date.isoformat()] += 1

            except (ValueError, TypeError, AttributeError):
                continue

        study_activity = [
            {
                "date": activity_date.isoformat(),
                "plans_created": activity_map[activity_date.isoformat()],
            }
            for offset in range(7)
            for activity_date in [
                activity_start + timedelta(days=offset)
            ]
        ]

        # 10. Upcoming exams list, with days remaining
        upcoming_exam_plans = []

        for plan in normalized_plans:
            exam_date = plan["_exam_date"]

            if exam_date is None or exam_date < today:
                continue

            upcoming_exam_plans.append({
                "id": plan.get("id"),
                "subject": plan["subject"],
                "exam_date": exam_date.isoformat(),
                "days_remaining": (exam_date - today).days,
                "study_hours": plan["_study_hours"],
            })

        upcoming_exam_plans.sort(
            key=lambda item: item["exam_date"]
        )

        # 11. Personalized study insights
        insights = []

        if not normalized_plans:
            insights.append({
                "type": "suggestion",
                "title": "Start your study journey",
                "message": (
                    "Create your first study plan to unlock "
                    "personalized study analytics."
                ),
            })
        else:
            if subject_counts:
                top_subject = subject_counts[0]

                insights.append({
                    "type": "subject",
                    "title": "Most planned subject",
                    "message": (
                        f"{top_subject['name']} has "
                        f"{top_subject['count']} saved study plan(s)."
                    ),
                })

            exams_within_14_days = [
                exam
                for exam in upcoming_exam_plans
                if exam["days_remaining"] <= 14
            ]

            if exams_within_14_days:
                insights.append({
                    "type": "exam",
                    "title": "Upcoming exam reminder",
                    "message": (
                        f"You have {len(exams_within_14_days)} "
                        "study plan(s) with exams in the next 14 days."
                    ),
                })
            else:
                insights.append({
                    "type": "exam",
                    "title": "Exam schedule",
                    "message": (
                        "No exams linked to your study plans "
                        "are scheduled in the next 14 days."
                    ),
                })

            planned_subjects = {
                subject.casefold()
                for subject in unique_subjects
            }

            if len(planned_subjects) < 3:
                insights.append({
                    "type": "suggestion",
                    "title": "Build a broader study plan",
                    "message": (
                        "Consider adding plans for other subjects "
                        "in your current exam schedule."
                    ),
                })

        # 12. Return the complete dashboard response
        return {
            "total_plans": total_plans,
            "subjects_studied": subjects_studied,
            "upcoming_exams": upcoming_exams,
            "total_planned_study_hours": total_planned_study_hours,
            "recent_plans": recent_plans,
            "subject_counts": subject_counts,
            "subject_distribution": subject_distribution,
            "study_activity": study_activity,
            "upcoming_exam_plans": upcoming_exam_plans[:10],
            "insights": insights,
        }

    except HTTPException:
        raise

    except Exception as error:
        print("DASHBOARD ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard statistics.",
        )