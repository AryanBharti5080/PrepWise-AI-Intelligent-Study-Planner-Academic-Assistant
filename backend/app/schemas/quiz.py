from pydantic import BaseModel, Field
from typing import Dict, List, Literal


class QuizGenerateRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    difficulty: Literal["Easy", "Medium", "Hard"]
    total_questions: Literal[5, 10, 15]


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: Dict[str, str]


class QuizAttemptResponse(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: str
    total_questions: int
    score: int
    created_at: str