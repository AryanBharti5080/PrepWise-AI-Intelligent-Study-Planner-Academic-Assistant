from datetime import date
from typing import Dict, List, Optional
from urllib.parse import quote
import os
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Initialize Groq client safely
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def normalize_subject(subject: Optional[str]) -> str:
    """Normalize subject names for uniform grouping."""
    return " ".join((subject or "").strip().split())


def parse_date(value) -> Optional[date]:
    """Parse date or datetime string into a date object."""
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def extract_topics_from_text(text: Optional[str]) -> List[str]:
    """Extract individual topics from comma, newline, or bullet-separated strings."""
    if not text:
        return []
    raw_topics = re.split(r"[\n,;•]+", str(text))
    cleaned = []
    for item in raw_topics:
        cleaned_item = item.strip().strip("-").strip("*").strip()
        if len(cleaned_item) > 1 and cleaned_item.lower() not in {"and", "etc", "none"}:
            cleaned.append(cleaned_item)
    return cleaned[:8]  # Limit to 8 topics per plan to avoid clutter


def build_revision_recommendations(plans: List[Dict], quizzes: List[Dict]) -> List[Dict]:
    """
    Construct personalized revision recommendations based on actual saved study plans,
    exam dates, and submitted quiz scores.
    """
    today = date.today()

    # 1. Map upcoming exams by subject
    subject_exam_map: Dict[str, Dict] = {}
    for p in plans:
        subj = normalize_subject(p.get("subject"))
        if not subj:
            continue
        subj_key = subj.casefold()
        exam_d = parse_date(p.get("exam_date"))
        if exam_d and exam_d >= today:
            days_left = (exam_d - today).days
            if (
                subj_key not in subject_exam_map
                or days_left < subject_exam_map[subj_key]["days_left"]
            ):
                subject_exam_map[subj_key] = {
                    "subject": subj,
                    "exam_date": exam_d.isoformat(),
                    "days_left": days_left,
                    "study_hours": float(p.get("study_hours") or 2.0),
                }

    # 2. Analyze submitted quiz attempts per (subject, topic)
    topic_quiz_stats: Dict[tuple, Dict] = {}
    for q in quizzes:
        if not q.get("answers"):
            continue  # Exclude unsubmitted quizzes
        subj = normalize_subject(q.get("subject"))
        top = (q.get("topic") or "").strip()
        if not subj or not top:
            continue
        key = (subj.casefold(), top.casefold())
        if key not in topic_quiz_stats:
            topic_quiz_stats[key] = {
                "subject": subj,
                "topic": top,
                "attempts": 0,
                "total_score": 0,
                "total_questions": 0,
            }
        topic_quiz_stats[key]["attempts"] += 1
        topic_quiz_stats[key]["total_score"] += float(q.get("score") or 0)
        topic_quiz_stats[key]["total_questions"] += max(int(q.get("total_questions") or 1), 1)

    generated_tasks: List[Dict] = []
    seen_keys = set()

    # 3. Process Weak Topics & Assessed Topics from Quizzes
    for (subj_key, top_key), stats in topic_quiz_stats.items():
        subj = stats["subject"]
        top = stats["topic"]
        accuracy = round(stats["total_score"] / max(stats["total_questions"], 1) * 100, 1)
        attempts = stats["attempts"]
        exam_info = subject_exam_map.get(subj_key)

        days_left = exam_info["days_left"] if exam_info else None
        exam_date_str = exam_info["exam_date"] if exam_info else None

        # Determine Priority according to transparent rules
        if (accuracy < 60.0 and days_left is not None and days_left <= 14) or accuracy < 40.0:
            priority = "High"
            suggested_duration = "50-60 mins"
            if days_left is not None:
                reason = f"Quiz accuracy is {accuracy}% with an exam in {days_left} day{'s' if days_left != 1 else ''}."
            else:
                reason = f"Critical weak spot: accuracy is {accuracy}% across {attempts} attempt{'s' if attempts != 1 else ''}."
            suggested_activity = "Review high-yield formulas and concepts, then retake a 10-question practice quiz."
        elif (accuracy < 60.0) or (accuracy <= 75.0 and days_left is not None and days_left <= 14):
            priority = "Medium"
            suggested_duration = "35-45 mins"
            if days_left is not None:
                reason = f"Moderate score ({accuracy}%) with an exam in {days_left} days. Targeted revision advised."
            else:
                reason = f"Quiz accuracy is {accuracy}%. Review key definitions to bring score above 70%."
            suggested_activity = "Solve practice problems and test yourself on weak questions."
        else:
            priority = "Low"
            suggested_duration = "20-30 mins"
            reason = f"Solid score ({accuracy}%). Periodic refresher to retain knowledge."
            suggested_activity = "Quick 15-minute flashcard review or rapid self-quiz."

        task_id = f"task-{abs(hash(f'{subj_key}-{top_key}')) % 1000000}"
        seen_keys.add((subj_key, top_key))

        generated_tasks.append({
            "id": task_id,
            "subject": subj,
            "topic": top,
            "priority": priority,
            "suggested_duration": suggested_duration,
            "reason": reason,
            "suggested_activity": suggested_activity,
            "exam_date": exam_date_str,
            "days_until_exam": days_left,
            "quiz_accuracy": accuracy,
            "quiz_attempts_count": attempts,
            "is_completed": False,
            "action_link": f"/quiz?from=revision&subject={quote(subj)}&topic={quote(top)}",
        })

    # 4. Integrate Topics from Saved Study Plans (Unassessed or Upcoming)
    for p in plans:
        subj = normalize_subject(p.get("subject"))
        if not subj:
            continue
        subj_key = subj.casefold()
        exam_d = parse_date(p.get("exam_date"))
        days_left = (exam_d - today).days if exam_d and exam_d >= today else None
        exam_date_str = exam_d.isoformat() if exam_d and exam_d >= today else None

        extracted_topics = extract_topics_from_text(p.get("topics"))
        for top in extracted_topics:
            top_key = top.casefold()
            if (subj_key, top_key) in seen_keys:
                continue
            seen_keys.add((subj_key, top_key))

            if days_left is not None and days_left <= 14:
                priority = "High" if days_left <= 5 else "Medium"
                duration = "45 mins"
                reason = f"Upcoming exam in {days_left} days. No completed quizzes on this syllabus topic yet."
                activity = "Study plan syllabus topic: Read summary notes and take a diagnostic AI quiz."
            else:
                priority = "Low"
                duration = "30 mins"
                reason = "Syllabus topic from your saved study plan."
                activity = "Review study plan schedule and outline key principles."

            task_id = f"task-{abs(hash(f'{subj_key}-{top_key}')) % 1000000}"
            generated_tasks.append({
                "id": task_id,
                "subject": subj,
                "topic": top,
                "priority": priority,
                "suggested_duration": duration,
                "reason": reason,
                "suggested_activity": activity,
                "exam_date": exam_date_str,
                "days_until_exam": days_left,
                "quiz_accuracy": None,
                "quiz_attempts_count": 0,
                "is_completed": False,
                "action_link": f"/quiz?from=revision&subject={quote(subj)}&topic={quote(top)}",
            })

    # 5. Order tasks: High priority first, then Medium, then Low; sub-sorted by days until exam
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    generated_tasks.sort(
        key=lambda item: (
            priority_order.get(item["priority"], 3),
            item["days_until_exam"] if item["days_until_exam"] is not None else 9999,
            item["quiz_accuracy"] if item["quiz_accuracy"] is not None else 100.0,
        )
    )

    return generated_tasks


def generate_ai_revision_advice(
    subject: str,
    topic: str,
    priority: str,
    exam_date: Optional[str] = None,
) -> Dict[str, str]:
    """
    Generate deep personalized study tactics using Groq LLM with a resilient fallback.
    """
    exam_context = f"Target exam date: {exam_date}" if exam_date else "No upcoming exam recorded."

    prompt = f"""
You are an expert academic tutor for college students.
Student is preparing to revise:
- Subject: {subject}
- Topic: {topic}
- Priority: {priority}
- Exam Info: {exam_context}

Provide a concise, practical, high-impact revision breakdown:
1. Core Concepts to Remember (3 key points)
2. Memory Aids & Formula Anchors (1-2 mnemonic or conceptual anchors)
3. 3-Step Practice Drill (concrete steps to master the topic today)
4. Common Exam Pitfalls (2 frequent mistakes students make)

Rules:
- Keep the response clear, structured, and student-friendly.
- Avoid unnecessary filler text.
- Do not mention other subjects.
"""

    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            content = response.choices[0].message.content
            if content and content.strip():
                return {
                    "subject": subject,
                    "topic": topic,
                    "advice": content.strip(),
                    "source": "groq",
                }
        except Exception as exc:
            print(f"Groq revision advice error: {exc}")

    # Fallback response if Groq is unavailable
    fallback_text = f"""### Revision Guide: {subject} — {topic}

#### 1. Core Concepts to Master
- Review fundamental definitions, standard notations, and underlying theorems of **{topic}**.
- Break the topic into 2–3 sub-components and identify which ones gave you difficulty in practice questions.
- Focus on understanding *why* the rules apply, not just memorizing steps.

#### 2. Key Memory Anchors
- Create a single-page formula sheet summarizing essential identities or frameworks.
- Use visual diagrams or comparison tables to contrast related concepts.

#### 3. 3-Step Practice Drill
1. **Warmup (10 mins)**: Read lecture notes or textbook summary for {topic}.
2. **Active Recall (25 mins)**: Close your notes and write down the key principles from memory.
3. **Assessment (20 mins)**: Head to the **AI Quiz** module and complete a 5–10 question test on this topic to verify retention.

#### 4. Common Exam Pitfalls
- Rushing through problem statements and misidentifying boundary conditions.
- Skipping step-by-step intermediate calculations under exam time constraints.
"""
    return {
        "subject": subject,
        "topic": topic,
        "advice": fallback_text,
        "source": "fallback",
    }

