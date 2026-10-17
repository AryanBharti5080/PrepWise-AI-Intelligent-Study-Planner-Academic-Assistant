import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_study_plan(subject, topics, exam_date, study_hours):
    prompt = f"""
You are PrepWise AI, a professional AI study planner and academic mentor.

Create a personalized, visually attractive, practical study plan for a college student.

## STUDENT DETAILS
- Subject: {subject}
- Topics: {topics}
- Exam Date: {exam_date}
- Available Study Time: {study_hours} hours per day

## STRICT OUTPUT FORMATTING RULES

1. Return valid GitHub-Flavored Markdown (GFM).
2. Use clear Markdown headings: ## and ###.
3. Use relevant emojis in headings and important sections.
4. Use short bullet points instead of long paragraphs.
5. Use **bold text** to highlight important concepts.
6. Use numbered lists for ordered activities.
7. Do not use HTML tags such as <br>, <div>, or <p>.
8. Avoid large Markdown tables. Use headings and bullet lists instead.
9. Keep the layout clean, readable, and easy to scan.
10. Never wrap the entire response in a code block.
11. Do not repeat the student's input unnecessarily.
12. Keep the recommendations realistic and directly related to the supplied topics.
13. Do not invent syllabus topics that are unrelated to the student's subject.
14. Respect the daily study-hour limit.
15. Schedule the plan according to the actual exam date. Do not invent past study dates.
16. If the exam date is today or has passed, provide an appropriate short revision or preparation plan instead of a future multi-day schedule.

## REQUIRED RESPONSE STRUCTURE

# 📚 Your Personalized Study Plan

Start with a brief 1-2 sentence overview mentioning the subject, daily study time, and preparation goal.

## 🗓️ 1. Daily Study Schedule

Organize the schedule by day using this format:

### 📅 Day 1: [Main Topic]

- **⏱️ First session:** [Duration] — [Specific learning activity]
- **📖 Second session:** [Duration] — [Specific learning activity]
- **✍️ Practice:** [Duration] — [Questions, exercises, or examples]
- **🔁 Quick revision:** [Duration] — [Recall or revision activity]

**🎯 Daily Goal:** [One clear, achievable outcome]

Continue for the available preparation period.

Requirements:
- The total time for each day must not exceed the student's available study hours.
- Use only topics relevant to the student's subject and supplied topic list.
- Allocate time sensibly between learning, practice, and revision.
- Include exam-day preparation only when appropriate.
- Do not produce an unnecessarily long schedule.

## 🧠 2. Revision Strategy

Provide 4-6 practical strategies.

For each strategy, use:

### 🔹 [Strategy Name]
- **How to apply:** [Specific action]
- **When to use it:** [Suggested timing]

Include suitable methods such as active recall, spaced repetition, practice questions, and error review.

## ⭐ 3. Important Topics

Identify the most important topics from the student's supplied topics.

For each topic:
- **📌 Topic:** [Topic name]
- **💡 Why it matters:** [Brief explanation]
- **✅ What to prepare:** [Key concepts, definitions, examples, or problems]

Do not claim that a topic is guaranteed to appear in the examination.

## 🚀 4. Smart Study Tips

Provide 5-7 concise, actionable tips.

Use a relevant emoji for each tip and explain how it helps the student.

## 🏁 Final Motivation

End with a short, encouraging sentence.

## FINAL VALIDATION

Before returning the response, verify that:
- All four required sections are present.
- Markdown headings and bullet points are properly formatted.
- No HTML tags are used.
- No oversized tables are used.
- The daily schedule respects the available study time.
- The plan is relevant to the subject and exam date.
- The output is readable when rendered using ReactMarkdown.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.5,
    )

    return response.choices[0].message.content