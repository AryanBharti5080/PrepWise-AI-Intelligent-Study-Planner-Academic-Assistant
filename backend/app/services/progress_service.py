import re
from datetime import date
from typing import Dict, List, Optional, Tuple


def extract_plan_topics(topics_text: Optional[str]) -> List[str]:
    """
    Extract individual syllabus topics from delimited text (comma, semicolon, bullet, newline).
    Preserves order and original casing while deduplicating case-insensitively.
    Strips leading bullet points, dashes, and number markers (e.g. '1. ', '1) ').
    """
    if not topics_text:
        return []
    
    raw_topics = re.split(r"[\n,;•]+", str(topics_text))
    cleaned: List[str] = []
    seen = set()

    for item in raw_topics:
        # Strip bullets and whitespace
        topic_name = item.strip().strip("-").strip("*").strip("•").strip()
        # Strip leading numbers like '1. ' or '1) '
        topic_name = re.sub(r"^\d+[\.\)]\s*", "", topic_name).strip()
        
        # Filter out empty or common non-topic tokens
        if len(topic_name) > 1 and topic_name.lower() not in {"and", "etc", "none", "n/a"}:
            lower_key = topic_name.casefold()
            if lower_key not in seen:
                seen.add(lower_key)
                cleaned.append(topic_name)
    
    return cleaned


def calculate_progress_percentage(total: int, completed: int) -> float:
    """Calculate rounded percentage of completed topics."""
    if total <= 0:
        return 0.0
    return round((completed / total) * 100, 1)


def parse_exam_date_and_days(exam_date_val) -> Tuple[Optional[str], Optional[int]]:
    """Convert an exam_date value into an ISO string and calculate days until exam."""
    if not exam_date_val:
        return None, None
    try:
        d = date.fromisoformat(str(exam_date_val)[:10])
        days_left = (d - date.today()).days
        return d.isoformat(), days_left
    except (ValueError, TypeError):
        return None, None


def normalize_subject_name(subject: Optional[str]) -> str:
    """Normalize subject string for uniform case-insensitive comparison."""
    return " ".join((subject or "").strip().split()).casefold()


def build_quiz_stats_map(quizzes: List[dict]) -> Dict[tuple, dict]:
    """
    Build a lookup map of submitted quiz attempts by (subject_casefold, topic_casefold).
    Computes best accuracy percentage and captures created_at timestamp.
    """
    quiz_stats: Dict[tuple, dict] = {}
    if not isinstance(quizzes, list):
        return quiz_stats

    for q in quizzes:
        if not q.get("answers"):
            continue
        subj = normalize_subject_name(q.get("subject"))
        top = (q.get("topic") or "").strip().casefold()
        if not top:
            continue
        score = float(q.get("score") or 0)
        total = max(int(q.get("total_questions") or 1), 1)
        pct = round((score / total) * 100, 1)

        key = (subj, top)
        if key not in quiz_stats:
            quiz_stats[key] = {
                "subject": subj,
                "topic": top,
                "best_score": score,
                "total_questions": total,
                "best_pct": pct,
                "created_at": q.get("created_at"),
                "attempts": 1,
            }
        else:
            quiz_stats[key]["attempts"] += 1
            if pct > quiz_stats[key]["best_pct"]:
                quiz_stats[key]["best_pct"] = pct
                quiz_stats[key]["best_score"] = score
                quiz_stats[key]["total_questions"] = total
                quiz_stats[key]["created_at"] = q.get("created_at")

    return quiz_stats


def find_quiz_match(norm_subj: str, norm_top: str, quiz_stats: Dict[tuple, dict]) -> Optional[dict]:
    """Find the best matching quiz attempt for a given subject and topic."""
    # 1. Exact match on both subject and topic
    if (norm_subj, norm_top) in quiz_stats:
        return quiz_stats[(norm_subj, norm_top)]

    # 2. Topic exact match with compatible subject
    for (q_subj, q_top), info in quiz_stats.items():
        if q_top == norm_top and (not norm_subj or not q_subj or q_subj in norm_subj or norm_subj in q_subj):
            return info

    # 3. Topic substring match with compatible subject
    for (q_subj, q_top), info in quiz_stats.items():
        if (not norm_subj or not q_subj or q_subj in norm_subj or norm_subj in q_subj):
            if norm_top in q_top or q_top in norm_top:
                return info

    # 4. Fallback: match by topic alone
    for (q_subj, q_top), info in quiz_stats.items():
        if q_top == norm_top:
            return info

    return None


def resolve_topic_progress(
    plan_id: str,
    subject: str,
    topic_name: str,
    progress_map: Dict[tuple, dict],
    quiz_stats: Dict[tuple, dict],
) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    """
    Resolve effective topic status, completed_at, updated_at, and item_id.
    Prioritizes explicit user status in study_progress, falling back to quiz mastery.
    Returns: (status, completed_at, updated_at, item_id)
    """
    norm_subj = normalize_subject_name(subject)
    norm_top = topic_name.strip().casefold()

    rec = progress_map.get((plan_id, norm_top))
    if rec:
        item_id = str(rec.get("id")) if rec.get("id") else None
        status = rec.get("status") or "Not Started"
        comp_at = rec.get("completed_at")
        upd_at = rec.get("updated_at")

        if status in ("Completed", "In Progress"):
            return status, comp_at, upd_at, item_id

        # If recorded status is 'Not Started', check if a quiz was completed AFTER the manual update
        q_info = find_quiz_match(norm_subj, norm_top, quiz_stats)
        if q_info:
            rec_updated = str(upd_at or "")
            q_created = str(q_info.get("created_at") or "")
            if not rec_updated or (q_created and q_created > rec_updated):
                best_pct = q_info.get("best_pct", 0.0)
                inferred_status = "Completed" if best_pct >= 60.0 else "In Progress"
                inferred_comp_at = q_info.get("created_at") if inferred_status == "Completed" else None
                return inferred_status, inferred_comp_at, upd_at, item_id

        return "Not Started", None, upd_at, item_id

    # No record in study_progress -> infer from quiz attempts
    q_info = find_quiz_match(norm_subj, norm_top, quiz_stats)
    if q_info:
        best_pct = q_info.get("best_pct", 0.0)
        inferred_status = "Completed" if best_pct >= 60.0 else "In Progress"
        inferred_comp_at = q_info.get("created_at") if inferred_status == "Completed" else None
        return inferred_status, inferred_comp_at, None, None

    return "Not Started", None, None, None

