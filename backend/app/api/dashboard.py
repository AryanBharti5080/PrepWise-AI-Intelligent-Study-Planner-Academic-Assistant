from datetime import date, datetime, timedelta
from collections import defaultdict
import os

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.utils.auth import get_current_user
from app.services.progress_service import (
    extract_plan_topics,
    build_quiz_stats_map,
    resolve_topic_progress,
)


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
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
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

        plans = result.data if isinstance(getattr(result, "data", None), list) else []

        # 3b. Fetch this user's quiz attempts
        quiz_result = (
            user_supabase
            .table("quiz_attempts")
            .select(
                "id, subject, topic, difficulty, total_questions, score, created_at, answers"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        quizzes = quiz_result.data if isinstance(getattr(quiz_result, "data", None), list) else []

        # 3c. Fetch this user's study progress
        progress_data = []
        try:
            progress_res = (
                user_supabase
                .table("study_progress")
                .select("id, plan_id, topic, status, completed_at, updated_at")
                .eq("user_id", user_id)
                .execute()
            )
            progress_data = progress_res.data if isinstance(getattr(progress_res, "data", None), list) else []
        except Exception as p_err:
            print(f"Notice: study_progress query skipped: {p_err}")

        user_progress_map = {
            (str(row.get("plan_id", "")).strip(), str(row.get("topic", "")).strip().casefold()): row
            for row in progress_data
        }

        # Build quiz statistics map for quiz-derived progress inference
        quiz_stats = build_quiz_stats_map(quizzes)

        # 3d. Fetch this user's revision tasks (Revision Assistant metrics)
        revision_data = []
        try:
            rev_res = (
                user_supabase
                .table("revision_tasks")
                .select("id, is_completed")
                .eq("user_id", user_id)
                .execute()
            )
            revision_data = rev_res.data if isinstance(getattr(rev_res, "data", None), list) else []
        except Exception as rev_err:
            print(f"Notice: revision_tasks query skipped: {rev_err}")

        total_rev_tasks = len(revision_data)
        completed_rev_tasks = sum(1 for t in revision_data if t.get("is_completed"))
        rev_completion_pct = (
            round((completed_rev_tasks / total_rev_tasks) * 100, 1)
            if total_rev_tasks > 0
            else 0.0
        )

        today = date.today()
        now = datetime.now()

        # 4. Normalize and prepare plan data
        normalized_plans = []
        total_syllabus_topics = 0
        completed_syllabus_topics = 0
        in_progress_syllabus_topics = 0

        for plan in plans:
            subject = normalize_subject(plan.get("subject"))
            exam_date = parse_date(plan.get("exam_date"))
            created_at = plan.get("created_at")

            try:
                study_hours = float(plan.get("study_hours") or 0)
            except (ValueError, TypeError):
                study_hours = 0.0

            study_hours = max(study_hours, 0.0)

            # Calculate topic progress for this specific plan
            plan_id_str = str(plan.get("id", "")).strip()
            p_topics = extract_plan_topics(plan.get("topics"))
            plan_comp = 0
            plan_in_prog = 0

            for t_name in p_topics:
                total_syllabus_topics += 1
                st, _, _, _ = resolve_topic_progress(
                    plan_id=plan_id_str,
                    subject=subject,
                    topic_name=t_name,
                    progress_map=user_progress_map,
                    quiz_stats=quiz_stats,
                )
                if st == "Completed":
                    plan_comp += 1
                    completed_syllabus_topics += 1
                elif st == "In Progress":
                    plan_in_prog += 1
                    in_progress_syllabus_topics += 1

            plan_pct = (
                round((plan_comp / len(p_topics)) * 100, 1)
                if p_topics
                else 0.0
            )

            normalized_plans.append({
                **plan,
                "subject": subject,
                "progress_percentage": plan_pct,
                "completed_topics_count": plan_comp,
                "total_topics_count": len(p_topics),
                "_exam_date": exam_date,
                "_study_hours": study_hours,
            })

        overall_progress_pct = (
            round((completed_syllabus_topics / total_syllabus_topics) * 100, 1)
            if total_syllabus_topics > 0
            else 0.0
        )

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
                "progress_percentage": plan.get("progress_percentage", 0.0),
                "completed_topics": plan.get("completed_topics_count", 0),
                "total_topics": plan.get("total_topics_count", 0),
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

        # 12. Enhanced Phase 2: Quiz Analytics & Weak Topics
        total_quiz_attempts = len(quizzes)
        submitted_quizzes = [q for q in quizzes if bool(q.get("answers"))]
        submitted_count = len(submitted_quizzes)

        if submitted_count > 0:
            avg_quiz_score = round(
                sum(
                    (float(q.get("score") or 0) / max(int(q.get("total_questions") or 1), 1)) * 100
                    for q in submitted_quizzes
                ) / submitted_count,
                1,
            )
        else:
            avg_quiz_score = None

        # Weak topics calculation (matching /quiz/weak-topics rule: accuracy < 60%)
        topic_performance_map = {}
        for q in submitted_quizzes:
            subj = normalize_subject(q.get("subject"))
            top = (q.get("topic") or "").strip()
            if not subj or not top:
                continue
            key = (subj, top)
            if key not in topic_performance_map:
                topic_performance_map[key] = {
                    "attempts": 0,
                    "total_score": 0,
                    "total_questions": 0,
                }
            topic_performance_map[key]["attempts"] += 1
            topic_performance_map[key]["total_score"] += float(q.get("score") or 0)
            topic_performance_map[key]["total_questions"] += max(int(q.get("total_questions") or 1), 1)

        weak_topics_list = []
        for (subj, top), stats in topic_performance_map.items():
            pct = round(stats["total_score"] / max(stats["total_questions"], 1) * 100, 1)
            weak_topics_list.append({
                "subject": subj,
                "topic": top,
                "attempts": stats["attempts"],
                "average_percentage": pct,
                "needs_practice": pct < 60.0,
            })
        weak_topics_list.sort(key=lambda item: item["average_percentage"])
        weak_topics_needing_practice = [t for t in weak_topics_list if t["needs_practice"]]
        weak_topics_count = len(weak_topics_needing_practice)

        # Quiz score trend (chronological order for time series chart)
        quiz_score_trend = []
        for q in reversed(submitted_quizzes[:12]):
            total_q = max(int(q.get("total_questions") or 1), 1)
            score = float(q.get("score") or 0)
            pct = round(score / total_q * 100, 1)
            q_date = parse_date(q.get("created_at"))
            date_label = q_date.strftime("%d %b") if q_date else "Recent"
            quiz_score_trend.append({
                "id": str(q.get("id")),
                "date": date_label,
                "full_date": (q_date.isoformat() if q_date else ""),
                "subject": normalize_subject(q.get("subject")),
                "topic": (q.get("topic") or "").strip(),
                "score": int(score),
                "total_questions": total_q,
                "percentage": pct,
                "difficulty": q.get("difficulty") or "Medium",
            })

        # Subject-wise quiz performance
        subj_quiz_map = {}
        for q in submitted_quizzes:
            subj = normalize_subject(q.get("subject"))
            if not subj:
                continue
            if subj not in subj_quiz_map:
                subj_quiz_map[subj] = {
                    "attempts": 0,
                    "total_score": 0,
                    "total_questions": 0,
                }
            subj_quiz_map[subj]["attempts"] += 1
            subj_quiz_map[subj]["total_score"] += float(q.get("score") or 0)
            subj_quiz_map[subj]["total_questions"] += max(int(q.get("total_questions") or 1), 1)

        subject_quiz_performance = []
        for subj, sdata in subj_quiz_map.items():
            avg_pct = round(sdata["total_score"] / max(sdata["total_questions"], 1) * 100, 1)
            subject_quiz_performance.append({
                "subject": subj,
                "attempts": sdata["attempts"],
                "average_percentage": avg_pct,
            })
        subject_quiz_performance.sort(key=lambda item: item["attempts"], reverse=True)

        # 13. Combined Recent Activity (study plans + quiz attempts)
        activity_items = []
        for plan in normalized_plans[:6]:
            activity_items.append({
                "id": str(plan.get("id")),
                "type": "study_plan",
                "title": f"Study Plan: {plan['subject']}",
                "description": f"{plan['_study_hours']} hrs/day · Exam: {plan.get('exam_date') or 'No date'}",
                "timestamp": plan.get("created_at") or "",
                "subject": plan["subject"],
                "badge": "Plan",
                "link": "/plans",
            })
        for q in quizzes[:6]:
            is_sub = bool(q.get("answers"))
            total_q = max(int(q.get("total_questions") or 1), 1)
            score = int(float(q.get("score") or 0))
            pct = round(score / total_q * 100)
            subj = normalize_subject(q.get("subject"))
            top = (q.get("topic") or "").strip()
            activity_items.append({
                "id": str(q.get("id")),
                "type": "quiz",
                "title": f"Quiz: {subj} ({top})" if top else f"Quiz: {subj}",
                "description": f"Score: {score}/{total_q} ({pct}%) · {q.get('difficulty') or 'Medium'}" if is_sub else f"{total_q} questions · Unsubmitted",
                "timestamp": q.get("created_at") or "",
                "subject": subj,
                "badge": f"{pct}%" if is_sub else "Incomplete",
                "link": "/quiz/history",
            })
        activity_items.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
        recent_activity = activity_items[:8]

        # Add weak topics insight if any
        if weak_topics_count > 0:
            insights.append({
                "type": "suggestion",
                "title": "Revision alert",
                "message": (
                    f"You have {weak_topics_count} topic(s) with under 60% accuracy. "
                    "Review them in Weak Topic Analysis to strengthen your preparation."
                ),
            })

        # 14. Return the complete enhanced dashboard response
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

            # Enhanced Phase 2 fields
            "total_quiz_attempts": total_quiz_attempts,
            "submitted_quiz_attempts": submitted_count,
            "average_quiz_score": avg_quiz_score,
            "weak_topics_count": weak_topics_count,
            "weak_topics_summary": weak_topics_needing_practice[:6],
            "quiz_score_trend": quiz_score_trend,
            "subject_quiz_performance": subject_quiz_performance[:8],
            "recent_activity": recent_activity,

            # Phase 4: Study Progress Tracker summary
            "study_progress_summary": {
                "total_topics": total_syllabus_topics,
                "completed_topics": completed_syllabus_topics,
                "in_progress_topics": in_progress_syllabus_topics,
                "not_started_topics": max(total_syllabus_topics - completed_syllabus_topics - in_progress_syllabus_topics, 0),
                "progress_percentage": overall_progress_pct,
            },

            # Phase 3: AI Revision Assistant summary
            "revision_summary": {
                "total_tasks": total_rev_tasks,
                "completed_tasks": completed_rev_tasks,
                "completion_percentage": rev_completion_pct,
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        print("DASHBOARD ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard statistics.",
        )